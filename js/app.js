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
import { openFinalTicket, closeFinalTicket, processFinalPayment } from './modules/generateTicket.js';

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
        patrol: document.getElementById('view-patrol'),
        final: document.getElementById('view-final-ticket')
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
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleCredentialCheck);
    
    const btnFace = document.getElementById('btn-face-scan');
    if (btnFace) btnFace.addEventListener('click', () => handleBiometric('face'));
    
    const btnFinger = document.getElementById('btn-finger-scan');
    if (btnFinger) btnFinger.addEventListener('click', () => handleBiometric('fingerprint'));
    
    const btnImpound = document.getElementById('btn-confirm-impound');
    if (btnImpound) btnImpound.addEventListener('click', () => {
        alert("Impound Logged. Vehicle Status Updated.");
        resetPatrol();
    });
    // --- PATROL FLOW ---
    document.getElementById('btn-search').addEventListener('click', () => {
        resetSessionData();
        handleSearch();
    });
    
    document.getElementById('vrn-input').addEventListener('input', function(e) {
    e.target.value = e.target.value.toUpperCase();
});
    
    // --- WORKSPACE NAVIGATION ---
    document.getElementById('btn-inspect').addEventListener('click', openInspectionView);
    document.getElementById('btn-ticket').addEventListener('click', openTicketView);

    // --- ADDING OFFENSES ---
    document.getElementById('btn-add-inspection').addEventListener('click', addInspectionToCart);
    document.getElementById('btn-add-traffic').addEventListener('click', addTrafficToCart);

    // --- NEW NAVIGATION LISTENERS ---
    document.getElementById('btn-switch-to-ticket').addEventListener('click', openTicketView);
    document.getElementById('btn-switch-to-inspect').addEventListener('click', openInspectionView);
    
    // --- FINAL GENERATION ---
    document.getElementById('btn-generate-ticket').addEventListener('click', showSummaryBox);
    
    // --- PROCEED TO FINAL FORM ---
    const btnProceed = document.getElementById('btn-proceed-to-final');
    if (btnProceed) btnProceed.addEventListener('click', handleProceedToFinal);

    // --- FINAL FORM ACTIONS (FIXED) ---
    const btnPayOnline = document.getElementById('btn-final-pay-online');
    if (btnPayOnline) btnPayOnline.addEventListener('click', () => processFinalPayment('online'));

    const btnPrint = document.getElementById('btn-final-print');
    // FIX: Directly call window.print() for the browser print dialog
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    const btnBackSummary = document.getElementById('btn-back-to-summary');
    if (btnBackSummary) btnBackSummary.addEventListener('click', closeFinalTicket);

    const btnFinish = document.getElementById('btn-finish-patrol');
    if (btnFinish) btnFinish.addEventListener('click', resetPatrol);

    // --- UTILITIES ---
    const btnReset = document.getElementById('btn-reset-all') || document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', resetPatrol);

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
    const overlay = document.getElementById('bio-overlay');
    const box = document.getElementById('bio-box');
    const text = document.getElementById('bio-text');
    const faceIcon = document.querySelector('.face-features');
    const fingerIcon = document.querySelector('.fingerprint-lines');
    const resultIcon = document.querySelector('.result-icon');
    const ring = document.querySelector('.scan-ring');

    overlay.classList.remove('hidden'); 
    box.className = 'bio-box'; 
    resultIcon.classList.add('hidden'); 
    ring.classList.remove('hidden'); 
    text.textContent = type === 'face' ? "Scanning Face..." : "Scanning Print...";

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
    // 1. GET & CLEAN INPUT
    const inputEl = document.getElementById('vrn-input'); 
    let rawInput = inputEl.value.toUpperCase().trim(); 
    
    // Remove existing dashes/spaces/special chars to get "CRIME001"
    const cleanStr = rawInput.replace(/[^A-Z0-9]/g, '');

    if (cleanStr.length === 0) return alert("Please enter a VRN");

    // 2. SMART FORMATTING (Flexible)
    // Regex explanation:
    // ^([A-Z]+)  -> Capture any number of letters at the start (Group $1)
    // ([0-9]+)$  -> Capture any number of digits at the end (Group $2)
    let formattedVrn = cleanStr.replace(/^([A-Z]+)([0-9]+)$/, '$1-$2');

    // 3. UPDATE UI 
    inputEl.value = formattedVrn;

    // 4. RESET UI STATE
    document.getElementById('step-result').classList.remove('hidden');
    document.getElementById('step-result').innerHTML = '<p>Scanning Database...</p>';
    document.getElementById('step-actions').classList.add('hidden');
    document.getElementById('step-impound').classList.add('hidden'); 

    // 5. PERFORM ANALYSIS
    const analysis = await Vehicle.analyze(formattedVrn); 
    STATE.currentVehicle = analysis;
    
    // 6. RENDER CARD
    const bgClass = analysis.status.color === 'RED' ? 'bg-red' : analysis.status.color === 'ORANGE' ? 'bg-orange' : 'bg-green';
    document.getElementById('step-result').innerHTML = `
        <div class="status-card ${bgClass}">
            <h2>${analysis.status.headline}</h2>
            <p>${analysis.status.message}</p>
        </div>`;
    
    // 7. HANDLE RED / IMPOUND LOGIC
    if (analysis.status.color === 'RED') {
        document.getElementById('step-actions').classList.add('hidden');
        document.getElementById('step-impound').classList.remove('hidden');
        
        if (!STATE.currentUser.permissions?.canOverrideImpound) {
             // alert("⚠️ HIGH RISK VEHICLE DETECTED - IMPOUND REQUIRED");
        }
    } else {
        document.getElementById('step-impound').classList.add('hidden');
        document.getElementById('step-actions').classList.remove('hidden');
    }
}

