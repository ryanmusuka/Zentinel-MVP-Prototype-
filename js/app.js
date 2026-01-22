/* ==========================================================================
   MAIN CONTROLLER (app.js)
   Status: COMPLETE FINAL
   Features: Split Workflows, Full Biometrics, Full Offline Support
   ========================================================================== */

import { Auth } from './modules/auth.js';
import { Vehicle } from './modules/vehicle.js';
import { Inspection } from './modules/inspection.js';
import { AIAgent } from './modules/ai_agent.js';
import { Payment } from './modules/payment.js';

// --- APP STATE ---
const STATE = {
    currentUser: null,
    currentVehicle: null,
    currentTicket: null, 
    sessionOffenses: [], // The "Shopping Cart"
    isOffline: !navigator.onLine
};

// --- DOM ELEMENTS ---
const UI = {
    views: {
        login: document.getElementById('view-login'),
        patrol: document.getElementById('view-patrol')
    },
    login: {
        stage1: document.getElementById('login-stage-1'),
        stage2: document.getElementById('login-stage-2'),
        bioFeedback: document.getElementById('bio-feedback')
    },
    steps: {
        workspace: document.getElementById('step-workspace'),
        result: document.getElementById('step-result'),
        actions: document.getElementById('step-actions')
    },
    inputs: {
        forceId: document.getElementById('force-id'),
        password: document.getElementById('password'),
        vrn: document.getElementById('vrn-input')
    },
    header: {
        badge: document.getElementById('officer-badge'),
        name: document.getElementById('officer-name'),
        dot: document.querySelector('.status-dot')
    }
};

/* ==========================================================================
   1. INITIALIZATION & LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    
    // --- LOGIN FLOW ---
    document.getElementById('login-form').addEventListener('submit', handleCredentialCheck);
    document.getElementById('btn-face-scan').addEventListener('click', () => handleBiometric('face'));
    document.getElementById('btn-finger-scan').addEventListener('click', () => handleBiometric('fingerprint'));

    // --- PATROL FLOW ---
    // Search resets the session data for a new car
    document.getElementById('btn-search').addEventListener('click', () => {
        resetSessionData();
        handleSearch();
    });
    
    // --- WORKSPACE NAVIGATION ---
    document.getElementById('btn-inspect').addEventListener('click', openInspectionView);
    document.getElementById('btn-ticket').addEventListener('click', openTicketView);

    // --- ADDING OFFENSES (The "Cart" Logic) ---
    // 1. Add Physical Defects (Checklist + AI)
    document.getElementById('btn-add-inspection').addEventListener('click', addInspectionToCart);
    // 2. Add Traffic Violations (AI Only)
    document.getElementById('btn-add-traffic').addEventListener('click', addTrafficToCart);

    
    // --- FINAL GENERATION  ---
    document.getElementById('btn-generate-ticket').addEventListener('click', showFinalTicketPage);
    document.getElementById('btn-edit-ticket').addEventListener('click', goBackToEditing);

    // --- UTILITIES ---
    document.getElementById('btn-reset').addEventListener('click', resetPatrol);

    // --- PAYMENT FLOW ---
    document.getElementById('btn-pay-now').addEventListener('click', () => processPayment('ecocash'));
    document.getElementById('btn-pay-later').addEventListener('click', () => processPayment('form265'));

    // --- SYSTEM UTILS ---
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); 
});

/* ==========================================================================
   2. LOGIN & BIOMETRICS
   ========================================================================== */

async function handleCredentialCheck(e) {
    e.preventDefault();
    const forceId = UI.inputs.forceId.value;
    const password = UI.inputs.password.value;
    const submitBtn = document.querySelector('#login-form button');

    try {
        submitBtn.textContent = "VERIFYING...";
        const userPartial = await Auth.login(forceId, password);
        STATE.currentUser = userPartial;

        UI.login.stage1.classList.add('hidden');
        UI.login.stage2.classList.remove('hidden');
    } catch (error) {
        alert("ACCESS DENIED: " + error.message);
        submitBtn.textContent = "VERIFY CREDENTIALS";
    }
}

