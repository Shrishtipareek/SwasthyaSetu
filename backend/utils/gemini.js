const { GoogleGenAI } = require("@google/genai");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");

const emergencyKeywords = [
  "severe chest pain",
  "chest pain or pressure",
  "difficulty breathing",
  "shortness of breath",
  "severe bleeding",
  "unconscious",
  "stroke",
  "paralysis",
  "choking",
  "severe allergic reaction",
  "heart attack",
  "loss of consciousness",
  "cannot breathe",
  "can't breathe",
  "fainted",
  "fainting",
  "heavy bleeding",
  "blue lips",
  "severe abdominal pain"
];

const symptomDatabase = {
  fever: {
    causes: [
      "Viral infection such as flu or a common viral illness",
      "Bacterial infection",
      "Other infections or inflammatory conditions"
    ],
    symptoms: [
      "Chills",
      "Sweating",
      "Body aches",
      "Weakness",
      "Headache"
    ],
    advice: [
      "Rest and drink enough fluids.",
      "Monitor your temperature.",
      "Avoid strenuous activity while you are unwell."
    ],
    specialist: "General Physician"
  },

  headache: {
    causes: [
      "Tension headache",
      "Migraine",
      "Dehydration or lack of sleep"
    ],
    symptoms: [
      "Pressure or throbbing pain",
      "Sensitivity to light",
      "Nausea",
      "Fatigue"
    ],
    advice: [
      "Rest in a quiet environment.",
      "Drink enough water.",
      "Try to maintain regular sleep and meals."
    ],
    specialist: "General Physician"
  },

  nausea: {
    causes: [
      "Stomach infection",
      "Food poisoning or food-related illness",
      "Indigestion",
      "Medication side effects",
      "Motion sickness"
    ],
    symptoms: [
      "Feeling like vomiting",
      "Loss of appetite",
      "Stomach discomfort",
      "Dizziness"
    ],
    advice: [
      "Take small, frequent sips of water or ORS.",
      "Eat light foods when you can tolerate them.",
      "Avoid heavy, oily or spicy foods temporarily.",
      "Rest and monitor your symptoms."
    ],
    specialist: "General Physician"
  },

  vomiting: {
    causes: [
      "Stomach infection",
      "Food poisoning",
      "Indigestion",
      "Medication side effects",
      "Migraine or other conditions"
    ],
    symptoms: [
      "Nausea",
      "Stomach discomfort",
      "Weakness",
      "Loss of appetite"
    ],
    advice: [
      "Take small frequent sips of water or ORS.",
      "Avoid eating large meals immediately after vomiting.",
      "Rest and monitor for signs of dehydration."
    ],
    specialist: "General Physician"
  },

  cough: {
    causes: [
      "Common cold or viral infection",
      "Allergies",
      "Airway irritation",
      "Respiratory infection"
    ],
    symptoms: [
      "Sore throat",
      "Mucus",
      "Chest discomfort",
      "Runny or blocked nose"
    ],
    advice: [
      "Drink enough fluids.",
      "Avoid smoke, dust and other airway irritants.",
      "Rest adequately."
    ],
    specialist: "General Physician"
  },

  "sore throat": {
    causes: [
      "Viral infection",
      "Bacterial throat infection",
      "Allergies or irritation"
    ],
    symptoms: [
      "Pain while swallowing",
      "Cough",
      "Runny nose",
      "Fever"
    ],
    advice: [
      "Drink warm or comfortable-temperature fluids.",
      "Rest your voice.",
      "Stay hydrated."
    ],
    specialist: "General Physician"
  },

  "stomach pain": {
    causes: [
      "Indigestion",
      "Gas or acidity",
      "Stomach infection",
      "Food-related illness"
    ],
    symptoms: [
      "Bloating",
      "Nausea",
      "Vomiting",
      "Changes in bowel movements"
    ],
    advice: [
      "Stay hydrated.",
      "Eat light meals if you can tolerate food.",
      "Avoid foods that clearly worsen your symptoms."
    ],
    specialist: "General Physician"
  },

  dizziness: {
    causes: [
      "Dehydration",
      "Low blood pressure",
      "Lack of food or sleep",
      "Inner-ear problems"
    ],
    symptoms: [
      "Feeling unsteady",
      "Lightheadedness",
      "Weakness",
      "Nausea"
    ],
    advice: [
      "Sit or lie down safely if you feel dizzy.",
      "Drink fluids if dehydration may be contributing.",
      "Avoid driving or operating machinery while dizzy."
    ],
    specialist: "General Physician"
  },

  "joint pain": {
    causes: [
      "Muscle or joint strain",
      "Inflammation",
      "Viral illness",
      "Other musculoskeletal conditions"
    ],
    symptoms: [
      "Stiffness",
      "Swelling",
      "Tenderness",
      "Reduced movement"
    ],
    advice: [
      "Rest the affected joint.",
      "Avoid activities that increase the pain.",
      "Monitor for swelling, fever or worsening pain."
    ],
    specialist: "General Physician"
  },

  "body ache": {
    causes: [
      "Viral infection",
      "Physical exertion",
      "Poor sleep",
      "Dehydration"
    ],
    symptoms: [
      "Muscle soreness",
      "Fatigue",
      "Weakness",
      "Fever or chills"
    ],
    advice: [
      "Rest adequately.",
      "Stay hydrated.",
      "Monitor for fever or other worsening symptoms."
    ],
    specialist: "General Physician"
  },

  cold: {
    causes: [
      "Common viral respiratory infection",
      "Allergies",
      "Environmental irritation"
    ],
    symptoms: [
      "Runny nose",
      "Blocked nose",
      "Sneezing",
      "Sore throat",
      "Cough"
    ],
    advice: [
      "Stay hydrated.",
      "Rest adequately.",
      "Avoid smoke and other irritants."
    ],
    specialist: "General Physician"
  },

  rash: {
    causes: [
      "Allergic reaction",
      "Skin irritation",
      "Infection",
      "Heat or environmental exposure"
    ],
    symptoms: [
      "Redness",
      "Itching",
      "Skin irritation",
      "Swelling"
    ],
    advice: [
      "Avoid any newly introduced product that may be irritating the skin.",
      "Keep the affected area clean.",
      "Seek medical advice if the rash spreads or worsens."
    ],
    specialist: "Dermatologist"
  },

  "shortness of breath": {
    causes: [
      "Respiratory infection",
      "Asthma or airway problems",
      "Allergic reaction",
      "Heart or lung conditions"
    ],
    symptoms: [
      "Breathing difficulty",
      "Chest tightness",
      "Wheezing",
      "Rapid breathing"
    ],
    advice: [
      "Sit upright and remain calm.",
      "Avoid physical exertion.",
      "Seek urgent medical assessment if breathing difficulty is significant or worsening."
    ],
    specialist: "General Physician"
  }
};

