SELECT
    d.id AS disciplina_id,
    d.name AS disciplina,
    d.semester AS semestre,
    c.name AS curso,
    p.id AS professor_id,
    u.name AS professor,
    CASE
        WHEN sc.id IS NOT NULL THEN 'TURMA JA EXISTE'
        ELSE 'DISPONIVEL'
    END AS disponibilidade
FROM disciplines d
JOIN courses c ON c.id = d."courseId"
JOIN professors p ON p."disciplineId" = d.id
JOIN users u ON u.id = p."userId"
LEFT JOIN school_classes sc
    ON sc."disciplineId" = d.id
   AND sc."academicTermId" = 'f2b36394-2ab2-4f11-9d19-2a4fcbbae1c0'
WHERE d."isActive" = true
  AND u."isActive" = true
  AND (
      (c.name = 'Biologia' AND d.semester = 1)
      OR
      (c.name = 'Educação Física' AND d.semester = 2)
  )
ORDER BY c.name, d.name;