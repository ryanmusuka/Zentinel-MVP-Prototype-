/* ==========================================================================
   MAIN CONTROLLER (app.js)
   Description: Wires the UI to the Logic Modules. 
   Manages the "State Machine" of the application.
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
    isOffline: !navigator.onLine
};

// --- DOM ELEMENTS (UPDATED FOR BIOMETRICS) ---
const UI = {
    views: {
        login: document.getElementById('view-login'),
        patrol: document.getElementById('view-patrol')
    },
    // NEW: References for the 2 Login Stages
    login: {
        stage1: document.getElementById('login-stage-1'),
        stage2: document.getElementById('login-stage-2'),
        bioFeedback: document.getElementById('bio-feedback')
    },
    steps: {
        identify: document.getElementById('step-identify'),
        result: document.getElementById('step-result'),
        actions: document.getElementById('step-actions'),
        workspace: document.getElementById('step-workspace')
    },
    inputs: {
        forceId: document.getElementById('force-id'),
        password: document.getElementById('password'),
        vrn: document.getElementById('vrn-input'),
        offenseDesc: document.getElementById('offense-input')
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
    
    // Login Stage 1: Credentials
    document.getElementById('login-form').addEventListener('submit', handleCredentialCheck);

    // Login Stage 2: Biometrics (NEW LISTENERS)
    document.getElementById('btn-face-scan').addEventListener('click', () => handleBiometric('face'));
    document.getElementById('btn-finger-scan').addEventListener('click', () => handleBiometric('fingerprint'));

    // Search VRN Button
    document.getElementById('btn-search').addEventListener('click', handleSearch);

    // Action Buttons
    document.getElementById('btn-inspect').addEventListener('click', startInspection);
    document.getElementById('btn-ticket').addEventListener('click', startTicket);
    document.getElementById('btn-reset').addEventListener('click', resetPatrol);

    // AI Analysis Button
    document.getElementById('btn-ai-analyze').addEventListener('click', runAIAnalysis);

    // Payment Buttons
    document.getElementById('btn-pay-now').addEventListener('click', () => processPayment('ecocash'));
    document.getElementById('btn-pay-later').addEventListener('click', () => processPayment('form265'));

    // Network Status Listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); 
});

/* ==========================================================================
   2. CORE WORKFLOW FUNCTIONS
   ========================================================================== */

// --- LOGIN PART 1: CREDENTIALS (Process 1.1) ---
async function handleCredentialCheck(e) {
    e.preventDefault();
    const forceId = UI.inputs.forceId.value;
    const password = UI.inputs.password.value;
    const submitBtn = document.querySelector('#login-form button');

    try {
        submitBtn.textContent = "VERIFYING...";
        
        // 1. Check ID/Pass with Auth Module
        const userPartial = await Auth.login(forceId, password);
        
        // 2. Store user temporarily (not fully logged in yet)
        STATE.currentUser = userPartial;

        // 3. Switch to Stage 2 (Biometrics)
        UI.login.stage1.classList.add('hidden');
        UI.login.stage2.classList.remove('hidden');

    } catch (error) {
        alert("ACCESS DENIED: " + error.message);
        submitBtn.textContent = "INITIATE SESSION";
    }
}

// --- LOGIN PART 2: BIOMETRICS (Updated Flow) ---
async function handleBiometric(type) {
    // 1. Get Elements
    const overlay = document.getElementById('bio-overlay');
    const box = document.getElementById('bio-box');
    const text = document.getElementById('bio-text');
    
    const faceIcon = document.querySelector('.face-features');
    const fingerIcon = document.querySelector('.fingerprint-lines');
    const resultIcon = document.querySelector('.result-icon');
    const ring = document.querySelector('.scan-ring');

    // 2. Reset Animation State
    overlay.classList.remove('hidden'); 
    box.className = 'bio-box'; 
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
        // 3. Call Auth Module
        const result = await Auth.verifyBiometric(type);

        if (result.success) {
            // --- SUCCESS ANIMATION ---
            box.classList.add('success'); 
            ring.classList.add('hidden'); 
            faceIcon.classList.add('hidden');
            fingerIcon.classList.add('hidden');
            
            resultIcon.textContent = "✔";
            resultIcon.classList.remove('hidden');
            text.textContent = "Verified!";

            // 4. THE HANDOFF (Wait 1.5s then switch)
            setTimeout(() => {
                overlay.classList.add('hidden'); // Close Popup
                completeLogin(); // Trigger Dashboard
            }, 1500);
        }
    } catch (error) {
        // --- FAILURE ANIMATION ---
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

// --- LOGIN PART 3: FINALIZE (Force View Switch) ---
function completeLogin() {
    console.log("Switching to Patrol View..."); // Debugging Check

    const user = STATE.currentUser;
    
    // 1. Update Header
    UI.header.name.textContent = `${user.rank} ${user.name}`;
    UI.header.badge.classList.remove('hidden');
    
    // 2. HARD RESET: Hide all Login parts
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-login').classList.remove('active-view');
    
    // 3. SHOW DASHBOARD
    document.getElementById('view-patrol').classList.remove('hidden');
    document.getElementById('view-patrol').classList.add('active-view');
}

// --- SEARCH VEHICLE (Process 2.0) ---
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

    // SCENARIO B: IMPOUND LOGIC
    if (analysis.status.color === 'RED') {
        const canOverride = STATE.currentUser.permissions.canOverrideImpound;
        
        if (!canOverride) {
            document.getElementById('btn-ticket').disabled = true;
            document.getElementById('btn-ticket').innerHTML = "🚫 TICKET BLOCKED";
            alert("⚠️ WARNING: HIGH RISK VEHICLE. IMPOUND PROTOCOL ACTIVE.");
        } else {
             document.getElementById('btn-ticket').innerHTML = "⚠️ ISSUE TICKET (OVERRIDE)";
        }
    } else {
        document.getElementById('btn-ticket').disabled = false;
        document.getElementById('btn-ticket').innerHTML = "<span class='icon'>📝</span> ISSUE TICKET";
    }
}

