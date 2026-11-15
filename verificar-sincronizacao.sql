SELECT
    u.name AS aluno,
    s."registrationNumber" AS matricula,
    s.status AS situacao_academica,
    c.name AS curso,
    s.semester AS semestre,
    sc.name AS turma,
    d.name AS disciplina,
    e.status AS situacao_matricula
FROM students s
JOIN users u ON u.id = s."userId"
LEFT JOIN courses c ON c.id = s."courseId"
LEFT JOIN enrollments e ON e."studentId" = s.id
LEFT JOIN school_classes sc ON sc.id = e."classId"
LEFT JOIN disciplines d ON d.id = sc."disciplineId"
WHERE s."registrationNumber" = 'SYNC-TESTE-001';