SELECT
    "disciplineId",
    "academicTermId",
    COUNT(*) AS total_turmas,
    STRING_AGG(name, ', ') AS turmas
FROM school_classes
WHERE "academicTermId" IS NOT NULL
GROUP BY "disciplineId", "academicTermId"
HAVING COUNT(*) > 1;