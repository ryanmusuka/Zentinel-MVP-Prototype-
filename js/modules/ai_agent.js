/* ==========================================================================
   MODULE: LOCAL SEARCH AGENT (NO API REQUIRED)
   File: js/modules/ai_agent.js
   Description: Scans 'zrp_laws.txt' locally for keywords and has a built-in cheat sheet for prototype-purposes only.
   ========================================================================== */

let ZIMBABWE_LAW_TEXT = "";

// 1. LOAD THE LAWS (Background Process)
async function loadLaws() {
    try {
        const response = await fetch('zrp_laws.txt');
        if (response.ok) {
            ZIMBABWE_LAW_TEXT = await response.text();
            console.log(`[ZRP Agent] Laws loaded successfully.`);
        }
    } catch (error) {
        console.warn("[ZRP Agent] Law file not found. Using internal cheat sheet only.");
    }
}
loadLaws();

export const AIAgent = {
    analyze: async (userText) => {
        console.log(`[ZRP Agent] Analyzing: "${userText}"`);

        // Fake "Thinking" delay for the UI (0.8 seconds)
        await new Promise(r => setTimeout(r, 800));

        const query = userText.toLowerCase();

        // ---------------------------------------------------------
        // LEVEL 1: THE CHEAT SHEET (Guaranteed Hits)
        // ---------------------------------------------------------
        
        // 1. SPEEDING
        if (query.includes("speed") || query.includes("fast") || query.includes("limit")) {
            return {
                charge: "Exceeding Speed Limit",
                act: "Road Traffic Act (Chapter 13:11)",
                section: "Section 76",
                fine_amount: 30, // Level 3 Fine
                is_safety_critical: true,
                description: "No person shall drive a vehicle upon any road at a speed in excess of the speed limit prescribed for that road."
            };
        }

        // 2. DRIVERS LICENSE
        if (query.includes("licence") || query.includes("license")) {
            return {
                charge: "Driving Without a License",
                act: "Road Traffic Act (Chapter 13:11)",
                section: "Section 6",
                fine_amount: 20,
                is_safety_critical: false,
                description: "No person shall drive a motor vehicle on a road unless he is the holder of a valid licence in respect of that class of motor vehicle."
            };
        }

        // 3. INDICATORS / SIGNALS
        if (query.includes("signal") || query.includes("indicate") || query.includes("turn")) {
            return {
                charge: "Failure to Signal",
                act: "Statutory Instrument 154",
                section: "Section 39",
                fine_amount: 20,
                is_safety_critical: true,
                description: "The driver of a vehicle on a road shall not turn or move across the path of other traffic without giving a clear and sufficient signal."
            };
        }

        // 4. SEATBELT
        if (query.includes("belt") || query.includes("strap")) {
            return {
                charge: "Failure to Wear Safety Belt",
                act: "Statutory Instrument 154",
                section: "Section 81",
                fine_amount: 10,
                is_safety_critical: true,
                description: "The driver and every passenger in a motor vehicle shall wear a safety belt while the vehicle is in motion."
            };
        }

        // 5. DRUNK DRIVING
        if (query.includes("drink") || query.includes("drunk") || query.includes("alcohol")) {
            return {
                charge: "Driving Under Influence",
                act: "Road Traffic Act (Chapter 13:11)",
                section: "Section 55",
                fine_amount: 200, // Court Appearance
                is_safety_critical: true,
                description: "Any person who drives or attempts to drive a vehicle on a road while under the influence of alcohol or drugs shall be guilty of an offence."
            };
        }

        // ---------------------------------------------------------
        // LEVEL 2: THE FILE SCAN (For obscure stuff)
        // ---------------------------------------------------------
        const fileMatch = findBestMatchInFile(query);
        if (fileMatch) {
            return {
                charge: "Traffic Offense (Detected)",
                act: "Road Traffic Act (Chapter 13:11)",
                section: "Refer to Description",
                fine_amount: 15, // Default fine
                is_safety_critical: false,
                description: fileMatch
            };
        }

        // ---------------------------------------------------------
        // LEVEL 3: THE FALLBACK (The "Catch-All")
        // ---------------------------------------------------------
        return {
            charge: "Driving Without Due Care",
            act: "Road Traffic Act (Chapter 13:11)",
            section: "Section 52",
            fine_amount: 15,
            is_safety_critical: true,
            description: "Any person who drives a vehicle on a road without due care and attention or without reasonable consideration for other persons using the road shall be guilty of an offence."
        };
    }
};

// Internal Helper for scanning the file
function findBestMatchInFile(query) {
    if (!ZIMBABWE_LAW_TEXT) return null;
    
    // Split file into paragraphs
    const paragraphs = ZIMBABWE_LAW_TEXT.split(/\n\s*\n/);
    const words = query.split(" ").filter(w => w.length > 3);

    for (let para of paragraphs) {
        let matches = 0;
        for (let word of words) {
            if (para.toLowerCase().includes(word)) matches++;
        }
        // If we find a paragraph with 2+ keywords, return it
        if (matches >= 2) return para.trim().substring(0, 300) + "...";
    }
    return null;
}