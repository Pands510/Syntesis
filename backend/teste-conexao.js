import prisma from "./database/prisma.js";

try {
    const resultado = await prisma.$queryRaw`
        SELECT
            current_database() AS banco,
            NOW() AS horario
    `;

    console.log("Conexão com PostgreSQL:", resultado);
} catch (erro) {
    console.error("Falha na conexão:", erro);
    process.exitCode = 1;
} finally {
    await prisma.$disconnect();
}
