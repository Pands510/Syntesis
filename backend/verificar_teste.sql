SELECT
    current_database() AS banco,
    (SELECT COUNT(*) FROM students) AS alunos,
    (SELECT COUNT(*) FROM school_classes) AS turmas,
    (SELECT COUNT(*) FROM enrollments) AS matriculas,
    (SELECT COUNT(*) FROM academic_terms
     WHERE status = 'EM_ANDAMENTO') AS periodos_em_andamento;