async function handleBiometric(type) {
    // UI References
    const overlay = document.getElementById('bio-overlay');
    const box = document.getElementById('bio-box');
    const text = document.getElementById('bio-text');
    const faceIcon = document.querySelector('.face-features');
    const fingerIcon = document.querySelector('.fingerprint-lines');
    const resultIcon = document.querySelector('.result-icon');
    const ring = document.querySelector('.scan-ring');

    // Reset Animation State
    overlay.classList.remove('hidden'); 
    box.className = 'bio-box'; // Reset classes
    resultIcon.classList.add('hidden'); 
    ring.classList.remove('hidden'); 
    text.textContent = type === 'face' ? "Scanning Face..." : "Scanning Print...";

    // Toggle Icons
    if (type === 'face') {
        faceIcon.classList.remove('hidden');
        fingerIcon.classList.add('hidden');
    } else {
        faceIcon.classList.add('hidden');
        fingerIcon.classList.remove('hidden');
    }

    try {
        const result = await Auth.verifyBiometric(type);

        if (result.success) {
            // Success Animation
            box.classList.add('success'); 
            ring.classList.add('hidden'); 
            faceIcon.classList.add('hidden');
            fingerIcon.classList.add('hidden');
            resultIcon.textContent = "✔";
            resultIcon.classList.remove('hidden');
            text.textContent = "Verified!";

            setTimeout(() => {
                overlay.classList.add('hidden');
                completeLogin();
            }, 1500);
        }
    } catch (error) {
        // Error Animation
        box.classList.add('error');
        ring.classList.add('hidden');
        faceIcon.classList.add('hidden');
        fingerIcon.classList.add('hidden');
        resultIcon.textContent = "✘";
        resultIcon.classList.remove('hidden');
        text.textContent = "Unrecognised!";

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 2000);
    }
}

function completeLogin() {
    const user = STATE.currentUser;
    UI.header.name.textContent = `${user.rank} ${user.name}`;
    UI.header.badge.classList.remove('hidden');
    
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-login').classList.remove('active-view');
    document.getElementById('view-patrol').classList.remove('hidden');
    document.getElementById('view-patrol').classList.add('active-view');
}

/* ==========================================================================
   3. VEHICLE SEARCH
   ========================================================================== */

async function handleSearch() {
    const vrn = UI.inputs.vrn.value.toUpperCase();
    if (!vrn) return alert("Please enter a VRN");

    UI.steps.result.innerHTML = '<p>Scanning Database...</p>';
    UI.steps.result.classList.remove('hidden');

    const analysis = await Vehicle.analyze(vrn);
    STATE.currentVehicle = analysis;
    renderStatusCard(analysis.status);
    
    UI.steps.actions.classList.remove('hidden');
    document.getElementById('btn-reset').classList.remove('hidden');

    // Handle Impound Scenarios
    if (analysis.status.color === 'RED') {
        if (!STATE.currentUser.permissions.canOverrideImpound) {
            alert("⚠️ WARNING: HIGH RISK VEHICLE. IMPOUND PROTOCOL ACTIVE.");
        } 
    }
}

/* ==========================================================================
   4. WORKFLOW: ADDING ITEMS (Silent Cart)
   ========================================================================== */

function openInspectionView() {
    // Show Workspace, Reveal Inspection Panel, Hide Ticket Panel
    UI.steps.workspace.classList.remove('hidden');
    document.getElementById('workspace-inspection').classList.remove('hidden');
    document.getElementById('workspace-ticket').classList.add('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden'); // Hide final page if open
    
    // Get Checklist Container
    const container = document.getElementById('checklist-container');
    
    // FIX: Check children length to ensure it builds correctly, ignoring comments/whitespace
    if (container.children.length === 0) {
        container.innerHTML = ''; 
        Inspection.getChecklist().forEach(item => {
            const div = document.createElement('div');
            div.innerHTML = `
                <label style="display:flex; align-items:center; gap:10px; padding:5px;">
                    <input type="checkbox" value="${item.id}" data-fine="${item.fine}" data-label="${item.label}">
                    <span>${item.label} ($${item.fine})</span>
                </label>`;
            container.appendChild(div);
        });
    }
    
    // Smooth Scroll
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
}

