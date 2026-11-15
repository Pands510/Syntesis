SELECT
    u.name AS aluno,
    s.id AS student_id,
    s.semester AS semestre_atual,
    s.status AS situacao_academica,
    c.name AS curso,
    c."totalSemesters" AS total_semestres
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
ORDER BY s.status, u.name;