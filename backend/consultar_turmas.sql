SELECT
    sc.name AS turma,
    sc.code AS codigo,
    d.name AS disciplina,
    d.semester AS semestre,
    c.name AS curso,
    at.name AS periodo,
    at.status AS situacao_periodo
FROM school_classes sc
JOIN disciplines d ON d.id = sc."disciplineId"
JOIN courses c ON c.id = d."courseId"
JOIN academic_terms at ON at.id = sc."academicTermId"
WHERE at.status = 'EM_ANDAMENTO'
ORDER BY c.name, d.semester, d.name;