import "dotenv/config";
import prisma from "./database/prisma.js";

try {
  const alunos = await prisma.student.findMany({
    select: {
      id: true,
      registrationNumber: true,
      semester: true,
      status: true,
      academicCourse: {
        select: {
          id: true,
          name: true,
          code: true,
          totalSemesters: true,
          isActive: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      user: {
        name: "asc"
      }
    }
  });

  console.log("Consulta realizada com sucesso!");
  console.log("Quantidade:", alunos.length);
  console.dir(alunos, { depth: null });

} catch (error) {
  console.error("ERRO ORIGINAL DO PRISMA:");
  console.error(error);
} finally {
  await prisma.$disconnect();
}
