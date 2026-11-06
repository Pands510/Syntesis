import prisma from "./backend/database/prisma.js";

try {
    const resultados = {
        usuarios: await prisma.user.count(),
        alunos: await prisma.student.count(),
        professores: await prisma.professor.count(),
        cursos: await prisma.course.count(),
        disciplinas: await prisma.discipline.count(),
        turmas: await prisma.schoolClass.count()
    };

    console.table(resultados);
} catch (erro) {
    console.error("Erro ao consultar cadastros:", erro);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}

