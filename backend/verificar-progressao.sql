SELECT
    ah."studentId",
    u.name AS aluno,
    ah.semester,
    ah."academicTermId",
    ah."occurredAt",
    ah.description
FROM academic_history ah
JOIN students s ON s.id = ah."studentId"
JOIN users u ON u.id = s."userId"
WHERE ah.type = 'PROGRESSAO'
AND ah."academicTermId" = '9ac87886-8bdd-4fef-bc7c-1505a7d22256';