const fallbackAIChat = async (message) => {
  const msg = String(message || "").toLowerCase().trim();

  if (!msg) {
    return {
      reply: `## Symptom Information

Please enter at least one symptom such as **fever, headache, nausea, cough, stomach pain, dizziness, rash, or joint pain**.`,
      isEmergency: false,
      suggestAppointment: false
    };
  }

  const emergencyDetected = emergencyKeywords.some((keyword) =>
    msg.includes(keyword)
  );

  if (emergencyDetected) {
    return {
      reply: `## ⚠️ Possible Emergency

The symptoms you entered may require urgent medical attention.

### What to do now

- Seek immediate medical care.
- If symptoms are severe or rapidly worsening, contact local emergency services.
- Do not delay emergency evaluation based on an AI response.

### Important

CareAI provides preliminary health information and does not diagnose medical conditions.

**Disclaimer:** This is general health information and is not a medical diagnosis.`,
      isEmergency: true,
      suggestAppointment: false
    };
  }

  if (
    msg.includes("icu") ||
    msg.includes("bed") ||
    msg.includes("blood") ||
    msg.includes("ventilator") ||
    msg.includes("hospital")
  ) {
    try {
      const hospitals = await Hospital.find({
        verifiedStatus: "verified"
      }).limit(3);

      if (hospitals.length > 0) {
        let reply = "## Nearby Healthcare Resources\n\n";

        hospitals.forEach((hospital) => {
          reply += `- **${hospital.name}**`;

          if (hospital.beds) {
            reply += ` — ICU beds: ${hospital.beds.icuAvailable ?? 0
              }, Emergency beds: ${hospital.beds.emergencyAvailable ?? 0
              }`;
          }

          reply += "\n";
        });

        return {
          reply,
          isEmergency: false,
          suggestAppointment: false
        };
      }
    } catch (error) {
      console.error("Hospital lookup error:", error.message);
    }
  }

  if (
    msg.includes("appointment") ||
    msg.includes("doctor") ||
    msg.includes("dermatologist") ||
    msg.includes("cardiologist") ||
    msg.includes("pediatrician") ||
    msg.includes("gastroenterologist")
  ) {
    try {
      const doctors = await Doctor.find()
        .populate("hospital", "name")
        .limit(3);

      if (doctors.length > 0) {
        let reply = "## Available Doctors\n\n";

        doctors.forEach((doctor) => {
          reply += `- **Dr. ${doctor.name}** — ${doctor.specialization}`;

          if (doctor.hospital) {
            reply += ` at ${doctor.hospital.name}`;
          }

          reply += "\n";
        });

        return {
          reply,
          isEmergency: false,
          suggestAppointment: true
        };
      }
    } catch (error) {
      console.error("Doctor lookup error:", error.message);
    }
  }

  const matchedSymptoms = Object.keys(symptomDatabase).filter(
    (symptom) => msg.includes(symptom)
  );

  if (matchedSymptoms.length > 0) {
    const causes = new Set();
    const associatedSymptoms = new Set();
    const advice = new Set();
    const specialists = new Set();

    matchedSymptoms.forEach((symptom) => {
      symptomDatabase[symptom].causes.forEach((item) =>
        causes.add(item)
      );

      symptomDatabase[symptom].symptoms.forEach((item) =>
        associatedSymptoms.add(item)
      );

      symptomDatabase[symptom].advice.forEach((item) =>
        advice.add(item)
      );

      specialists.add(symptomDatabase[symptom].specialist);
    });

    let reply = `## Preliminary Analysis

The symptom${matchedSymptoms.length > 1 ? "s" : ""
      } you entered may have several possible causes. The information below is general guidance and does not establish a diagnosis.

## Possible Causes

`;

    causes.forEach((item) => {
      reply += `- ${item}\n`;
    });

    reply += "\n## Common Associated Symptoms\n\n";

    associatedSymptoms.forEach((item) => {
      reply += `- ${item}\n`;
    });

    reply += "\n## What You Can Do\n\n";

    advice.forEach((item) => {
      reply += `- ${item}\n`;
    });

    reply += `

## When to Seek Medical Help

Seek urgent medical attention if symptoms are severe, rapidly worsening, or associated with difficulty breathing, severe chest pain, fainting, confusion, heavy bleeding, or another emergency warning sign.

## Suggested Specialist

${Array.from(specialists).join(", ")}

**Disclaimer:** This is AI-generated preliminary health information and is not a medical diagnosis or a substitute for professional medical care.`;

    return {
      reply,
      isEmergency: false,
      suggestAppointment: false
    };
  }

  return {
    reply: `## Preliminary Analysis

You entered: **${message}**

This symptom or health concern can have different causes depending on its duration, severity, age, medical history, and other symptoms.

## What You Can Do

- Monitor how the symptom changes.
- Stay hydrated and rest when appropriate.
- Avoid anything that clearly makes the symptom worse.

## When to Seek Medical Help

Seek urgent medical attention if you develop difficulty breathing, severe chest pain, fainting, confusion, heavy bleeding, or rapidly worsening symptoms.

## Suggested Specialist

General Physician

**Disclaimer:** This is general preliminary health information and is not a medical diagnosis or a substitute for professional medical care.`,
    isEmergency: false,
    suggestAppointment: false
  };
};

