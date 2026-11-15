SELECT
    c.id,
    c.name AS curso,
    c."totalSemesters" AS duracao_atual,
    COALESCE(MAX(d.semester), 1) AS maior_semestre_cadastrado
FROM courses c
LEFT JOIN disciplines d ON d."courseId" = c.id
GROUP BY c.id, c.name, c."totalSemesters"
ORDER BY c.name;