SELECT
    u.name AS aluno,
    s."registrationNumber" AS matricula,
    s.status AS situacao,
    s.semester AS semestre,
    c.name AS curso
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
ORDER BY u.name;