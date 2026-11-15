SELECT
    u.name AS aluno,
    s.status AS situacao_academica,
    e.status AS situacao_matricula
FROM enrollments e
JOIN students s ON s.id = e."studentId"
JOIN users u ON u.id = s."userId"
WHERE e."classId" = '1f891797-504c-4ff0-ab32-aca6c4b250c1'
ORDER BY u.name;