/* ==========================================================================
   4. WORKFLOW: ADDING ITEMS
   ========================================================================== */

function openInspectionView() {
    UI.steps.workspace.classList.remove('hidden');
    document.getElementById('workspace-inspection').classList.remove('hidden');
    document.getElementById('workspace-ticket').classList.add('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden'); 
    
    const container = document.getElementById('checklist-container');
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
    
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
}

function openTicketView() {
    UI.steps.workspace.classList.remove('hidden');
    document.getElementById('workspace-inspection').classList.add('hidden');
    document.getElementById('workspace-ticket').classList.remove('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden'); 
    
    UI.steps.workspace.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        const input = document.getElementById('traffic-ai-input');
        if(input) input.focus();
    }, 500);
}

async function addInspectionToCart() {
    const btn = document.getElementById('btn-add-inspection');
    btn.textContent = "Adding...";
    btn.disabled = true;
    
    const checkboxes = document.querySelectorAll('#checklist-container input[type="checkbox"]:checked');
    let newItems = [];

    checkboxes.forEach(cb => {
        newItems.push({
            type: "Defect (Manual)",
            desc: cb.getAttribute('data-label'),
            fine: parseInt(cb.getAttribute('data-fine'))
        });
        cb.checked = false; 
    });

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

    const uniqueItems = newItems.filter(newItem => {
        const exists = STATE.sessionOffenses.some(existing => 
            existing.desc === newItem.desc
        );
        return !exists;
    });

    if (uniqueItems.length === 0) {
        return alert("Item already exists on the ticket list.");
    }

    STATE.sessionOffenses = [...STATE.sessionOffenses, ...uniqueItems];
    
    document.getElementById('action-bar-final').classList.remove('hidden');
    
    if (uniqueItems.length < newItems.length) {
        alert(`Added ${uniqueItems.length} new item(s). Duplicates were excluded.`);
    } else {
        alert(`Added ${uniqueItems.length} item(s) to ticket compilation.`);
    }
}

/* ==========================================================================
   5. FINAL STAGE: GENERATE SUMMARY & PROCEED
   ========================================================================== */

function showSummaryBox() {
    document.getElementById('workspace-inspection').classList.add('hidden');
    document.getElementById('workspace-ticket').classList.add('hidden');
    document.getElementById('action-bar-final').classList.add('hidden');
    
    const listContainer = document.getElementById('ticket-breakdown-list');
    listContainer.innerHTML = '';
    
    STATE.sessionOffenses.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'summary-item'; 
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.borderBottom = '1px dashed #ccc';
        div.style.padding = '5px 0';

        div.innerHTML = `
            <span>${index+1}. ${item.desc}</span>
            <strong>$${item.fine}</strong>
        `;
        listContainer.appendChild(div);
    });

    const total = STATE.sessionOffenses.reduce((sum, item) => sum + item.fine, 0);
    document.getElementById('lbl-total-fine').textContent = `$${total}.00`;

    const finalBox = document.getElementById('ticket-confirm-box');
    finalBox.classList.remove('hidden');
    finalBox.scrollIntoView({ behavior: 'smooth' });
}

function handleProceedToFinal() {
    const ticketData = {
        officer: {
            name: STATE.currentUser ? STATE.currentUser.name : "OFFICER",
            rank: STATE.currentUser ? STATE.currentUser.rank : "CST",
            forceId: STATE.currentUser ? STATE.currentUser.forceId : "9921",
            station: "HRE CENTRAL TRAFFIC" 
        },
        offender: {
            name: STATE.currentVehicle ? STATE.currentVehicle.data.owner : "UNKNOWN DRIVER",
            address: "1 Mock Address Ave, Harare, Zimbabwe",
            vrn: UI.inputs.vrn.value || "Unknown",
            make: STATE.currentVehicle ? STATE.currentVehicle.data.make : "N/A"
        },
        offenses: STATE.sessionOffenses,
        total: STATE.sessionOffenses.reduce((sum, item) => sum + item.fine, 0),
        dateTime: new Date()
    };

    openFinalTicket(ticketData);
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
    STATE.currentVehicle = null;
    STATE.currentTicket = null;
    resetSessionData(); 

    UI.inputs.vrn.value = '';
    document.getElementById('checklist-container').innerHTML = '';
    
    const inspectInput = document.getElementById('inspect-ai-input');
    if(inspectInput) inspectInput.value = '';
    
    const trafficInput = document.getElementById('traffic-ai-input');
    if(trafficInput) trafficInput.value = '';
    
    // Hide everything
    const successMsg = document.getElementById('payment-success-msg');
    if(successMsg) successMsg.classList.add('hidden');

    document.getElementById('step-result').classList.add('hidden');
    document.getElementById('step-actions').classList.add('hidden'); 
    document.getElementById('step-impound').classList.add('hidden'); // <--- ADD THIS LINE
    document.getElementById('step-workspace').classList.add('hidden');
    document.getElementById('ticket-confirm-box').classList.add('hidden');
    
    if (UI.views.final) UI.views.final.classList.add('hidden');
    UI.views.patrol.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNetworkStatus() {
    STATE.isOffline = !navigator.onLine;
    if (STATE.isOffline) {
        UI.header.dot.style.background = 'grey';
        UI.header.name.textContent += ' (OFFLINE)';
    } else {
        UI.header.dot.style.background = 'var(--green)';
        if (STATE.currentUser) {
            UI.header.name.textContent = `${STATE.currentUser.rank} ${STATE.currentUser.name}`;
        }
    }
}