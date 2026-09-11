# Hackathon Live Demo Disaster Recovery & Backup Procedures

**Objective:** Deterministic, legitimate recovery procedures during a live judging session if technical anomalies occur.  
**Rule:** *No fake bypass mechanisms, no fabricated mock responses.*

---

## Scenario 1: Accidental Browser Refresh During Presentation

### Impact:
React state resets to the initial view (Module 1 or Home).

### Recovery Procedure (Takes 4 Seconds):
1. Immediately look at the top hero banner.
2. Click the purple button: **"Launch Recommended Demo Scenario (Student S001 · CO2)"**.
3. **What this does:**
   * Re-ingests the validated 150-student sample cohort.
   * Auto-selects Course `CS301`, Outcome `CO2`, Horizon `A3`, and Student `S001`.
   * Pre-loads the verified $R1$ reassessment dataset.
   * Restores full cross-module continuity instantly.

---

## Scenario 2: Browser LocalStorage is Cleared or Corrupted

### Impact:
Approved intervention audit logs in Module 6 appear empty, temporarily locking Module 7.

### Recovery Procedure:
1. Navigate to **Module 6: Interventions**.
2. Set filter to Course `CS301` and Student `S001`.
3. Locate the top recommended plan (*Peer Learning Clinic for Page Replacement*).
4. Click **"Approve Intervention"**.
5. Type test note: `"Approved for demonstration"` and submit.
6. Module 7 automatically unlocks and syncs immediately.

---

## Scenario 3: Dev Server Crashes or Terminal Closed

### Impact:
Browser displays `ERR_CONNECTION_REFUSED` at `http://localhost:5173`.

### Recovery Procedure:
1. Open PowerShell / Command Prompt in the project root:
   ```powershell
   npm run dev
   ```
2. If port 5173 is locked by a zombie process:
   ```powershell
   npx vite --port 5174
   ```
3. Open `http://localhost:5174` in the browser. The entire application bundle loads cleanly in $<1\text{ second}$.

---

## Scenario 4: Reassessment Data Unavailable or Reset

### Impact:
Module 7 displays *"Awaiting Post-Intervention Reassessment Data"*.

### Recovery Procedure:
1. In Module 7, look at Section 1 (Scope Selector).
2. Click the button: **"Load Synthetic Reassessment Data (R1)"**.
3. The system immediately ingests `data/sample_reassessment.csv`.
4. Student `S001`'s pre/post learning gain ($+44.0\text{ pp}$) renders instantly.

---

## Scenario 5: Build Failure Before Live Demo

### Impact:
`npm run build` fails due to unexpected cache corruption.

### Recovery Procedure:
1. Clean the Vite build cache:
   ```powershell
   rmdir -r -fo dist
   rmdir -r -fo node_modules\.vite
   ```
2. Verify TypeScript types:
   ```powershell
   npx tsc --noEmit
   ```
3. Rebuild cleanly:
   ```powershell
   npm run build
   ```
4. If presenting from static files, serve the verified `dist/` directory:
   ```powershell
   npx vite preview
   ```

---

## Scenario 6: Projector / Display Resolution Clipping

### Impact:
Tables or dashboard cards overflow on low-resolution conference projectors (e.g., 720p or 1024x768).

### Recovery Procedure:
1. Press `Ctrl + -` (Zoom Out) in Google Chrome to set browser zoom to **80%** or **90%**.
2. The responsive Tailwind grid automatically collapses columns into a clean single-viewport executive layout.

