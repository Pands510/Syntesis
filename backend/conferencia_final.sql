SELECT
    s.semester AS semestre_aluno,
    c."totalSemesters" AS total_semestres_curso,
    (
        SELECT COUNT(*)
        FROM academic_terms
        WHERE id = 'rollback-test-2099'
    ) AS periodo_temporario,
    (
        SELECT COUNT(*)
        FROM pg_trigger
        WHERE tgname = 'trigger_teste_rollback_progressao'
          AND NOT tgisinternal
    ) AS gatilho_temporario
FROM students s
JOIN courses c ON c.id = s."courseId"
WHERE s.id = 'e0e3f772-f313-44c3-8a69-dbe50d5d9c4f';