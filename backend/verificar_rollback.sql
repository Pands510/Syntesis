SELECT
    u.name AS aluno,
    s.semester AS semestre_atual,
    s.status AS situacao,
    c."totalSemesters" AS total_semestres
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
WHERE s.id = 'e0e3f772-f313-44c3-8a69-dbe50d5d9c4f';

SELECT
    COUNT(*)::int AS historicos_progressao
FROM academic_history
WHERE "academicTermId" = 'rollback-test-2099'
  AND type = 'PROGRESSAO';

SELECT
    id,
    status
FROM academic_terms
WHERE id = 'rollback-test-2099';