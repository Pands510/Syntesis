SELECT
    p.id AS professor_id,
    u.name AS professor,
    u.email,
    d.id AS disciplina_atual_id,
    d.name AS disciplina_atual,
    COUNT(sc.id) AS total_turmas
FROM professors p
JOIN users u
    ON u.id = p."userId"
LEFT JOIN disciplines d
    ON d.id = p."disciplineId"
LEFT JOIN school_classes sc
    ON sc."professorId" = p.id
WHERE u."isActive" = true
GROUP BY
    p.id,
    u.name,
    u.email,
    d.id,
    d.name
ORDER BY
    COUNT(sc.id),
    u.name;