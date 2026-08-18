const { GoogleGenerativeAI } = require('@google/generative-ai');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

// Helper fallback for local responses when GEMINI_API_KEY is not defined
const fallbackAIChat = async (message, context = {}) => {
  const msg = message.toLowerCase();
  
  // 1. Emergency Symptom Check
  const emergencyKeywords = ['chest pain', 'breathing difficulty', 'difficulty breathing', 'unconscious', 'severe bleeding', 'stroke', 'paralysis', 'severe allergic reaction', 'heart attack', 'choking'];
  if (emergencyKeywords.some(keyword => msg.includes(keyword))) {
    return {
      reply: `⚠️ EMERGENCY DETECTED: Based on your description of symptoms, you may be experiencing a critical medical emergency. Please seek immediate professional medical attention.\n\n👉 Click the red 'EMERGENCY' button on your dashboard to locate the nearest emergency facilities with ICU/bed resources and call for assistance directly.\n\nDisclaimer: I am an AI, not a doctor. In an emergency, dial local emergency services (like 102/108) or go to the nearest ER immediately.`,
      isEmergency: true
    };
  }

  // 2. Hospital / ICU / Resource Discovery Request
  if (msg.includes('icu') || msg.includes('bed') || msg.includes('blood') || msg.includes('ventilator') || msg.includes('hospital')) {
    try {
      const hospitals = await Hospital.find({ verifiedStatus: 'verified' }).limit(3);
      if (hospitals.length > 0) {
        let response = `I found some hospitals connected to SwasthyaSetu near you:\n\n`;
        hospitals.forEach(h => {
          response += `- **${h.name}**: ICU Beds: ${h.beds.icuAvailable} available | Emergency Beds: ${h.beds.emergencyAvailable} available.\n`;
        });
        response += `\nYou can search the full database using the 'Find Hospital' tool on the dashboard.`;
        return { reply: response };
      }
    } catch (err) {
      // pass
    }
  }

  // 3. Appointment / Doctor scheduling
  if (msg.includes('appointment') || msg.includes('doctor') || msg.includes('dermatologist') || msg.includes('cardiologist') || msg.includes('pediatrician')) {
    try {
      let spec = 'General Medicine';
      if (msg.includes('dermatologist')) spec = 'Dermatologist';
      if (msg.includes('cardiologist')) spec = 'Cardiologist';
      if (msg.includes('pediatrician')) spec = 'Pediatrician';
      
      const doctors = await Doctor.find().populate('hospital', 'name').limit(3);
      if (doctors.length > 0) {
        let response = `Here are some doctors available for appointments:\n\n`;
        doctors.forEach(d => {
          response += `- **Dr. ${d.name}** (${d.specialization}) at ${d.hospital.name}. Slots: ${d.schedule.slots[0]}, ${d.schedule.slots[1]}.\n`;
        });
        response += `\nWould you like me to guide you to the Appointment page to schedule one?`;
        return { reply: response, suggestAppointment: true };
      }
    } catch (err) {
      // pass
    }
  }

  // 4. Minor Condition Self-Care Guidance
  if (msg.includes('fever') || msg.includes('cold') || msg.includes('cough') || msg.includes('headache')) {
    return {
      reply: `For minor symptoms like a mild cold, cough, or simple headache:\n- Ensure plenty of rest and stay hydrated.\n- Warm fluids like tea, broth, or water can help soothe throat irritation.\n- Commonly available OTC (Over-The-Counter) remedies like saline nasal sprays or generic throat lozenges might provide temporary relief.\n\n⚠️ DISCLAIMER: This information is for general educational purposes. I do not prescribe medicines. If symptoms persist for more than 48 hours or worsen, please consult a qualified healthcare professional.`,
      isSymptomAdvice: true
    };
  }

  // 5. General FAQ
  return {
    reply: `Hello! I am **CareAI**, your medical coordination assistant. I can help you:
1. Identify emergency warning signs (chest pain, breathing difficulties).
2. Discover nearby hospitals and real-time resource availability.
3. Suggest available doctors and assist with appointment booking.
4. Provide general health information for minor symptoms.

How can I help you today?
\n*Disclaimer: CareAI provides general information and does not replace professional medical advice, diagnosis, or treatment. In emergencies, please seek immediate help.*`
  };
};

const getAIResponse = async (prompt, chatHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return await fallbackAIChat(prompt);
  }

  try {
    // If Gemini key is set, configure GoogleGenerativeAI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build medical instruction wrapper
    const systemInstruction = `You are CareAI, a professional and helpful healthcare coordination assistant for the SwasthyaSetu app.
    Your capabilities:
    1. Help users discover hospitals, available beds, ICU, and blood units.
    2. Guide users with symptom analysis.
    3. Help user schedule doctor appointments.
    
    CRITICAL MEDICAL RULES:
    - Never diagnose a patient or prescribe specific prescription medicines.
    - If symptoms sound dangerous (chest pain, shortness of breath, severe bleeding, allergic reaction, sudden weakness, unconsciousness), tell the user IMMEDIATELY that this is a potential emergency, and advise them to click the red EMERGENCY button on SwasthyaSetu.
    - Provide general, educational information for minor issues (cold, fever) recommending OTC categories only when appropriate, with clear disclaimers.
    - Always output a clear medical disclaimer.
    - Keep responses concise and formatted in markdown.`;

    const chat = model.startChat({
      history: chatHistory.map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      })),
      generationConfig: {
        maxOutputTokens: 500,
      },
      systemInstruction
    });

    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // Check if the response hints at an emergency
    const lowerText = responseText.toLowerCase();
    const isEmergency = lowerText.includes('emergency') || lowerText.includes('critical') || lowerText.includes('er ') || lowerText.includes('red button');

    return {
      reply: responseText,
      isEmergency
    };
  } catch (error) {
    console.error('Gemini API Error, falling back to rule engine:', error.message);
    return await fallbackAIChat(prompt);
  }
};

module.exports = { getAIResponse };
