import { DB } from './db.js';

/* ==========================================================================
   MODULE: INSPECTION (PROCESS 3.0)
   Description: Manages SI 154 Compliance Checks and calculates fines.
   ========================================================================== */

export const Inspection = {
    
    // 3.1 THE LAW LIBRARY (SI 154 CHECKLIST)
    // We added 'fine' (ZWG/USD) and 'code' to each item.
    getChecklist: () => {
        return [
            { 
                id: "tires", 
                label: "Tires (Tread < 1mm)", 
                isCritical: true, 
                fine: 30, 
                code: "SI154-14(1)" 
            },
            { 
                id: "brakes", 
                label: "Foot/Hand Brakes Defective", 
                isCritical: true, 
                fine: 60, 
                code: "SI154-18" 
            },
            { 
                id: "lights", 
                label: "Headlamps/Tail Lights Defective", 
                isCritical: true, 
                fine: 20, 
                code: "SI154-22" 
            },
            { 
                id: "wipers", 
                label: "No Windscreen Wipers", 
                isCritical: false, 
                fine: 10, 
                code: "SI154-43" 
            },
            { 
                id: "horn", 
                label: "No Warning Device (Horn)", 
                isCritical: false, 
                fine: 10, 
                code: "SI154-46" 
            },
            { 
                id: "fire", 
                label: "No Fire Extinguisher", 
                isCritical: false, 
                fine: 15, 
                code: "SI154-52" 
            },
            { 
                id: "triangles", 
                label: "Missing Warning Triangles", 
                isCritical: false, 
                fine: 15, 
                code: "SI154-53" 
            }
        ];
    },

    // 3.2 & 5.0 PROCESS & STORE RESULTS
    submit: (vrn, failedItemIds) => {
        console.log(`[Inspection] Processing defects for ${vrn}...`);

        // 1. Retrieve full details for the checked items
        const allItems = Inspection.getChecklist();
        const defects = allItems.filter(item => failedItemIds.includes(item.id));

        // 2. Calculate Total Fine
        // We use .reduce to sum up the 'fine' property of all defects
        const totalFine = defects.reduce((sum, item) => sum + item.fine, 0);

        // 3. Check for Impound Condition (Critical Failures)
        const criticalDefects = defects.filter(item => item.isCritical);
        const isImpound = criticalDefects.length > 0;

        // 4. Create the Data Packet (The "Report")
        const report = {
            id: `INS-${Date.now()}`,
            timestamp: new Date().toISOString(),
            vrn: vrn,
            status: isImpound ? "FAIL - CRITICAL" : (defects.length > 0 ? "FAIL - MINOR" : "PASS"),
            action: isImpound ? "IMPOUND" : (defects.length > 0 ? "TICKET" : "RELEASE"),
            defects: defects, // We store the whole array of failed items here
            totalFine: totalFine,
            notes: isImpound 
                ? `Vehicle unsafe. ${criticalDefects.length} critical faults.` 
                : "Routine inspection completed."
        };

        // 5. SAVE TO DATABASE (Persist the data)
        DB.saveInspectionResult(report);

        // 6. Return to UI
        return report;
    }
};