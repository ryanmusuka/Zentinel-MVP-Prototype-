/* ==========================================================================
   MODULE: PAYMENT HANDLER (PROCESS 6.0)
   File: js/modules/payment.js
   Description: Manages Financial Transactions and Offline/Online States.
   ========================================================================== */

export const Payment = {

    // 6.1: Determine Available Payment Methods
    // Logic: If Offline, Digital Payments (EcoCash/Swipe) are REMOVED to prevent errors.
    getPaymentOptions: () => {
        const isOnline = navigator.onLine; // Browser API check
        
        console.log(`[Payment] Connectivity Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        if (isOnline) {
            return [
                { id: 'ecocash', label: 'EcoCash (Mobile Money)', type: 'DIGITAL' },
                { id: 'innbucks', label: 'InnBucks', type: 'DIGITAL' },
                { id: 'swipe', label: 'ZIMSWITCH (Swipe)', type: 'DIGITAL' },
                { id: 'cash', label: 'Cash (Station Receipt)', type: 'MANUAL' },
                { id: 'form265', label: 'Issue Form 265 (Pay Later)', type: 'DEBT' }
            ];
        } else {
            // "Graceful Offline" Protocol: 
            // Force the officer to use manual methods to avoid "Transaction Pending" limbo.
            console.warn("[Payment] System Offline. Digital Payments Disabled.");
            return [
                { id: 'cash', label: 'Cash (Offline Receipt)', type: 'MANUAL' },
                { id: 'form265', label: 'Issue Form 265 (Notice to Pay)', type: 'DEBT' }
            ];
        }
    },

    // 6.2 & 6.4: Execute Transaction Logic
    processPayment: async (ticketData, methodId, phoneNumber = null) => {
        console.log(`[Payment] Initiating ${methodId} for $${ticketData.amount}...`);

        // SCENARIO A: DIGITAL PUSH (Online Only)
        if (methodId === 'ecocash' || methodId === 'innbucks') {
            if (!navigator.onLine) {
                throw new Error("Cannot process digital payment while offline.");
            }
            return simulateMobilePush(phoneNumber, ticketData.amount);
        }

        // SCENARIO B: DEBT NOTICE (Offline/Form 265)
        if (methodId === 'form265') {
            return generateForm265(ticketData);
        }

        // SCENARIO C: CASH (Manual)
        return {
            success: true,
            status: "PAID",
            receiptRef: `ZRP-CASH-${Date.now()}`,
            message: "Cash Payment Recorded. Receipt Generated.",
            method: "CASH"
        };
    }
};

// ---------------------------------------------------------
// HELPER: SIMULATE MOBILE MONEY PUSH (Process 6.2)
// ---------------------------------------------------------
function simulateMobilePush(phone, amount) {
    return new Promise((resolve) => {
        console.log(`[Network] Sending USSD Push to ${phone}...`);
        
        // Simulate waiting for user to enter PIN on their phone
        setTimeout(() => {
            // 90% Success Rate Simulation
            const success = Math.random() > 0.1; 
            
            if (success) {
                resolve({
                    success: true,
                    status: "PAID",
                    receiptRef: `ECO-${Math.floor(Math.random() * 1000000)}`,
                    message: "Transaction Approved. Funds Transferred to ZRP Treasury.",
                    method: "ECOCASH"
                });
            } else {
                resolve({
                    success: false,
                    status: "FAILED",
                    message: "Transaction Timed Out or User Cancelled."
                });
            }
        }, 2000); // 2-second delay
    });
}

// ---------------------------------------------------------
// HELPER: GENERATE LIABILITY NOTICE (Process 6.4)
// ---------------------------------------------------------
function generateForm265(ticketData) {
    const noticeNumber = `F265-${Date.now().toString().slice(-6)}`;
    
    // Logic: This creates a "Debt" record that syncs to ZINARA later
    // The "Form 265" is the legal document in Zimbabwe for "Notice to Pay Fine"
    console.log(`[Offline Protocol] Generated Liability Notice ${noticeNumber}`);
    
    return {
        success: true,
        status: "UNPAID", // Important: This flags the vehicle in the future
        receiptRef: noticeNumber,
        type: "DEBT_NOTICE",
        message: `Form 265 (${noticeNumber}) issued. Driver has 7 days to pay at any ZRP Station.`,
        details: {
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString(),
            station: "Harare Central"
        }
    };
}