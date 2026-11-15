INSERT INTO academic_terms (
    id,
    name,
    year,
    "termNumber",
    "startDate",
    "endDate",
    status,
    "createdAt",
    "updatedAt"
)
VALUES (
    'rollback-test-2099',
    'TESTE TEMPORARIO DE ROLLBACK',
    2099,
    1,
    '2099-01-01',
    '2099-06-30',
    'PLANEJADO',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);