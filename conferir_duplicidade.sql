SELECT
    COUNT(*) AS total_turmas
FROM school_classes
WHERE "disciplineId" = '6d8f75d5-01af-4d04-943f-eb48d7b4e878'
  AND "academicTermId" = 'f2b36394-2ab2-4f11-9d19-2a4fcbbae1c0';

SELECT
    COUNT(*) AS total_matriculas
FROM enrollments
WHERE "classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3';

SELECT
    COUNT(*) AS total_avaliacoes
FROM assessments
WHERE "classId" = '5c0eed94-5bbd-4ee5-b28d-6638269c6cc3';