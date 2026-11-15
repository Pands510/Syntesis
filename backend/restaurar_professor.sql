BEGIN;

UPDATE professors
SET "disciplineId" = '1a98535e-2b55-4550-bcf5-bae6a37fa71f'
WHERE id = 'd6dd7600-f904-4b76-acc4-90525e86d073'
  AND "disciplineId" = '24607480-66e3-48c6-be17-88d35521cca0';

COMMIT;

SELECT
    p.id AS professor_id,
    u.name AS professor,
    d.name AS disciplina_atual
FROM professors p
JOIN users u ON u.id = p."userId"
JOIN disciplines d ON d.id = p."disciplineId"
WHERE p.id = 'd6dd7600-f904-4b76-acc4-90525e86d073';