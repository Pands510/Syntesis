SELECT
    "studentId",
    semester,
    "academicTermId",
    type
FROM academic_history
WHERE type = 'PROGRESSAO'
AND "academicTermId" = '9ac87886-8bdd-4fef-bc7c-1505a7d22256';