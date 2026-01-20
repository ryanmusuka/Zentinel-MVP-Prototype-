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

// --- DOM ELEMENTS ---
const UI = {
    views: {
        login: document.getElementById('view-login'),
        patrol: document.getElementById('view-patrol')
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
    
    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', handleLogin);

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
    updateNetworkStatus(); // Run once on load
});

/* ==========================================================================
   2. CORE WORKFLOW FUNCTIONS
   ========================================================================== */

// --- LOGIN (Process 1.0) ---
async function handleLogin(e) {
    e.preventDefault();
    const forceId = UI.inputs.forceId.value;
    const password = UI.inputs.password.value;

    try {
        const user = await Auth.login(forceId, password);
        STATE.currentUser = user;
        
        // Update UI
        UI.header.name.textContent = `${user.rank} ${user.name}`;
        UI.header.badge.classList.remove('hidden');
        switchView('patrol');
        
    } catch (error) {
        alert("ACCESS DENIED: " + error.message);
    }
}

// --- SEARCH VEHICLE (Process 2.0) ---
async function handleSearch() {
    const vrn = UI.inputs.vrn.value.toUpperCase();
    if (!vrn) return alert("Please enter a VRN");

    // Clear previous results
    UI.steps.result.innerHTML = '<p>Scanning Database...</p>';
    UI.steps.result.classList.remove('hidden');

    // Run Logic
    const analysis = await Vehicle.analyze(vrn);
    STATE.currentVehicle = analysis;

    renderStatusCard(analysis.status);
    
    // Show Next Step
    UI.steps.actions.classList.remove('hidden');
    document.getElementById('btn-reset').classList.remove('hidden');

    // SCENARIO B: IMPOUND LOGIC
    // If Status is RED, we lock the "Ticket" button and force Impound
    if (analysis.status.color === 'RED') {
        document.getElementById('btn-ticket').disabled = true;
        document.getElementById('btn-ticket').innerHTML = "🚫 TICKET BLOCKED";
        alert("⚠️ WARNING: HIGH RISK VEHICLE. IMPOUND PROTOCOL ACTIVE.");
    } else {
        document.getElementById('btn-ticket').disabled = false;
        document.getElementById('btn-ticket').innerHTML = "<span class='icon'>📝</span> ISSUE TICKET";
    }
}

// --- INSPECTION (Process 3.0) ---
function startInspection() {
    showWorkspace('inspection');
    const container = document.getElementById('checklist-container');
    container.innerHTML = ''; // Clear

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

    const aiBox = document.querySelector('.ai-assistant-box');
    const suggestionText = document.getElementById('ai-suggestion');
    
    suggestionText.textContent = "🤖 ZRP AI is analyzing Law Library...";
    suggestionText.classList.remove('hidden');

    // Call the AI Module
    const violation = await AIAgent.analyze(text);
    
    // Update State
    STATE.currentTicket = {
        ...violation,
        vrn: STATE.currentVehicle.data ? STATE.currentVehicle.data.vrn : UI.inputs.vrn.value,
        amount: violation.fine_amount
    };

    // Show Result
    suggestionText.innerHTML = `
        <strong>Matched Law:</strong> ${violation.act} (${violation.section})<br>
        <strong>Charge:</strong> ${violation.charge}
    `;
    
    // Fill Confirmation Box
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
    
    // Scroll to it
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
}

function renderStatusCard(status) {
    // Map colors to CSS classes
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
    UI.inputs.vrn.value = '';
    UI.inputs.offenseDesc.value = '';
    UI.steps.result.classList.add('hidden');
    UI.steps.actions.classList.add('hidden');
    UI.steps.workspace.classList.add('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden');
    document.getElementById('ai-suggestion').classList.add('hidden');
    
    STATE.currentVehicle = null;
    STATE.currentTicket = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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