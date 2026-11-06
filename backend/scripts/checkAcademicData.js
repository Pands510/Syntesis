import prisma from "../database/prisma.js";

async function main() {
  //quando testei na minha máquina com 10 alunos de teste, funcionou
  const alunos = await prisma.student.findMany({
    select: {
      id: true,
      registrationNumber: true,
      course: true,
      courseId: true,
      semester: true,
      academicCourse: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  //divisor bonitin pro terminal(tomei trauma de powershell, acredite)
  console.log("\n=== ALUNOS E SEUS CURSOS ===");
  console.log(JSON.stringify(alunos, null, 2));

  const disciplinas = await prisma.discipline.findMany({
    include: {
      course: {
        select: {
          name: true,
          code: true
        }
      }
    }
  });
  
  console.log("\n=== DISCIPLINAS CADASTRADAS ===");
  console.log(JSON.stringify(disciplinas, null, 2));
}

main()
  .catch((error) => {
    console.error("Erro ao consultar o banco:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });