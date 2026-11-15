SELECT
    s.id AS student_id,
    u.name AS aluno,
    s.semester AS semestre_atual,
    s.status AS situacao,
    c.name AS curso,
    c."totalSemesters" AS total_semestres
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
ORDER BY u.name;