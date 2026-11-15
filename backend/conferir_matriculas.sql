SELECT
    u.name AS aluno,
    s.status AS situacao_aluno,
    s.semester AS semestre_aluno,
    d.name AS disciplina,
    e.status AS situacao_matricula,
    sc.code AS codigo_turma
FROM enrollments e
JOIN students s ON s.id = e."studentId"
JOIN users u ON u.id = s."userId"
JOIN school_classes sc ON sc.id = e."classId"
JOIN disciplines d ON d.id = sc."disciplineId"
ORDER BY u.name;