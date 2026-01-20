/* ==========================================================================
   MODULE: AI AGENT (PROCESS 4.0)
   File: js/modules/ai_agent.js
   Description: "Human-in-the-Loop" Legal Inference Engine.
   Logic: Tries Real AI (Gemini API) first -> Falls back to Local DB if offline.
   ========================================================================== */

import { DB } from './db.js';

// CONFIGURATION
// To get a key: https://aistudio.google.com/app/apikey
// For the MVP, if this is empty, it uses "Offline Mode" automatically.
const GEMINI_API_KEY = ""; 
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const AIAgent = {

    // MAIN FUNCTION: Analyze the Officer's Text Input
    analyze: async (offenseDescription) => {
        console.log(`[AI Agent] Analyzing: "${offenseDescription}"`);

        // CHECK 1: Is there an API Key?
        if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
            console.warn("[AI Agent] No API Key found. Switching to Local Offline Mode.");
            return runLocalInference(offenseDescription);
        }

        // CHECK 2: Are we Online?
        if (!navigator.onLine) {
            console.warn("[AI Agent] Device Offline. Switching to Local Offline Mode.");
            return runLocalInference(offenseDescription);
        }

        // TRY REAL AI EXECUTION
        try {
            const result = await callGeminiAPI(offenseDescription);
            return result;
        } catch (error) {
            console.error("[AI Agent] API Error:", error);
            alert("AI Cloud Unreachable. Using Local Laws Database.");
            return runLocalInference(offenseDescription);
        }
    }
};

// ---------------------------------------------------------
// STRATEGY A: THE REAL AI (Google Gemini API)
// ---------------------------------------------------------
async function callGeminiAPI(text) {
    // 1. Construct the Prompt (The "System Instruction")
    const prompt = `
        You are a Zimbabwe Republic Police Legal Assistant. 
        Your job is to map a description of a traffic offense to the correct law.
        
        CONTEXT:
        - Road Traffic Act [Chapter 13:11]
        - Statutory Instrument 154 of 2010 (SI 154)

        INPUT: "${text}"

        INSTRUCTIONS:
        Return ONLY a raw JSON object (no markdown, no backticks).
        Format:
        {
            "charge": "Short legal name of offense",
            "act": "The Act Name",
            "section": "The Section Number",
            "fine_amount": 20 (Integer, estimate based on ZRP standard),
            "is_safety_critical": true/false (True if tires, brakes, lights)
        }
    `;

    // 2. Make the HTTP Request
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const data = await response.json();
    
    // 3. Parse the Result
    try {
        const aiText = data.candidates[0].content.parts[0].text;
        // Clean markdown if the AI adds it (```json ... ```)
        const jsonString = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);
    } catch (e) {
        throw new Error("Failed to parse AI response");
    }
}

// ---------------------------------------------------------
// STRATEGY B: THE LOCAL FALLBACK (Offline Mode)
// ---------------------------------------------------------
function runLocalInference(text) {
    // Uses the "keyword matcher" we built in Stage 2
    const match = DB.findStatutoryCode(text);

    if (match) {
        return {
            charge: match.charge,
            act: match.act,
            section: match.section,
            fine_amount: match.fine_amount,
            is_safety_critical: match.is_safety_critical
        };
    } else {
        // Default "Not Found" response
        return {
            charge: "Unidentified Offense - Manual Entry Required",
            act: "Road Traffic Act",
            section: "General Section",
            fine_amount: 0,
            is_safety_critical: false
        };
    }
}