const getAIResponse = async (prompt, chatHistory = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (
    !apiKey ||
    apiKey === "your_gemini_api_key_here" ||
    apiKey === "YOUR_ACTUAL_GEMINI_API_KEY"
  ) {
    console.error("GEMINI_API_KEY is missing or invalid.");
    return fallbackAIChat(prompt);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey
    });

    const historyText = chatHistory
      .slice(-10)
      .map((item) => {
        const sender =
          item.sender === "user" ? "User" : "CareAI";

        return `${sender}: ${item.text}`;
      })
      .join("\n");

    const systemInstruction = `
You are CareAI, an AI health information assistant inside the SwasthyaSetu public healthcare platform.

The user may enter a very short symptom, a single word, multiple symptoms, a selected symptom option, or a detailed description.

Examples of valid inputs:
- fever
- headache
- nausea
- cough
- joint pain
- stomach pain
- I have fever and body ache
- I have been feeling nauseous since morning
- High Fever & Cold Chills

Every non-empty symptom input must receive a useful answer.

IMPORTANT RULES:

1. Analyze the exact symptom or symptoms provided by the user.
2. A single-word symptom is a valid query.
3. Never ask the user to describe their symptoms again when they have already provided a symptom.
4. Never respond with only "Please describe your symptoms."
5. Do not provide a definitive diagnosis.
6. Explain possible causes as possibilities only.
7. Mention relevant associated symptoms when useful.
8. Give practical general-care guidance.
9. Mention important warning signs.
10. Explain when medical attention is appropriate.
11. Suggest an appropriate doctor specialization when reasonable.
12. Never prescribe prescription medicines.
13. Never provide exact medication dosages.
14. Keep the language simple and easy to understand.
15. Do not unnecessarily repeat the user's input.
16. If the symptoms could indicate an emergency, clearly advise immediate medical attention.
17. Do not claim certainty.
18. Use Markdown headings and bullet points.
19. Always include a short disclaimer.
20. If the user asks about hospitals, beds, ICU, blood, doctors or appointments, provide useful information relevant to that request.
21. If the user provides multiple symptoms, analyze them together.
22. Do not force the user to provide duration or severity before giving preliminary information.
23. If additional details would improve the assessment, provide the preliminary answer first and then mention what additional information could help.

For symptom queries use:

## Preliminary Analysis

## Possible Causes

## Common Associated Symptoms

## What You Can Do

## When to Seek Medical Help

## Suggested Specialist

**Disclaimer:** This is AI-generated preliminary health information and is not a medical diagnosis or a substitute for professional medical care.

Previous conversation:
${historyText || "No previous conversation."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 1200
      }
    });

    const responseText =
      typeof response.text === "function"
        ? response.text()
        : response.text;

    if (!responseText || !String(responseText).trim()) {
      throw new Error("Gemini returned an empty response");
    }

    const lowerPrompt = prompt.toLowerCase();
    const lowerResponse = String(responseText).toLowerCase();

    const isEmergency =
      emergencyKeywords.some((keyword) =>
        lowerPrompt.includes(keyword)
      ) ||
      lowerResponse.includes("possible emergency") ||
      lowerResponse.includes("immediate medical attention") ||
      lowerResponse.includes("seek emergency");

    const suggestAppointment =
      lowerResponse.includes("general physician") ||
      lowerResponse.includes("specialist") ||
      lowerResponse.includes("doctor");

    return {
      reply: String(responseText),
      isEmergency,
      suggestAppointment
    };
  } catch (error) {
    console.error(
      "Gemini API Error:",
      error.response?.data || error.message
    );

    return fallbackAIChat(prompt);
  }
};

module.exports = {
  getAIResponse
};