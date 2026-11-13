const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const { isDbConnected, escapeRegex } = require('./http');

// gemini-1.5-flash (the old hard-coded model) has been retired by Google; the model
// is configurable so it can be updated without a code change.
const DEFAULT_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 20000;
const EMERGENCY_TAG = '[EMERGENCY]';

const EMERGENCY_KEYWORDS = [
  'chest pain', 'breathing difficulty', 'difficulty breathing', 'shortness of breath', "can't breathe", 'cannot breathe',
  'not breathing', 'unconscious', 'unresponsive', 'fainted', 'severe bleeding', 'heavy bleeding', 'stroke', 'paralysis',
  'seizure', 'severe allergic reaction', 'anaphylaxis', 'heart attack', 'choking', 'overdose', 'poisoning', 'severe burn',
];
const SELF_HARM_KEYWORDS = ['suicide', 'suicidal', 'kill myself', 'end my life', 'self harm', 'self-harm', 'hurt myself'];
const APPOINTMENT_KEYWORDS = ['appointment', 'book', 'doctor', 'consult', 'specialist', 'checkup', 'check-up'];

// Keyword -> specialization stored in the Doctor collection.
const SPECIALIZATION_KEYWORDS = [
  [['cardiolog', 'heart'], 'Cardiologist'],
  [['pediatric', 'paediatric', 'child', 'infant', 'toddler'], 'Pediatrician'],
  [['dermatolog', 'skin', 'rash', 'acne'], 'Dermatologist'],
  [['neurolog', 'migraine', 'brain'], 'Neurologist'],
  [['orthop', 'bone', 'fracture', 'joint pain', 'knee', 'back pain'], 'Orthopedist'],
  [['gynec', 'gynaec', 'pregnan', 'menstrua'], 'Gynecologist'],
  [['oncolog', 'cancer', 'tumor', 'tumour'], 'Oncologist'],
  [['psychiatr', 'anxiety', 'depress', 'mental health'], 'Psychiatrist'],
  [['ophthalm', 'eye', 'vision'], 'Ophthalmologist'],
  [['general physician', 'general medicine', 'physician'], 'General Medicine'],
];

const includesAny = (text, keywords) => keywords.some((k) => text.includes(k));

const detectSpecialization = (msg) => {
  const match = SPECIALIZATION_KEYWORDS.find(([keywords]) => includesAny(msg, keywords));
  return match ? match[1] : null;
};

const EMERGENCY_REPLY =
  "⚠️ EMERGENCY DETECTED: Based on your description of symptoms, you may be experiencing a critical medical emergency. Please seek immediate professional medical attention.\n\n" +
  "👉 Click the red 'EMERGENCY' button to locate the nearest emergency facilities with ICU/bed resources and call for assistance directly.\n\n" +
  'Disclaimer: I am an AI, not a doctor. In an emergency, dial local emergency services (like 102/108/112) or go to the nearest ER immediately.';

const SELF_HARM_REPLY =
  "I'm really sorry you're going through this. You don't have to face it alone, and talking to someone right now can help.\n\n" +
  '- Call **Tele-MANAS (24x7, free): 14416** or **1-800-891-4416**\n' +
  '- If you are in immediate danger, call **112** or go to the nearest emergency room.\n\n' +
  'If you can, please reach out to someone you trust and let them know how you are feeling.';

