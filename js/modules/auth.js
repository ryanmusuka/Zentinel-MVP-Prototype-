/* ==========================================================================
   MODULE: AUTHENTICATION (PROCESS 1.0)
   File: js/modules/auth.js
   Description: Handles User Login, RBAC, and Biometric Simulation.
   ========================================================================== */
import { DB } from './db.js';

export const Auth = {
    
    // 1.1 Verify Credentials (Force ID & Password)
    login: async (forceId, password) => {
        console.log(`[Auth] Authenticating Force ID: ${forceId}`);
        
        // Simulating Network Delay
        await new Promise(r => setTimeout(r, 500));

        const user = DB.getUser(forceId);

        if (!user) {
            throw new Error("User not found.");
        }

        // 1.2 Verify Password (In production, use bcrypt comparison)
        if (user.password_hash !== password) {
            throw new Error("Invalid Password.");
        }

        console.log(`[Auth] Credentials Valid. Awaiting Biometrics...`);
        
        // Return user info so the UI knows who is trying to log in
        return {
            forceId: user.force_id,
            name: user.name,
            rank: user.rank,
            permissions: getPermissions(user.rank) // Prepare permissions
        };
    },

    // NEW: 1.4 Verify Biometrics (FaceID / Fingerprint)
    // This simulates the hardware scan delay and success signal
    // NEW: 1.4 Verify Biometrics (With Simulation Logic)
    verifyBiometric: async (scanType) => {
        console.log(`[Auth] Starting Biometric Scan: ${scanType.toUpperCase()}`);

        // 1. Simulate Scanning Delay
        await new Promise(r => setTimeout(r, 2000));

        // --- SIMULATION LOGIC ---
        // Math.random() returns a number between 0 and 1.
        // If it is less than 0.5, we pretend the scan failed.
        const isSuccess = Math.random() > 0.5; 

        if (!isSuccess) {
            console.warn("[Auth] Biometric Scan Rejected.");
            throw new Error("Biometric Mismatch"); // This triggers the Red Box in app.js
        }

        // 2. Simulate Success
        return {
            success: true,
            method: scanType,
            token: `BIO-JWT-${Date.now()}-SECURE`,
            message: `${scanType === 'face' ? 'Face ID' : 'Fingerprint'} Verified`
        };
    }
};

// RBAC Rules Definition
function getPermissions(rank) {
    if (rank === "Inspector") {
        return {
            canIssueTicket: true,
            canOverrideImpound: true, // Only Inspectors can release impounded cars
            viewAdminLogs: true
        };
    } else {
        // Constable
        return {
            canIssueTicket: true,
            canOverrideImpound: false, // Critical Restriction
            viewAdminLogs: false
        };
    }
}