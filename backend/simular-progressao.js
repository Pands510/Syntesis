
import prisma from "./database/prisma.js";

const academicTermId = "9ac87886-8bdd-4fef-bc7c-1505a7d22256";

async function simularProgressao() {
  const term = await prisma.academicTerm.findUnique({
    where: { id: academicTermId }
  });

  if (!term) {
    throw new Error("Período letivo não encontrado.");
  }

  if (term.status !== "EM_ANDAMENTO") {
    throw new Error(
      `O período não está em andamento. Status atual: ${term.status}`
    );
  }

  const students = await prisma.student.findMany({
    select: {
      id: true,
      registrationNumber: true,
      semester: true,
      status: true,
      courseId: true,
      user: {
        select: { name: true }
      },
      academicCourse: {
        select: {
          name: true,
          totalSemesters: true
        }
      }
    },
    orderBy: {
      user: { name: "asc" }
    }
  });

  const relatorio = {
    periodo: term.name,
    status: term.status,
    totalAlunos: students.length,
    totalElegiveis: 0,
    progressõesPrevistas: [],
    ultimoSemestre: [],
    chegaramAoUltimoSemestre: [],
    trancados: [],
    concluidos: [],
    dadosInconsistentes: [],
    progressõesJaRegistradas: []
  };

  for (const student of students) {
    const aluno = {
      studentId: student.id,
      nome: student.user.name,
      matricula: student.registrationNumber,
      curso: student.academicCourse?.name ?? null,
      semestreAtual: student.semester
    };

    if (student.status === "TRANCADO") {
      relatorio.trancados.push(aluno);
      continue;
    }

    if (student.status === "CONCLUIDO") {
      relatorio.concluidos.push(aluno);
      continue;
    }

    if (student.status !== "ATIVO") {
      relatorio.dadosInconsistentes.push({
        ...aluno,
        motivo: "Situação acadêmica inválida."
      });
      continue;
    }

    if (!student.courseId || !student.academicCourse) {
      relatorio.dadosInconsistentes.push({
        ...aluno,
        motivo: "Aluno sem curso vinculado."
      });
      continue;
    }

    const semestre = student.semester;
    const totalSemestres =
      student.academicCourse.totalSemesters;

    if (
      !Number.isInteger(semestre) ||
      semestre < 1 ||
      !Number.isInteger(totalSemestres) ||
      totalSemestres < 1 ||
      semestre > totalSemestres
    ) {
      relatorio.dadosInconsistentes.push({
        ...aluno,
        motivo: "Semestre curricular inválido para o curso."
      });
      continue;
    }

    if (semestre === totalSemestres) {
      relatorio.ultimoSemestre.push(aluno);
      continue;
    }

    const progressaoExistente =
      await prisma.academicHistory.findFirst({
        where: {
          studentId: student.id,
          academicTermId: term.id,
          type: "PROGRESSAO"
        }
      });

    if (progressaoExistente) {
      relatorio.progressõesJaRegistradas.push(aluno);
      continue;
    }

    relatorio.totalElegiveis++;

    const novoSemestre = semestre + 1;

    relatorio.progressõesPrevistas.push({
      ...aluno,
      semestreAnterior: semestre,
      novoSemestre
    });

    if (novoSemestre === totalSemestres) {
      relatorio.chegaramAoUltimoSemestre.push({
        ...aluno,
        semestreAnterior: semestre,
        novoSemestre
      });
    }
  }

  console.log(
    "\n========== SIMULAÇÃO DE PROGRESSÃO ==========\n"
  );

  console.log(JSON.stringify(relatorio, null, 2));

  console.log(
    "\n========== FIM DA SIMULAÇÃO ==========\n"
  );

  console.log(
    "Nenhum aluno foi atualizado e nenhum histórico foi criado."
  );
}

simularProgressao()
  .catch((error) => {
    console.error("Erro na simulação:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
