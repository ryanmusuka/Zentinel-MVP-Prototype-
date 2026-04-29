# 🛡️ Zentinel: ZRP Digital Ticketing Prototype

> **An AI-powered, offline-first digital traffic enforcement system prototype designed for the Zimbabwe Republic Police (ZRP). Replaces manual ticketing with automated vehicle lookup, smart violation analysis, and digital payment integration.**

---

## 🛠️ Tech Stack (Prototype MVP)
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Architecture:** Simulated Single Page Application (SPA) / MVP structure.
* *Note: This is the prototype stack. The final production app will utilize modern frameworks like Next.js, Prisma, and Supabase.*

---

## ✨ Key Features
* **Database Lookup Simulation:** Mimics fetching real-time data from ZINARA and ZRP national databases to identify warrants, stolen flags, and registration status.
* **Vehicle Inspection Checklist:** A guided UI for officers to conduct roadworthy tracking (e.g., checking for fire extinguishers, reflectors) and impound unsafe vehicles.
* **AI Legal Assistance:** Simulates querying the Road Traffic Act [Chapter 13:11] to assist the officer in typing the exact legal offense and calculating the standard fine.
* **Ticket Generation & Download:** Generates a digital ticket summary that can be downloaded or reviewed instantly.
* **Payment Simulation:** Demonstrates how a digital, cashless fine payment flow would operate on the roadside.

---

## 🧪 Testing Data

Use the following credentials and test Vehicle Registration Numbers (VRNs) to explore the different scenarios built into the prototype.

### Login Credentials

| Force ID | Password | Rank | Access Level |
| :--- | :--- | :--- | :--- |
| 9921 | password123 | Constable | Standard: Can scan cars & issue tickets. |
| 1001 | admin777 | Inspector | High: Can override impounds & view sensitive logs. |

After, you'll be prompted to selected to perform a biometrics scan. This is a simulation with a 50% success chance. Therefore, continuoosly click on either till successful login.

### VRN Testing Scenarios and Expected Outcomes
| Test VRN (Type Exactly) | Format Valid? | Risk Level | UI Status Display | Description / Action |
| :--- | :--- | :--- | :--- | :--- |
| **ABC-1234** | ✅ Yes | 🟢 GREEN | VEHICLE CLEAR | Perfect format, known plate. Shows standard details and procedure buttons. |
| **HRE-5555** | ✅ Yes | 🟠 ORANGE | LICENSE EXPIRED | Perfect format, flagged expired. Shows standard details and procedure buttons. |
| **CRIME-001** | ✅ Yes | 🔴 RED | STOLEN VEHICLE | Perfect format, flagged stolen. Triggers the critical Impound UI. |
| **XYZ-9999** | ✅ Yes | 🔴 RED | HABITUAL OFFENDER | Perfect format, multiple warrants. Triggers the critical Impound UI. |
| **HELLO (or ABC-12)** | ❌ No | ⚪ GRAY | INVALID REG NUMBER | Fails the "3 letters + 4 numbers" check. Shows format error banner. |

## 🧠 Lessons Learned

Building this prototype highlighted the importance of a seamless User Experience for law enforcement personnel who need to operate quickly on busy roadsides. Mocking the "Graceful Offline" state in Vanilla JS required creative uses of local storage and session state to ensure data wasn't lost during page reloads, mirroring the real-world challenge of intermittent internet connectivity. Furthermore, translating the strict legal jargon of the Road Traffic Act [Chapter 13:11] into a user-friendly "Human-in-the-loop" UI proved that AI can significantly bridge the gap between complex legal code and daily police operations.
