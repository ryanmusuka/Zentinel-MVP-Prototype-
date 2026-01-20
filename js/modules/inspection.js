import { DB } from './db.js';

export const Inspection = {
    // 3.1 Render SI 154 Checklist
    getChecklist: () => {
        return [
            { id: "tires", label: "Tires (Tread < 1mm)", isCritical: true }, // Critical = Impound
            { id: "brakes", label: "Foot/Hand Brakes", isCritical: true },
            { id: "lights", label: "Headlamps/Tail Lights", isCritical: true }, // Critical at night, usually fine by day
            { id: "wipers", label: "Windscreen Wipers", isCritical: false },
            { id: "horn", label: "Warning Device (Horn)", isCritical: false },
            { id: "fire", label: "Fire Extinguisher", isCritical: false }, // Fine only
            { id: "triangles", label: "Warning Triangles", isCritical: false }
        ];
    },

    // 3.2 & 5.0 Process Inspection Result
    submit: (vrn, failedItems) => {
        console.log(`[Inspection] Analyzing defects for ${vrn}`, failedItems);

        // 5.0 THE IMPOUND TRIGGER
        // Check for "Safety Critical" failures
        const criticalFailures = failedItems.filter(item => item.isCritical);

        if (criticalFailures.length > 0) {
            return {
                result: "FAIL",
                action: "IMPOUND", // Triggers Form 234
                details: `Critical Safety Defect Detected: ${criticalFailures.map(i => i.label).join(", ")}`,
                form: "Form 234 (Seizure)"
            };
        }

        // If failures exist but are NOT critical (e.g., just no fire extinguisher)
        if (failedItems.length > 0) {
            return {
                result: "FAIL",
                action: "TICKET", // Triggers Form 265
                details: "Minor Defects Detected",
                form: "Form 265 (Ticket)"
            };
        }

        return {
            result: "PASS",
            action: "RELEASE",
            details: "Vehicle Roadworthy"
        };
    }
};