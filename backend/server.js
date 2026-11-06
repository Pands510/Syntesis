//eu quero acreditar que tá tudo certo, fiz de um jeito no início e depois só fui segurando na gambiarra
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./database/prisma.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import disciplineRoutes from "./routes/disciplineRoutes.js";
import schoolClassRoutes from "./routes/schoolClassRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import academicTermRoutes from "./routes/academicTermRoutes.js";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET não configurado ou possui menos de 32 caracteres."
  );
}

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(origin => origin.trim())
  : [];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json());

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/disciplinas", disciplineRoutes);
app.use("/api/school-classes", schoolClassRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/academic-terms", academicTermRoutes);

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Sistema Acadêmico funcionando!"
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    sistema: "Sistema Acadêmico"
  });
});

app.use(errorMiddleware);

let server;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Conexão com PostgreSQL estabelecida.");

    server = app.listen(PORT, () => {
      console.log(`Servidor executando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "Não foi possível conectar ao PostgreSQL:",
      error.message
    );

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error(
        "Erro ao encerrar o Prisma:",
        disconnectError.message
      );
    }

    process.exit(1);
  }
}

startServer();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`\n${signal} recebido. Encerrando servidor...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    await prisma.$disconnect();

    console.log("Conexão com o banco encerrada.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao encerrar aplicação:", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));