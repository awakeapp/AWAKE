# Vehicle Follow-ups & Finance Integration Plan

## Goal
Extend Vehicle Management to support structured follow-ups (maintenance, renewals) with reminders, and integrate with Finance Management to automatically log expenses upon completion.

## User Review Required
> [!IMPORTANT]
> - Finance Integration: Completing a follow-up with a cost will automatically create a transaction in the "Transport" category (or new "Vehicle" category).
> - Recurring Logic: Reminders can be set based on Date OR Odometer.

## Proposed Changes

### Data Model (VehicleContext)
- **New State**: `followUps` (Array), `serviceRecords` (Array)
- **FollowUp Object**:
  ```json
  {
    "id": "fu_123",
    "vehicleId": "veh_1",
    "type": "Servicing", // Enum: Refuel, Servicing, Oil Change, etc.
    "dueDate": "2026-06-01", // Optional
    "dueOdometer": 15000, // Optional
    "isRecurring": true,
    "frequencyType": "date", // 'date' or 'odometer'
    "frequencyValue": 3, // e.g., 3 months
    "frequencyUnit": "months",
    "status": "pending"
  }
  ```
- **ServiceRecord Object**: // History of completed follow-ups
  ```json
  {
    "id": "rec_123",
    "vehicleId": "veh_1",
    "followUpId": "fu_123",
    "date": "2026-03-01",
    "type": "Servicing",
    "cost": 5000,
    "odometer": 12500,
    "notes": "Changed oil filter",
    "financeTxId": "tx_fin_999"
  }
  ```

### Components

#### [MODIFY] [VehicleContext.jsx](file:///e:/APPS/AWAKE/src/context/VehicleContext.jsx)
- Import `useFinance`.
- Add `followUps` and `serviceRecords` state and persistence.
- Implement `addFollowUp`, `updateFollowUp`, `deleteFollowUp`.
- Implement `completeFollowUp`:
    - Create `ServiceRecord`.
    - Update Vehicle Odometer.
    - Call `finance.addTransaction`.
    - If recurring, generate next `FollowUp`.

#### [NEW] [FollowUpList.jsx](file:///e:/APPS/AWAKE/src/components/organisms/vehicle/FollowUpList.jsx)
- Display upcoming and overdue reminders.
- "Complete" button triggers the completion modal.

#### [NEW] [AddFollowUpModal.jsx](file:///e:/APPS/AWAKE/src/components/organisms/vehicle/AddFollowUpModal.jsx)
- Form to create/edit reminders.
- Select Type, Due Date/Odometer, Recurring options.

#### [NEW] [CompleteFollowUpModal.jsx](file:///e:/APPS/AWAKE/src/components/organisms/vehicle/CompleteFollowUpModal.jsx)
- Form to enter Cost, Odometer, Notes on completion.

#### [MODIFY] [VehicleDashboard.jsx](file:///e:/APPS/AWAKE/src/pages/vehicle/VehicleDashboard.jsx)
- Integrate `FollowUpList`.
- Add tab/section for "Service History".

## Verification Plan
### Automated Tests
- None (UI heavy).

### Manual Verification
1. Open Vehicle Dashboard.
2. Add a specialized follow-up (e.g., "Oil Change" due in 1 month).
3. Verify it appears in "Upcoming".
4. Click "Complete". Enter cost ($50) and new odometer (+100km).
5. Verify:
    - Follow-up moves to history (or updates if recurring).
    - Vehicle Odometer updates.
    - Go to Finance Dashboard -> Verify new transaction exists.