function openTicketView() {
    // Show Workspace, Reveal Ticket Panel, Hide Inspection Panel
    UI.steps.workspace.classList.remove('hidden');
    document.getElementById('workspace-inspection').classList.add('hidden');
    document.getElementById('workspace-ticket').classList.remove('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden'); // Hide final page if open
    
    // Smooth Scroll & Focus
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        const input = document.getElementById('traffic-ai-input');
        if(input) input.focus();
    }, 500);
}

// --- ADD TO CART (Logic Only, No UI Change yet) ---

async function addInspectionToCart() {
    const btn = document.getElementById('btn-add-inspection');
    btn.textContent = "Adding...";
    btn.disabled = true;
    
    // 1. Manual Checklist
    const checkboxes = document.querySelectorAll('#checklist-container input[type="checkbox"]:checked');
    let newItems = [];

    checkboxes.forEach(cb => {
        newItems.push({
            type: "Defect (Manual)",
            desc: cb.getAttribute('data-label'),
            fine: parseInt(cb.getAttribute('data-fine'))
        });
        cb.checked = false; // Uncheck after adding
    });

    // 2. AI Text
    const textInput = document.getElementById('inspect-ai-input').value;
    if (textInput.trim() !== "") {
        const phrases = textInput.split(/ and |,/i);
        const aiPromises = phrases.map(async (phrase) => {
             if (phrase.trim().length < 3) return null;
             return await AIAgent.analyze(phrase.trim());
        });
        
        const results = await Promise.all(aiPromises);
        results.forEach(res => {
            if (res) newItems.push({ type: "Defect (AI)", desc: res.charge, fine: res.fine_amount });
        });
    }

    addToSession(newItems);
    
    // Reset Inputs
    document.getElementById('inspect-ai-input').value = '';
    btn.textContent = "✚ ADD FINDINGS TO TICKET";
    btn.disabled = false;
}

async function addTrafficToCart() {
    const btn = document.getElementById('btn-add-traffic');
    const input = document.getElementById('traffic-ai-input');
    
    if(!input.value) return alert("Please describe the offense first.");

    btn.textContent = "Analyzing...";
    btn.disabled = true;

    try {
        const result = await AIAgent.analyze(input.value);
        
        const offense = [{
            type: "Traffic Violation",
            desc: `${result.charge} (${result.act})`,
            fine: result.fine_amount
        }];

        addToSession(offense);
        input.value = '';

    } catch (e) {
        alert("AI could not identify offense. Please try rephrasing.");
    }

    btn.textContent = "✚ ADD OFFENSE TO TICKET";
    btn.disabled = false;
}

function addToSession(newItems) {
    if (newItems.length === 0) return;

    // FILTER: specific logic to prevent duplicates
    const uniqueItems = newItems.filter(newItem => {
        // Check if an item with the exact same description already exists
        const exists = STATE.sessionOffenses.some(existing => 
            existing.desc === newItem.desc
        );
        // Only keep it if it does NOT exist
        return !exists;
    });

    // If everything was a duplicate, stop here
    if (uniqueItems.length === 0) {
        return alert("Item already exists on the ticket list.");
    }

    // Add only the unique items to the state
    STATE.sessionOffenses = [...STATE.sessionOffenses, ...uniqueItems];
    
    // Reveal the Generate button
    document.getElementById('action-bar-final').classList.remove('hidden');
    
    // Professional Feedback
    if (uniqueItems.length < newItems.length) {
        alert(`Added ${uniqueItems.length} new item(s). Duplicates were excluded.`);
    } else {
        alert(`Added ${uniqueItems.length} item(s) to ticket compilation.`);
    }
}

/* ==========================================================================
   5. FINAL STAGE: GENERATE & PAY
   ========================================================================== */

