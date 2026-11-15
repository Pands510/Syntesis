UPDATE academic_terms
SET status = 'EM_ANDAMENTO'
WHERE id = 'f2b36394-2ab2-4f11-9d19-2a4fcbbae1c0'
  AND status = 'PLANEJADO'
RETURNING id, year, "termNumber", status;