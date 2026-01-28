// --- js/modules/generateTicket.js ---

export function openFinalTicket(data) {
    // 1. Get Views
    const viewPatrol = document.getElementById('view-patrol');
    const viewFinal = document.getElementById('view-final-ticket');

    // 2. Hide the Patrol View COMPLETELY
    viewPatrol.classList.add('hidden');
    
    // 3. Generate the Ticket HTML (Same as before)
    viewFinal.innerHTML = `
        <div class="ticket-wrapper">
             <div class="watermark">DEMO. UNOFFICIAL</div>
            
            <div class="ticket-header">
                <div class="zrp-logo"><img src="assets/zrp-logo.png" alt="ZRP" onerror="this.style.display='none'"></div>
                <div class="header-text">
                    <h3>ZIMBABWE REPUBLIC POLICE</h3>
                    <h1>ADMISSION OF GUILT TRAFFIC FINE</h1>
                    <small>COURT FORMS: Z69J</small>
                </div>
                <div class="ticket-number">
                    <span class="red-text">1264615 A</span>
                </div>
            </div>

            <table class="ticket-table">
                <tr>
                    <td colspan="2" class="field-box">
                        <span class="label">Station:</span>
                        <div class="fill-in">${data.officer.station}</div>
                    </td>
                    <td colspan="2" class="field-box">
                        <span class="label">Arresting Detail (Name/Rank/No):</span>
                        <div class="fill-in">${data.officer.forceId} ${data.officer.rank} ${data.officer.name.toUpperCase()}</div>
                    </td>
                </tr>

                <tr>
                    <td colspan="4" class="field-box">
                        <span class="label">Surname of person admitting guilt:</span>
                        <div class="fill-in">${data.offender.name.split(' ')[1] || data.offender.name}</div>
                        <span class="label" style="margin-left:20px;">Other names:</span>
                        <div class="fill-in">${data.offender.name.split(' ')[0] || ''}</div>
                    </td>
                </tr>

                <tr>
                    <td colspan="3" class="field-box">
                        <span class="label">Residential address:</span>
                        <div class="fill-in">${data.offender.address}</div>
                    </td>
                    <td class="field-box">
                        <span class="label">VRN / Make:</span>
                        <div class="fill-in">${data.offender.vrn} / ${data.offender.make}</div>
                    </td>
                </tr>

                <tr>
                    <td colspan="4" class="field-box">
                        <span class="label">Charge (section and statutory enactment):</span>
                        <div class="fill-in">SEC 4(1) OF THE R.T.A</div>
                    </td>
                </tr>

                <tr>
                    <td colspan="4" class="field-box description-box">
                        <span class="label">Brief description of offence(s):</span>
                        <div class="fill-in-multi">
                            ${data.offenses.map((off, i) => 
                                `<div>${i+1}. ${off.desc.toUpperCase()}</div>`
                            ).join('')}
                        </div>
                        
                        <div class="date-time-row">
                            <span>Date: <strong class="blue-ink">${data.dateTime.toLocaleDateString()}</strong></span>
                            <span>Time: <strong class="blue-ink">${data.dateTime.toLocaleTimeString()}</strong></span>
                            <span>Place: <strong class="blue-ink">HARARE CBD</strong></span>
                        </div>
                    </td>
                </tr>

                <tr>
                    <td colspan="3" class="field-box right-align">
                        <span class="label">AMOUNT OF DEPOSIT FINE FIXED BY PRESCRIBED OFFICER:</span>
                    </td>
                    <td class="field-box fine-box">
                        <span class="currency">$</span>
                        <span class="amount blue-ink">${data.total}.00</span>
                    </td>
                </tr>

                <tr>
                    <td colspan="4" class="legal-text">
                        I, the above named, do hereby admit that I am guilty of the said offence(s) and wish to deposit the sum of money fixed.
                    </td>
                </tr>

                <tr>
                    <td colspan="2" class="field-box">
                        <span class="label">Witnessed by (Officer):</span>
                        <div class="fill-in signature-font">${data.officer.name}</div>
                    </td>
                    <td colspan="2" class="field-box">
                        <span class="label">Signed (Offender):</span>
                        <div class="fill-in signature-font">Digitally Signed via Biometric</div>
                    </td>
                </tr>
            </table>

            <div class="final-actions no-print">
                <button id="btn-final-print" style="background:#333; color:white; padding:10px 20px; cursor:pointer;">🖨️ PRINT TICKET</button>
                <button id="btn-final-pay-online" style="background:green; color:white; padding:10px 20px; cursor:pointer;">💳 PAY NOW (ECOCASH)</button>
                <button id="btn-back-to-summary" style="background:none; border:none; text-decoration:underline; cursor:pointer; color:#555;">Modify Ticket</button>
            </div>
        </div>
    `;

    // 4. Show the Final View
    viewFinal.classList.remove('hidden');

    // 5. Scroll to top so user sees it immediately
    window.scrollTo({ top: 0, behavior: 'instant' });

    // 6. Attach Listeners
    document.getElementById('btn-back-to-summary').addEventListener('click', closeFinalTicket);
    document.getElementById('btn-final-print').addEventListener('click', () => window.print());
    document.getElementById('btn-final-pay-online').addEventListener('click', () => processFinalPayment('online'));
}

export function closeFinalTicket() {
    // Swap Views Back
    document.getElementById('view-final-ticket').classList.add('hidden');
    document.getElementById('view-patrol').classList.remove('hidden');
    
    // Scroll back to where they were (optional, but good UX)
    document.getElementById('action-bar-final').scrollIntoView();
}

export function processFinalPayment(type) {
    alert(`Processing ${type} payment... Mock Success.`);
    document.getElementById('view-final-ticket').classList.add('hidden');
    // Trigger the success/reset flow in app.js
    const btnFinish = document.getElementById('btn-finish-patrol');
    if (btnFinish) btnFinish.click();
}