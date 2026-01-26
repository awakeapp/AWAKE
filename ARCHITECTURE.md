# HUMI AWAKE - System Reference Architecture

## 1. System Overview
**Objective**: Production-grade daily routine & habit tracking PWA.
**Core Principle**: "Offline-First, Submit-to-Sync".
**Primary Store**: `localStorage` (Real-time).
**Persistent Store**: Google Sheets (Archival/History).

---

## 2. Directory Structure (`src/`)

```text
src/
├── assets/                 # Static assets (icons, images)
├── components/             # Shared UI components
│   ├── atoms/              # Buttons, Inputs, Labels
│   ├── molecules/          # FormGroups, ListItem
│   ├── organisms/          # Navbar, DayViewer, HabitGrid
│   └── templates/          # Layout wrappers (MainLayout, AuthLayout)
├── config/                 # Configuration files
│   ├── firebase.js         # Firebase initialization
│   └── sheets.js           # Google Sheets API config
├── contexts/               # React Context Providers
│   ├── AppProviders.jsx    # Combined provider wrapper
│   ├── AuthContext.jsx     # User session state
│   ├── DateContext.jsx     # Time travel & navigation logic
│   ├── DataContext.jsx     # Combined Routine/Habit data & Sync logic
│   └── SettingsContext.jsx # Theme, notifications, localized settings
├── hooks/                  # Custom React Hooks
│   ├── useLocalStorage.js  # Typed storage accessor
│   ├── useSync.js          # Sync orchestration
│   └── useSheetData.js     # Sheets API interactions
├── lib/                    # Core Business Logic & Helpers
│   ├── dateUtils.js        # luxon/date-fns wrappers
│   ├── syncEngine.js       # Conflict resolution & API calls
│   └── validators.js       # Data integrity checks
├── models/                 # TypeScript interfaces / JSDoc schemas
├── pages/                  # Route components
│   ├── Dashboard.jsx       # Main daily view
│   ├── Login.jsx           # Auth entry point
│   ├── History.jsx         # Calendar/Grid view of past data
│   └── Settings.jsx        # App configuration
├── services/               # External API layers
│   ├── authService.js      # Firebase wrapper
│   └── sheetsService.js    # GAPIs wrapper
└── styles/                 # Global styles & Tailwind directives
```

---

## 3. Component Hierarchy

### Root Application
- `App.jsx`
  - `ErrorBoundary`
  - `AppProviders` (Context Injection)
    - `Router`
      - `AuthGuard` (Redirects if unauthenticated)
        - `MainLayout`

### Major Views
1.  **Dashboard (Home)**
    -   `DateHeader` (Navigation < Today >)
    -   `StatusBanner` (Sync status, Offline indicator)
    -   `RoutineSection`
        -   `RoutineItem` (Input: Checkbox/Number/Text)
    -   `HabitSection`
        -   `HabitTracker`
    -   `NotesArea`
    -   `SubmitButton` (The "Lock" trigger)

2.  **History**
    -   `CalendarGrid`
    -   `DaySummaryCard`

3.  **Login**
    -   `GoogleSignInButton`

---

## 4. Data Architecture

### Context Design

#### `AuthContext`
-   **State**: `user` (Firebase User), `loading` (bool), `error` (string).
-   **Actions**: `login()`, `logout()`.

#### `DateContext`
-   **State**: `currentDate` (Date object), `isToday` (derived), `viewMode` ('day' | 'month').
-   **Actions**: `setDate(date)`, `prevDay()`, `nextDay()`, `jumpToToday()`.
-   **Rules**:
    -   `currentDate` cannot be > `TopLevel.Today`.
    -   Updates synchronize URL params (e.g., `?date=2023-10-27`).

#### `DataContext` (Combines Routine & Habit contexts)
-   **State**:
    -   `dailyData`: Map<ISODateString, DayData> (In-memory cache of loaded days).
    -   `syncStatus`: 'idle' | 'syncing' | 'error' | 'success'.
    -   `lockState`: Map<ISODateString, boolean>.
-   **Actions**:
    -   `updateTask(taskId, value)`
    -   `updateNote(text)`
    -   `submitDay()` (Triggers Sync)
    -   `unlockDay(reason)`

### Data Models

#### **1. Day (The Atomic Unit)**
```json
{
  "date": "2023-10-27",
  "status": "DRAFT" | "LOCKED",
  "submittedAt": 1698432000000,
  "routines": {
    "morning_meditation": { "value": true, "type": "bool" },
    "water_intake": { "value": 2500, "type": "number", "unit": "ml" }
  },
  "habits": ["habit_id_1", "habit_id_2"], // Array of completed IDs
  "notes": "Felt energetic today.",
  "metadata": {
    "device": "UserAgentString",
    "version": "1.0"
  }
}
```

