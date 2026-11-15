SELECT
    u.name AS aluno,
    sc.name AS turma,
    d.name AS disciplina,
    e.status AS situacao_matricula,
    at.name AS periodo_letivo
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN enrollments e ON e."studentId" = s.id
LEFT JOIN school_classes sc ON sc.id = e."classId"
LEFT JOIN disciplines d ON d.id = sc."disciplineId"
LEFT JOIN academic_terms at ON at.id = sc."academicTermId"
WHERE s."registrationNumber" = '0006';