import prisma from "./database/prisma.js";

try {
    const professores = await prisma.professor.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    isActive: true
                }
            },
            discipline: {
                select: {
                    name: true,
                    code: true
                }
            }
        }
    });

    const disciplinas = await prisma.discipline.findMany({
        include: {
            course: {
                select: {
                    name: true,
                    code: true
                }
            },
            professors: {
                include: {
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: [
            { courseId: "asc" },
            { semester: "asc" },
            { name: "asc" }
        ]
    });

    console.log("\n========== PROFESSORES ==========");
    console.dir(professores, { depth: null });

    console.log("\n========== DISCIPLINAS ==========");
    console.dir(disciplinas, { depth: null });

} catch (erro) {
    console.error("Erro na consulta:", erro);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
