SELECT
    u.name AS aluno,
    s.status AS situacao_academica,
    s.semester AS semestre_atual,
    e.status AS situacao_matricula
FROM students s
JOIN users u
    ON u.id = s."userId"
JOIN disciplines d
    ON d."courseId" = s."courseId"
    AND d.semester = s.semester
LEFT JOIN enrollments e
    ON e."studentId" = s.id
    AND e."classId" = '1b2440a2-8066-460a-b786-503c1e0c8382'
WHERE d.id = '24607480-66e3-48c6-be17-88d35521cca0'
ORDER BY u.name;