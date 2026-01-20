import { DB } from './db.js';

export const Auth = {
    // 1.1 Verify Credentials
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

        // 1.3 RBAC Check (Role-Based Access Control)
        // Determines what the UI will show
        const permissions = getPermissions(user.rank);
        
        console.log(`[Auth] Login Successful: ${user.rank} ${user.name}`);
        
        return {
            forceId: user.force_id,
            name: user.name,
            rank: user.rank,
            permissions: permissions,
            token: `JWT-${Date.now()}-SECURE` // Mock Session Token
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