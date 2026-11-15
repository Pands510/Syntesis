SELECT
    s.id AS student_id,
    s."courseId" AS course_id,
    c.name AS curso,
    d.id AS disciplina_id,
    d.name AS disciplina,
    d.semester AS semestre,
    p.id AS professor_id,
    u.name AS professor
FROM students s
JOIN courses c ON c.id = s."courseId"
LEFT JOIN disciplines d
    ON d."courseId" = c.id
   AND d."isActive" = true
LEFT JOIN professors p
    ON p."disciplineId" = d.id
LEFT JOIN users u
    ON u.id = p."userId"
   AND u."isActive" = true
WHERE s.id = '285b56dc-aa72-435f-9a1c-a45ff29f27fc'
ORDER BY d.semester, d.name;