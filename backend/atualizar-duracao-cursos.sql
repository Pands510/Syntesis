BEGIN;

UPDATE courses c
SET "totalSemesters" = (
    SELECT COALESCE(MAX(d.semester), 1)
    FROM disciplines d
    WHERE d."courseId" = c.id
);

COMMIT;

SELECT
    name AS curso,
    "totalSemesters" AS duracao_em_semestres
FROM courses
ORDER BY name;