// Local rule engine used when GEMINI_API_KEY is not configured or the API fails.
const fallbackAIChat = async (message) => {
  const msg = message.toLowerCase();

  if (includesAny(msg, SELF_HARM_KEYWORDS)) {
    return { reply: SELF_HARM_REPLY, isEmergency: true };
  }

  // 1. Emergency symptom check
  if (includesAny(msg, EMERGENCY_KEYWORDS)) {
    return { reply: EMERGENCY_REPLY, isEmergency: true };
  }

  // 2. Hospital / ICU / resource discovery
  if (/\b(icu|beds?|blood|ventilators?|hospitals?)\b/.test(msg) && isDbConnected()) {
    try {
      const wantsBlood = /\bblood\b/.test(msg);
      const hospitals = await Hospital.find({ verifiedStatus: 'verified' })
        .select('name beds bloodInventory')
        .sort({ 'beds.icuAvailable': -1 })
        .limit(3)
        .lean();
      if (hospitals.length > 0) {
        let response = 'Here are SwasthyaSetu hospitals with the most resources available right now:\n\n';
        hospitals.forEach((h) => {
          const beds = h.beds || {};
          let line = `- **${h.name}**: ICU Beds: ${beds.icuAvailable || 0} available | Emergency Beds: ${beds.emergencyAvailable || 0} available`;
          if (wantsBlood) {
            const units = Object.values(h.bloodInventory || {}).reduce((sum, g) => sum + ((g && g.availableUnits) || 0), 0);
            line += ` | Blood: ${units} units`;
          }
          response += `${line}.\n`;
        });
        response += "\nUse the 'Find Hospital' page to search by distance, department or ICU availability.";
        return { reply: response };
      }
    } catch (err) {
      // fall through to the next rule
    }
  }

  // 3. Appointment / doctor scheduling (filtered by the specialist the user asked for)
  const specialization = detectSpecialization(msg);
  if (includesAny(msg, APPOINTMENT_KEYWORDS) || specialization) {
    if (isDbConnected()) {
      try {
        const query = specialization ? { specialization: { $regex: escapeRegex(specialization), $options: 'i' } } : {};
        const doctors = (
          await Doctor.find({ ...query, status: 'available' }).populate('hospital', 'name verifiedStatus').limit(20)
        )
          .filter((d) => d.hospital && d.hospital.verifiedStatus === 'verified')
          .slice(0, 3);
        if (doctors.length > 0) {
          let response = `Here are some ${specialization ? `${specialization} ` : ''}doctors available for appointments:\n\n`;
          doctors.forEach((d) => {
            const slots = ((d.schedule && d.schedule.slots) || []).slice(0, 2).join(', ');
            const days = ((d.schedule && d.schedule.days) || []).join(', ');
            response += `- **Dr. ${d.name}** (${d.specialization}) at ${d.hospital.name}${days ? ` — ${days}` : ''}${slots ? ` (e.g. ${slots})` : ''}.\n`;
          });
          response += '\nWould you like me to guide you to the Appointment page to schedule one?';
          return { reply: response, suggestAppointment: true };
        }
      } catch (err) {
        // fall through to the next rule
      }
    }
    return {
      reply: `You can book ${specialization ? `a ${specialization}` : 'a doctor'} from the 'Find Hospital' page: pick a hospital, then choose a doctor, date and time slot.`,
      suggestAppointment: true,
    };
  }

  // 4. Minor condition self-care guidance
  if (/\b(fever|cold|cough|headache|sore throat)\b/.test(msg)) {
    return {
      reply:
        'For minor symptoms like a mild cold, cough, or simple headache:\n- Ensure plenty of rest and stay hydrated.\n- Warm fluids like tea, broth, or water can help soothe throat irritation.\n- Commonly available OTC (Over-The-Counter) remedies like saline nasal sprays or generic throat lozenges might provide temporary relief.\n\n⚠️ DISCLAIMER: This information is for general educational purposes. I do not prescribe medicines. If symptoms persist for more than 48 hours or worsen, please consult a qualified healthcare professional.',
      isSymptomAdvice: true,
    };
  }

  // 5. General FAQ
  return {
    reply: `Hello! I am **CareAI**, your medical coordination assistant. I can help you:
1. Identify emergency warning signs (chest pain, breathing difficulties).
2. Discover hospitals and real-time resource availability.
3. Suggest available doctors and assist with appointment booking.
4. Provide general health information for minor symptoms.

How can I help you today?

*Disclaimer: CareAI provides general information and does not replace professional medical advice, diagnosis, or treatment. In emergencies, please seek immediate help.*`,
  };
};

const SYSTEM_INSTRUCTION = `You are CareAI, a professional and helpful healthcare coordination assistant for the SwasthyaSetu app in India.
Your capabilities:
1. Help users discover hospitals, available beds, ICU, and blood units.
2. Guide users with symptom analysis.
3. Help users schedule doctor appointments (on the 'Find Hospital' page).

CRITICAL MEDICAL RULES:
- Never diagnose a patient or prescribe specific prescription medicines.
- If the symptoms sound dangerous (chest pain, shortness of breath, severe bleeding, allergic reaction, sudden weakness, unconsciousness, thoughts of self-harm), start your reply with the exact tag ${EMERGENCY_TAG}, then tell the user IMMEDIATELY that this is a potential emergency and advise them to click the red EMERGENCY button on SwasthyaSetu or dial 102/108/112. Never use that tag otherwise.
- Provide general, educational information for minor issues (cold, fever) recommending OTC categories only when appropriate, with clear disclaimers.
- Always output a short medical disclaimer.
- Keep responses concise and formatted in markdown.`;

/** Gemini requires history to start with a user turn and alternate user/model. */
const toGeminiHistory = (chatHistory = []) => {
  const history = [];
  chatHistory.forEach((h) => {
    if (!h || typeof h.text !== 'string' || !h.text.trim()) return;
    const role = h.sender === 'user' ? 'user' : 'model';
    if (history.length === 0 && role !== 'user') return;
    const last = history[history.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += `\n${h.text}`;
    } else {
      history.push({ role, parts: [{ text: h.text }] });
    }
  });
  // The new message is sent as a user turn, so the history must end with the model.
  if (history.length && history[history.length - 1].role === 'user') history.pop();
  return history;
};

const getAIResponse = async (prompt, chatHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const lowerPrompt = prompt.toLowerCase();

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.startsWith('your_')) {
    return fallbackAIChat(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      {
        model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { maxOutputTokens: 2048 },
      },
      { timeout: REQUEST_TIMEOUT_MS }
    );

    const chat = model.startChat({ history: toGeminiHistory(chatHistory) });
    const result = await chat.sendMessage(prompt);
    let responseText = (result.response.text() || '').trim();
    if (!responseText) throw new Error('Empty response from Gemini');

    // Emergency flag: the model's explicit tag or the user's own words. The old check
    // ("emergency" anywhere in the reply) fired on almost every answer because the
    // required disclaimer mentions emergencies.
    const taggedEmergency = responseText.startsWith(EMERGENCY_TAG);
    if (taggedEmergency) responseText = responseText.slice(EMERGENCY_TAG.length).trim();
    const isEmergency =
      taggedEmergency || includesAny(lowerPrompt, EMERGENCY_KEYWORDS) || includesAny(lowerPrompt, SELF_HARM_KEYWORDS);

    return {
      reply: responseText,
      isEmergency,
      suggestAppointment: !isEmergency && (includesAny(lowerPrompt, APPOINTMENT_KEYWORDS) || !!detectSpecialization(lowerPrompt)),
    };
  } catch (error) {
    console.error('Gemini API Error, falling back to rule engine:', error.message);
    return fallbackAIChat(prompt);
  }
};

module.exports = { getAIResponse, fallbackAIChat, toGeminiHistory };
