# Security Specification - TKAD Adiwerna Bank Soal

## 1. Data Invariants
- **Questions (`/questions/{questionId}`)**:
  - Must have a valid string `id`, `code`, `subtest`, `topic`, `difficulty`, `prompt`, `createdById`, `createdByName`, `createdAt`, `updatedAt`.
  - Must belong to an authorized creator or be updated during valid review cycles.
  - Documents cannot be mutated with arbitrary unauthorized fields.
- **Users (`/users/{userId}`)**:
  - Contains user accounts with `id`, `name`, `email`, `role`.
  - Roles are restricted to `pembuat`, `reviewer`, and `admin`.
- **Audit Logs (`/audit_logs/{logId}`)**:
  - Append-only records containing actor details, timestamp, action type, and description.
- **Notifications (`/notifications/{notificationId}`)**:
  - User notifications with timestamps, message, and read status.
- **Categories (`/categories/{categoryId}`)**:
  - Department and subtest metadata.
- **Settings (`/settings/{settingId}`)**:
  - System configuration document.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated Write**: Writing to `/questions/q1` without auth credentials -> DENIED.
2. **Ghost Field Injection**: Adding `isAdminMaster: true` to a question document -> DENIED.
3. **Invalid Question ID**: Setting document path ID longer than 128 characters or containing illegal characters -> DENIED.
4. **Invalid Question Status**: Setting status to `hacked_status` -> DENIED.
5. **Invalid Question Type**: Setting type to `unknown_type` -> DENIED.
6. **Corrupted Difficulty**: Setting difficulty to `impossible` instead of `mudah`/`sedang`/`sulit` -> DENIED.
7. **Oversized String Attack**: Submitting 5MB string in user name or question code -> DENIED.
8. **Invalid User Role**: Creating a user with role `supergod` instead of `pembuat`/`reviewer`/`admin` -> DENIED.
9. **Tampered Audit Log Action**: Overwriting existing immutable audit log -> DENIED.
10. **Category Topic Array Poisoning**: Injecting non-string types or oversized array in topics -> DENIED.
11. **Settings Payload Corruption**: Submitting corrupted non-boolean to `gasAutoSync` -> DENIED.
12. **Catch-All Probe**: Attempting arbitrary read/write on undeclared paths (e.g., `/secrets/api`) -> DENIED.
