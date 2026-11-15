DO $$
DECLARE
    curso_id TEXT;
BEGIN
    IF current_database() <> 'syntesis_db_test' THEN
        RAISE EXCEPTION 'Operação bloqueada: banco incorreto.';
    END IF;

    SELECT s."courseId"
    INTO curso_id
    FROM students s
    WHERE s.id = 'e0e3f772-f313-44c3-8a69-dbe50d5d9c4f'
      AND s.status = 'ATIVO'
      AND s.semester = 2;

    IF curso_id IS NULL THEN
        RAISE EXCEPTION 'Aluno não encontrado ou não está nas condições esperadas.';
    END IF;

    UPDATE courses
    SET "totalSemesters" = 3,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = curso_id
      AND "totalSemesters" = 2;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curso não encontrado ou duração diferente de 2 semestres.';
    END IF;
END $$;

SELECT
    u.name AS aluno,
    s.semester AS semestre_atual,
    c.name AS curso,
    c."totalSemesters" AS total_semestres
FROM students s
JOIN users u ON u.id = s."userId"
JOIN courses c ON c.id = s."courseId"
WHERE s.id = 'e0e3f772-f313-44c3-8a69-dbe50d5d9c4f';