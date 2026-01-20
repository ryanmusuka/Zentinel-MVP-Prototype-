/* ==========================================================================
   MODULE: DATABASE (MOCK DATA LAYER)
   File: js/modules/db.js
   Description: Simulates the 4 Data Stores defined in DFD Level 1.
   Updated: Expanded Statutory List for Robust MVP Demo.
   ========================================================================== */

// --- 1. USERS DATA STORE (Task 2.1) ---
const USERS_STORE = [
    {
        force_id: "9921",
        password_hash: "password123", 
        rank: "Constable",           
        name: "Cst. M. Moyo",
        station_id: "HRE-central-01",
        biometric_token: "bio_fp_9921_valid" 
    },
    {
        force_id: "1001",
        password_hash: "admin777",
        rank: "Inspector",            
        name: "Insp. T. Chitepo",
        station_id: "HRE-hq-01",
        biometric_token: "bio_face_1001_valid"
    }
];

// --- 2. STATUTORY CODES STORE (Task 2.2 - ROBUST VERSION) ---
// Covers SI 154 (Equipment) and RTA Chapter 13:11 (Conduct)
const STATUTORY_STORE = [
    // === CATEGORY A: LICENSING & INSURANCE ===
    {
        code: "RTA-C13-S6",
        keywords: ["license", "licence", "dl", "driver"],
        act: "Road Traffic Act [Chapter 13:11]",
        section: "Section 6",
        charge: "Driving without a valid driver's license",
        fine_amount: 100.00,
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "RTA-C13-S22",
        keywords: ["insurance", "third party", "policy"],
        act: "Road Traffic Act [Chapter 13:11]",
        section: "Section 22",
        charge: "Driving without valid Third Party Insurance",
        fine_amount: 30.00,
        currency: "USD",
        is_safety_critical: false
    },
    {
        code: "VR-ACT-S10",
        keywords: ["disc", "vehicle license", "zinara"],
        act: "Vehicle Registration & Licensing Act",
        section: "Section 10",
        charge: "Failure to display valid vehicle license disc",
        fine_amount: 20.00,
        currency: "USD",
        is_safety_critical: false
    },

    // === CATEGORY B: TIRES & WHEELS (SI 154) ===
    {
        code: "SI154-S14",
        keywords: ["tires", "tyres", "worn", "bald", "tread", "ply"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 14",
        charge: "Worn tires (tread depth less than 1mm)",
        fine_amount: 20.00, // Per tire
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "SI154-S16",
        keywords: ["spare", "wheel", "jack"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 16",
        charge: "No functional spare wheel or jack",
        fine_amount: 15.00,
        currency: "USD",
        is_safety_critical: false
    },

    // === CATEGORY C: LIGHTS & REFLECTORS ===
    {
        code: "SI154-S18",
        keywords: ["headlight", "headlamp", "light", "dim"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 18",
        charge: "Operating vehicle without functional headlamps",
        fine_amount: 20.00,
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "SI154-S19",
        keywords: ["brake light", "stop light", "rear light"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 19",
        charge: "Non-functional stop/brake lights",
        fine_amount: 20.00,
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "SI154-S24",
        keywords: ["indicator", "turn signal", "flasher"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 24",
        charge: "Non-functional direction indicators",
        fine_amount: 15.00,
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "SI154-S35",
        keywords: ["reflector", "white", "front reflector"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 35",
        charge: "Missing White Front Reflectors",
        fine_amount: 10.00,
        currency: "USD",
        is_safety_critical: false
    },
    {
        code: "SI154-S36",
        keywords: ["honeycomb", "red", "rear reflector"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 36",
        charge: "Missing Red Rear Reflectors (Honeycomb)",
        fine_amount: 10.00,
        currency: "USD",
        is_safety_critical: false
    },

    // === CATEGORY D: SAFETY EQUIPMENT ===
    {
        code: "SI154-S56",
        keywords: ["fire", "extinguisher", "fire extinguisher"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 56",
        charge: "No functional fire extinguisher (0.75kg min)",
        fine_amount: 20.00,
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "SI154-S57",
        keywords: ["triangle", "red triangle", "breakdown"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 57",
        charge: "Failure to carry two red reflective triangles",
        fine_amount: 15.00,
        currency: "USD",
        is_safety_critical: false
    },
    {
        code: "SI154-S61",
        keywords: ["vest", "reflective vest", "yellow vest"],
        act: "Statutory Instrument 154 of 2010",
        section: "Section 61",
        charge: "Failure to carry reflective safety vest",
        fine_amount: 10.00,
        currency: "USD",
        is_safety_critical: false
    },

    // === CATEGORY E: DRIVING CONDUCT ===
    {
        code: "RTA-C13-S51",
        keywords: ["speed", "speeding", "fast"],
        act: "Road Traffic Act [Chapter 13:11]",
        section: "Section 51",
        charge: "Exceeding speed limit",
        fine_amount: 50.00, 
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "RTA-C13-S46",
        keywords: ["careless", "negligent", "lane"],
        act: "Road Traffic Act [Chapter 13:11]",
        section: "Section 46",
        charge: "Careless driving / Failure to maintain lane",
        fine_amount: 100.00, // Often court summons, but fine for MVP
        currency: "USD",
        is_safety_critical: true
    },
    {
        code: "RTA-C13-S72",
        keywords: ["obey", "police", "instruction", "stop"],
        act: "Road Traffic Act [Chapter 13:11]",
        section: "Section 72",
        charge: "Failure to obey police instruction",
        fine_amount: 300.00,
        currency: "USD",
        is_safety_critical: true
    }
];

// --- 3. VEHICLE HISTORY STORE (Task 2.3 - Internal) ---
let HISTORY_STORE = [
    {
        vrn: "XYZ-9999",
        violations: [
            { date: "2023-11-12", offense: "Worn Tires", status: "UNPAID" },
            { date: "2024-01-05", offense: "No Fire Extinguisher", status: "PAID" },
            { date: "2024-02-20", offense: "Broken Headlight", status: "UNPAID" }
        ]
    }
];

// --- 4. ZINARA REGISTRY (Task 2.3 - External Entity) ---
const ZINARA_EXTERNAL_DB = [
    {
        // SCENARIO 1: The "Perfect" Driver (Green Status)
        vrn: "ABC-1234",
        make: "Toyota Hilux",
        color: "White",
        owner: "Swift Logistics Ltd",
        license_expiry: "2026-12-31", // Future date
        insurance_status: "Valid",
        is_stolen: false,
        is_wanted: false
    },
    {
        // SCENARIO 2: The "Expired" Driver (Orange Status)
        vrn: "HRE-5555",
        make: "Honda Fit",
        color: "Silver",
        owner: "P. Ndlovu",
        license_expiry: "2023-01-01", // Past date
        insurance_status: "Expired",
        is_stolen: false,
        is_wanted: false
    },
    {
        // SCENARIO 3: The "Criminal" Vehicle (Red Status)
        vrn: "CRIME-001",
        make: "Nissan Navara",
        color: "Black",
        owner: "Unknown",
        license_expiry: "2025-01-01",
        insurance_status: "Valid",
        is_stolen: true,  // CRITICAL FLAG
        is_wanted: true   // CRITICAL FLAG
    },
    {
        // SCENARIO 4: The "Habitual Offender" (Matches History Store)
        vrn: "XYZ-9999",
        make: "Mazda Demio",
        color: "Blue",
        owner: "T. Mambo",
        license_expiry: "2025-06-01",
        insurance_status: "Valid",
        is_stolen: false,
        is_wanted: false
    }
];

// ==========================================
// PUBLIC METHODS (The Interface)
// ==========================================
export const DB = {
    // 1. Fetch User (Sync)
    getUser: (forceId) => {
        return USERS_STORE.find(u => u.force_id === forceId);
    },

    // 2. Fetch ZINARA Record (Async Simulation)
    getZinaraRecord: (vrn) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const record = ZINARA_EXTERNAL_DB.find(v => v.vrn === vrn);
                if (record) resolve(record);
                else reject("Vehicle not found in ZINARA Registry");
            }, 800);
        });
    },

    // 3. Fetch Internal History (Sync - Local Cache)
    getViolationHistory: (vrn) => {
        const entry = HISTORY_STORE.find(h => h.vrn === vrn);
        return entry ? entry.violations : [];
    },

    // 4. Find Law by Keyword (AI Lookup)
    findStatutoryCode: (description) => {
        const searchTerms = description.toLowerCase().split(" ");
        // Improved Matcher: Returns the law with the MOST matching keywords
        let bestMatch = null;
        let maxMatches = 0;

        STATUTORY_STORE.forEach(law => {
            const matches = law.keywords.filter(k => description.toLowerCase().includes(k)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = law;
            }
        });
        
        return bestMatch;
    }
};