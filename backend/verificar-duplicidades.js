import prisma from "./database/prisma.js";

async function verificarDuplicidades() {
  try {
    const resultado = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total_duplicidades
      FROM (
        SELECT
          "studentId",
          "academicTermId",
          "type"
        FROM academic_history
        WHERE "academicTermId" IS NOT NULL
        GROUP BY
          "studentId",
          "academicTermId",
          "type"
        HAVING COUNT(*) > 1
      ) AS duplicidades
    `;

    console.log("\nResultado da verificação:");
    console.table(resultado);

  } catch (error) {
    console.error("Erro na consulta:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDuplicidades();
