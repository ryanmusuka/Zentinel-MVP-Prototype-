/* js/modules/generateTicket.js */

export function openFinalTicket(data) {
    // 1. Switch Views
    document.getElementById('view-patrol').classList.add('hidden');
    document.getElementById('view-final-ticket').classList.remove('hidden');

    // 2. Populate Fields
    setText('f265-station', data.officer.station || "HARARE CENTRAL");
    setText('f265-officer', `${data.officer.forceId} ${data.officer.rank} ${data.officer.name}`);
    setText('f265-sig-officer', data.officer.name);

    // Offender
    const names = data.offender.name.split(' ');
    setText('f265-surname', names.pop() || data.offender.name);
    setText('f265-names', names.join(' ') || "---");
    setText('f265-address', data.offender.address);
    setText('f265-vrn', `${data.offender.vrn} / ${data.offender.make}`);

    // Offenses
    const descBox = document.getElementById('f265-desc');
    if (descBox) {
        descBox.innerHTML = data.offenses.map((o, i) => 
            `<div>${i+1}. ${o.desc.toUpperCase()}</div>`
        ).join('');
    }

    // Totals
    setText('f265-total', data.total);
    const now = new Date();
    setText('f265-date', now.toLocaleDateString());
    setText('f265-time', now.toLocaleTimeString());

    window.scrollTo(0,0);
}

export function closeFinalTicket() {
    document.getElementById('view-final-ticket').classList.add('hidden');
    document.getElementById('view-patrol').classList.remove('hidden');
}

export function processFinalPayment(type) {
    // 1. Simple Alert (Mock Success)
    alert(`PAYMENT SUCCESSFUL\n\nMethod: ${type.toUpperCase()}\nStatus: Processed\n\nReturning to Patrol...`);

    // 2. Auto-Reset the App
    // We trigger the click on the hidden reset button in app.js to handle the cleanup
    const resetBtn = document.getElementById('btn-reset-all');
    if (resetBtn) {
        resetBtn.click();
    } else {
        // Fallback if button missing
        location.reload(); 
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
}