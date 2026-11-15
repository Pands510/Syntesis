SELECT
    d.id AS disciplina_id,
    d.name AS disciplina,
    d.semester,
    c.name AS curso,
    at.id AS periodo_id,
    at.status AS situacao_periodo,
    sc.id AS turma_existente
FROM disciplines d
JOIN courses c ON c.id = d."courseId"
CROSS JOIN academic_terms at
LEFT JOIN school_classes sc
    ON sc."disciplineId" = d.id
    AND sc."academicTermId" = at.id
WHERE d.id = '24607480-66e3-48c6-be17-88d35521cca0'
  AND at.id = 'f2b36394-2ab2-4f11-9d19-2a4fcbbae1c0';