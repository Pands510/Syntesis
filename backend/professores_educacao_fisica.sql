SELECT
    d.id AS disciplina_id,
    d.name AS disciplina,
    d.semester,
    p.id AS professor_id,
    u.name AS professor
FROM disciplines d
LEFT JOIN professors p
    ON p."disciplineId" = d.id
LEFT JOIN users u
    ON u.id = p."userId"
WHERE d."courseId" = 'ba511fec-bfab-4f13-88ae-cd0c22daf24f'
  AND d."isActive" = true
ORDER BY d.semester, d.name;