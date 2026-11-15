import prisma from "./database/prisma.js";

try {
  const resultado = await prisma.$queryRaw`
    SELECT
      current_database() AS banco,
      current_schema() AS esquema,
      (
        SELECT COUNT(*)::int
        FROM academic_terms
      ) AS total_periodos,
      (
        SELECT COUNT(*)::int
        FROM academic_terms
        WHERE id = 'rollback-test-2099'
      ) AS periodo_teste
  `;

  console.log("Resultado da conex?o do Prisma:");
  console.log(resultado);
} catch (error) {
  console.error("Falha no diagn?stico:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
