SELECT
    u.name,
    u.email,
    s."registrationNumber",
    s.status,
    s.semester,
    c.name AS curso
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
WHERE LOWER(u.name) LIKE '%sincronização%'
   OR LOWER(u.email) LIKE '%aluno.sync%'
ORDER BY u."createdAt" DESC;