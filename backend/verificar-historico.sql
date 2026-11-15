SELECT
    "studentId",
    "academicTermId",
    "type",
    COUNT(*) AS quantidade
FROM academic_history
WHERE "academicTermId" IS NOT NULL
GROUP BY
    "studentId",
    "academicTermId",
    "type"
HAVING COUNT(*) > 1;