function showFinalTicketPage() {
    // 1. Hide the Workspaces & Action Bar
    document.getElementById('workspace-inspection').classList.add('hidden');
    document.getElementById('workspace-ticket').classList.add('hidden');
    document.getElementById('action-bar-final').classList.add('hidden');
    
    // 2. Build the List
    const listContainer = document.getElementById('ticket-breakdown-list');
    listContainer.innerHTML = '';
    
    STATE.sessionOffenses.forEach(item => {
        const div = document.createElement('div');
        div.className = 'breakdown-item';
        div.style.animation = "fadeIn 0.5s";
        div.innerHTML = `
            <span>
                <small style="color:#b8860b; font-weight:bold; font-size:0.75rem;">${item.type}</small><br>
                ${item.desc}
            </span>
            <strong>$${item.fine}</strong>
        `;
        listContainer.appendChild(div);
    });

    // Update Total
    const total = STATE.sessionOffenses.reduce((sum, item) => sum + item.fine, 0);
    document.getElementById('lbl-total-fine').textContent = `$${total}.00`;

    // 3. Show Final Page
    const finalBox = document.getElementById('ticket-confirm-box');
    finalBox.classList.remove('hidden');
    finalBox.scrollIntoView({ behavior: 'smooth' });

    // 4. Create Ticket Object
    STATE.currentTicket = {
        vrn: STATE.currentVehicle.data.vrn,
        amount: total,
        offenses: STATE.sessionOffenses
    };
}

function goBackToEditing() {
    // Hides Final Page, Shows Workspace again (defaulting to Inspection view)
    document.getElementById('ticket-confirm-box').classList.add('hidden');
    openInspectionView();
    // Show the generate button again since we still have items
    document.getElementById('action-bar-final').classList.remove('hidden');
}

/* ==========================================================================
   6. HELPERS
   ========================================================================== */

function resetSessionData() {
    STATE.sessionOffenses = [];
    document.getElementById('action-bar-final').classList.add('hidden');
    document.getElementById('ticket-breakdown-list').innerHTML = '';
    document.getElementById('lbl-total-fine').textContent = '$0.00';
    document.getElementById('ticket-confirm-box').classList.add('hidden');
}

async function processPayment(method) {
    if (!STATE.currentTicket) return;

    const btn = method === 'ecocash' ? document.getElementById('btn-pay-now') : document.getElementById('btn-pay-later');
    const originalText = btn.textContent;
    btn.textContent = "Processing...";

    try {
        const result = await Payment.processPayment(STATE.currentTicket, method, "0771234567");
        if (result.success) {
            alert(`SUCCESS: ${result.message}\nRef: ${result.receiptRef}`);
            resetPatrol();
        }
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.textContent = originalText;
    }
}

function renderStatusCard(status) {
    const bgClass = status.color === 'RED' ? 'bg-red' : 
                   status.color === 'ORANGE' ? 'bg-orange' : 'bg-green';
    UI.steps.result.innerHTML = `
        <div class="status-card ${bgClass}">
            <h2>${status.headline || status.color}</h2>
            <p>${status.message}</p>
            <small style="display:block; margin-top:10px; opacity:0.8">${status.code}</small>
        </div>
    `;
    UI.steps.result.classList.remove('hidden');
}

function resetPatrol() {
    // 1. Reset Data
    STATE.currentVehicle = null;
    STATE.currentTicket = null;
    resetSessionData(); // Clears the cart

    // 2. Clear UI Inputs
    UI.inputs.vrn.value = '';
    document.getElementById('checklist-container').innerHTML = '';
    
    const inspectInput = document.getElementById('inspect-ai-input');
    if(inspectInput) inspectInput.value = '';
    
    const trafficInput = document.getElementById('traffic-ai-input');
    if(trafficInput) trafficInput.value = '';

    // 3. Hide Views
    UI.steps.result.classList.add('hidden');
    UI.steps.actions.classList.add('hidden');
    UI.steps.workspace.classList.add('hidden');
    
    // 4. Hide Reset Button
    document.getElementById('btn-reset').classList.add('hidden');

    // 5. Scroll to Top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log("[System] Ready for next vehicle.");
}

function updateNetworkStatus() {
    STATE.isOffline = !navigator.onLine;
    if (STATE.isOffline) {
        UI.header.dot.style.background = 'grey';
        UI.header.name.textContent += ' (OFFLINE)';
    } else {
        UI.header.dot.style.background = 'var(--green)';
        // Restore name if coming back online
        if (STATE.currentUser) {
            UI.header.name.textContent = `${STATE.currentUser.rank} ${STATE.currentUser.name}`;
        }
    }
}