// --- INSPECTION (Process 3.0) ---
function startInspection() {
    showWorkspace('inspection');
    const container = document.getElementById('checklist-container');
    container.innerHTML = ''; 

    const checklist = Inspection.getChecklist();
    checklist.forEach(item => {
        const div = document.createElement('div');
        div.style.marginBottom = "10px";
        div.innerHTML = `
            <label style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" value="${item.id}" ${item.isCritical ? 'data-critical="true"' : ''}>
                ${item.label} ${item.isCritical ? '<strong style="color:red">(CRITICAL)</strong>' : ''}
            </label>
        `;
        container.appendChild(div);
    });
}

// --- AI TICKET ENGINE (Process 4.0) ---
function startTicket() {
    showWorkspace('ticket');
}

async function runAIAnalysis() {
    const text = UI.inputs.offenseDesc.value;
    if (!text) return alert("Describe the offense first.");

    const suggestionText = document.getElementById('ai-suggestion');
    suggestionText.textContent = "🤖 ZRP AI is analyzing Law Library...";
    suggestionText.classList.remove('hidden');

    const violation = await AIAgent.analyze(text);
    
    STATE.currentTicket = {
        ...violation,
        vrn: STATE.currentVehicle.data ? STATE.currentVehicle.data.vrn : UI.inputs.vrn.value,
        amount: violation.fine_amount
    };

    suggestionText.innerHTML = `
        <strong>Matched Law:</strong> ${violation.act} (${violation.section})<br>
        <strong>Charge:</strong> ${violation.charge}
    `;
    
    document.getElementById('lbl-charge').textContent = violation.charge;
    document.getElementById('lbl-fine').textContent = `Fine: $${violation.fine_amount}.00`;
    document.getElementById('ticket-confirm-box').classList.remove('hidden');
}

// --- PAYMENT (Process 6.0) ---
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
        } else {
            alert("Payment Failed. Try manual method.");
        }
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        btn.textContent = originalText;
    }
}

/* ==========================================================================
   3. HELPER FUNCTIONS
   ========================================================================== */

function switchView(viewName) {
    Object.values(UI.views).forEach(el => el.classList.add('hidden'));
    UI.views[viewName].classList.remove('hidden');
    UI.views[viewName].classList.add('active-view');
}

function showWorkspace(type) {
    UI.steps.workspace.classList.remove('hidden');
    document.getElementById('workspace-inspection').classList.add('hidden');
    document.getElementById('workspace-ticket').classList.add('hidden');
    document.getElementById(`workspace-${type}`).classList.remove('hidden');
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
}

function renderStatusCard(status) {
    const bgClass = status.color === 'RED' ? 'bg-red' : 
                   status.color === 'ORANGE' ? 'bg-orange' : 'bg-green';

    UI.steps.result.innerHTML = `
        <div class="status-card ${bgClass}">
            <h2>${status.color}</h2>
            <p>${status.message}</p>
            <small style="display:block; margin-top:10px; opacity:0.8">${status.code}</small>
        </div>
    `;
    UI.steps.result.classList.remove('hidden');
}

function resetPatrol() {
    // Reload page for full reset
    location.reload(); 
}

function updateNetworkStatus() {
    STATE.isOffline = !navigator.onLine;
    
    if (STATE.isOffline) {
        UI.header.dot.style.background = 'grey';
        UI.header.name.textContent += ' (OFFLINE)';
        console.log("[System] Network Lost. Switching to Offline Protocols.");
    } else {
        UI.header.dot.style.background = 'var(--green)';
        if (STATE.currentUser) UI.header.name.textContent = `${STATE.currentUser.rank} ${STATE.currentUser.name}`;
    }
}