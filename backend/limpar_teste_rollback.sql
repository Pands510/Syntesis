BEGIN;

DROP TRIGGER IF EXISTS trigger_teste_rollback_progressao
ON academic_history;

DROP FUNCTION IF EXISTS teste_forcar_erro_progressao();

UPDATE courses
SET "totalSemesters" = 2
WHERE id = (
    SELECT "courseId"
    FROM students
    WHERE id = 'e0e3f772-f313-44c3-8a69-dbe50d5d9c4f'
);

UPDATE academic_terms
SET status = 'PLANEJADO',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE id = 'rollback-test-2099'
  AND status = 'EM_ANDAMENTO';

COMMIT;