#### **2. Task/Routine Definition** (Static Configuration)
```json
{
  "id": "water_intake",
  "label": "Drink Water",
  "inputType": "number",
  "validation": { "min": 0, "max": 5000 },
  "category": "health"
}
```

#### **3. UserActionLog** (Audit Trail - Local Only, heavily redacted for Sheets)
```json
{
  "timestamp": 123456789,
  "action": "SUBMIT_DAY",
  "targetDate": "2023-10-27",
  "payload": { "summary": "Submitted 5 routines" }
}
```

---

## 5. Logic Flow: Date Navigation & Locking

1.  **Navigation**:
    -   User clicks "Next Day":
        -   IF `targetDate` > `Today`: Block action. Show "Cannot predict the future" toast.
        -   IF `targetDate` <= `Today`: Update `DateContext`.

2.  **View Logic**:
    -   **On `currentDate` Change**:
        1.  Check `localStorage` for `DayData_${currentDate}`.
        2.  Check `localStorage` for `LockStatus_${currentDate}`.
        3.  IF `isLocked`: Render **Read-Only** view. Show "Unlock" button (requires admin/reason).
        4.  IF `!isLocked` AND `isToday`: Render **Editable** view.
        5.  IF `!isLocked` AND `isPast`: Render **Editable** (User forgot to submit). Warning banner: "Late Entry".

3.  **Locking**:
    -   Triggered by "Submit to Cloud" button.
    -   Action:
        1.  Validate all required fields.
        2.  Set `status` = 'LOCKED'.
        3.  Call `SyncEngine.pushToSheet()`.
        4.  On Success: Write `LockStatus_${date} = true` to local storage.

---

## 6. Sync Strategy (Local → Sheets)

**Concept**: The Sheet is an Append-Only Log of "Locked" days. It is NOT a real-time database.

### The "Submit" Transaction
1.  **Gather Data**: Serialize current `Day` state.
2.  **Format**: Flatten JSON tree into a Row based on strict Schema (Column A=Date, B=JSON_Payload, C...Z=Key Metrics).
3.  **Push**:
    -   `sheets.spreadsheets.values.append`
4.  **Confirm**:
    -   If API 200 OK:
        -   Mark local data as `LOCKED`.
        -   Update `LastSyncTimestamp`.
    -   If Error (Network):
        -   Keep status `DRAFT` (or `PENDING_SYNC`).
        -   Queue retry or show manual "Retry" button.

### Conflict Resolution
*Rule: Sheets is Immutable Truth for Locked Days.*
1.  **On Load (App Start)**:
    -   Fetch list of 'Locked Dates' from Sheets (a minimal range query, e.g., Column A only).
    -   Update local `LockState` map.
2.  **Conflict**:
    -   User tries to edit a day that Sheets says is Locked (but local says is Draft - e.g., cleared cache).
    -   **Resolution**: Sheets wins. The UI enters Read-Only mode and fetches the full row from Sheets to populate the view.

---

## 7. Performance Constraints

1.  **React**:
    -   **Memoization**: Wrap `DayViewer` and heavy Charts in `React.memo`.
    -   **Debounce**: Auto-save to `localStorage` debounced by 500ms. Do NOT write to disk on every keystroke.

2.  **API**:
    -   **Rate Limiting**: logic to prevent spamming the "Submit" button.
    -   **Batching**: If multiple past days are submitted locally (offline mode), batched upload is preferred (though Sheets API handles single appends well).

3.  **Storage**:
    -   Prune `localStorage` if > 5MB? (Unlikely text data will exceed this soon, but good to plan). Keep last 365 days active.

---

## 8. Security Boundaries

1.  **Client-Side Secrets**:
    -   **NEVER** store Service Account Keys.
    -   Use **Firebase Auth** + **Identity Platform** to create a token for Google APIs (OAuth 2.0 flow).
2.  **Sensitive Data**:
    -   Do not store PII in general log fields.
    -   `localStorage` is accessible by XSS. Sanitize all standard inputs.
3.  **Sheet Access**:
    -   The Sheet should be Private.
    -   App accesses it via the User's OAuth credentials (Scope: `spreadsheets`).
    -   The app creates its own specific Sheet file on first launch to avoid accessing user's other files.
