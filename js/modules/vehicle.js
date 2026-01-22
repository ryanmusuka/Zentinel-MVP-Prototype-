import { DB } from './db.js';

export const Vehicle = {
    // 2.0 Analyze Status
    analyze: async (vrn) => {
        console.log(`[Vehicle Analysis] Querying VRN: ${vrn}`);

        try {
            // 2.1 Fetch External Data (ZINARA)
            // Note: This fails if Offline, triggering the catch block
            const zinaraData = await DB.getZinaraRecord(vrn);
            
            // 2.2 Fetch Internal History (ZRP Local Cache)
            const history = DB.getViolationHistory(vrn);

            // 2.3 Determine Status Color (The Decision Matrix)
            const status = calculateStatus(zinaraData, history);

            return {
                found: true,
                data: zinaraData,
                history: history,
                status: status
            };

        } catch (error) {
            console.warn("[Vehicle Analysis] Offline or Not Found", error);
            // Graceful Offline Fallback
            return {
                found: false,
                status: {
                    color: "GREY",
                    code: "OFFLINE_UNKNOWN",
                    message: "Connection Failed. Verify Physical Disc."
                }
            };
        }
    }
};

// THE TRAFFIC LIGHT ALGORITHM
function calculateStatus(vehicle, history) {
    // PRIORITY 1: RED (CRITICAL DANGER)
    // Conditions: Stolen, Wanted, or Habitual Offender (>3 past violations)
    const isHabitualOffender = history.length >= 3;

    if (vehicle.is_stolen || vehicle.is_wanted || isHabitualOffender) {
        return {
            headline: "ALERT!",
            color: "RED",
            code: "HIGH RISK - IMPOUND REQUIRED",
            message: vehicle.is_stolen ? "VEHICLE REPORTED STOLEN" : "HABITUAL OFFENDER - IMPOUND",
            action: "ARREST_AND_IMPOUND"
        };
    }

    // PRIORITY 2: ORANGE (ADMINISTRATIVE)
    // Conditions: Expired License, Invalid Insurance
    const isLicenseExpired = new Date(vehicle.license_expiry) < new Date();
    const isInsuranceInvalid = vehicle.insurance_status !== "Valid";

    if (isLicenseExpired || isInsuranceInvalid) {
        return {
            headline: "CAUTION",
            color: "ORANGE",
            code: "VIOLATION DETECTED",
            message: isLicenseExpired ? "License Expired" : "Insurance Invalid",
            action: "ISSUE_TICKET"
        };
    }

    // PRIORITY 3: GREEN (CLEAN)
    return {
        headline: "VEHICLE CLEAR",
        color: "GREEN",
        code: "ALLOW TO PROCEED or conduct an inspection",
        message: "Vehicle Compliant",
        action: "PASS"
    };
}