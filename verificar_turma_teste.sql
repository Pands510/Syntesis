-- Conferir a matrícula automática.
SELECT
    e.id AS matricula_id,
    u.name AS aluno,
    e.status AS situacao_matricula,
    e."enrolledAt"
FROM enrollments e
JOIN students s ON s.id = e."studentId"
JOIN users u ON u.id = s."userId"
WHERE e."classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3';

-- Conferir as três avaliações.
SELECT
    id,
    unit,
    number,
    title
FROM assessments
WHERE "classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3'
ORDER BY unit;

-- Conferir a quantidade total de registros.
SELECT
    (SELECT COUNT(*) FROM enrollments
     WHERE "classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3')
     AS total_matriculas,
    (SELECT COUNT(*) FROM assessments
     WHERE "classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3')
     AS total_avaliacoes;