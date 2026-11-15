SELECT
    d.id AS disciplina_id,
    d.name AS disciplina,
    p.id AS professor_id,
    u.name AS professor,
    s.id AS aluno_id,
    su.name AS aluno,
    s.semester,
    s.status AS situacao_academica,
    sc.id AS turma_existente,
    sc.name AS nome_turma
FROM disciplines d
JOIN professors p ON p."disciplineId" = d.id
JOIN users u ON u.id = p."userId"
JOIN students s
    ON s."courseId" = d."courseId"
   AND s.semester = d.semester
   AND s.status = 'ATIVO'
JOIN users su ON su.id = s."userId"
LEFT JOIN school_classes sc
    ON sc."disciplineId" = d.id
   AND sc."academicTermId" = 'f2b36394-2ab2-4f11-9d19-2a4fcbbae1c0'
WHERE d.id = '6d8f75d5-01af-4d04-943f-eb48d7b4e878';