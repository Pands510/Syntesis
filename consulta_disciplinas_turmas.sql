SELECT
    d.id AS disciplina_id,
    d.name AS disciplina,
    d.code AS codigo,
    d.semester AS semestre,
    c.name AS curso,
    c."totalSemesters" AS total_semestres,
    p.id AS professor_id,
    u.name AS professor,
    COUNT(s.id) AS alunos_elegiveis
FROM disciplines d
JOIN courses c
    ON c.id = d."courseId"
JOIN professors p
    ON p."disciplineId" = d.id
JOIN users u
    ON u.id = p."userId"
   AND u."isActive" = true
LEFT JOIN students s
    ON s."courseId" = d."courseId"
   AND s.semester = d.semester
   AND s.status = 'ATIVO'
WHERE d."isActive" = true
GROUP BY
    d.id, d.name, d.code, d.semester,
    c.name, c."totalSemesters",
    p.id, u.name
ORDER BY c.name, d.semester, d.name;