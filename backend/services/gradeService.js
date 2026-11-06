//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

// Validar nota de 0 a 10, com até duas casas decimais
function validarNota(score) {
  if (
    score === undefined ||
    score === null ||
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 10 ||
    Math.round(score * 100) !== score * 100
  ) {
    throw criarErro(
      "A nota deve ser um número entre 0 e 10, com até duas casas decimais.",
      400
    );
  }
}

// Verificar acesso do professor à turma
async function verificarAcessoTurma(classId, user) {
  const turma = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      professor: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!turma) {
    throw criarErro("Turma não encontrada.", 404);
  }

  if (
    user.role === "PROFESSOR" &&
    turma.professor.userId !== user.id
  ) {
    throw criarErro(
      "Você não tem permissão para acessar esta turma.",
      403
    );
  }

  return turma;
}

// Buscar avaliação e verificar acesso
async function buscarAvaliacaoComAcesso(assessmentId, user) {
  if (!assessmentId) {
    throw criarErro("Informe a avaliação.", 400);
  }

  const avaliacao = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      schoolClass: {
        select: {
          id: true,
          professor: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  if (!avaliacao) {
    throw criarErro("Avaliação não encontrada.", 404);
  }

  await verificarAcessoTurma(
    avaliacao.classId,
    user
  );

  return avaliacao;
}

// Verificar matrícula ativa e vínculo com a turma
async function verificarMatricula(enrollmentId, classId) {
  if (!enrollmentId) {
    throw criarErro("Informe a matrícula do aluno.", 400);
  }

  const matricula = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      classId: true,
      status: true
    }
  });

  if (!matricula || matricula.classId !== classId) {
    throw criarErro(
      "Matrícula não encontrada nesta turma.",
      404
    );
  }

  if (matricula.status !== "ATIVA") {
    throw criarErro(
      "Não é possível lançar notas para uma matrícula inativa.",
      400
    );
  }

  return matricula;
}

// Lançar nota individual
export async function createGrade(data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem lançar notas.",
      403
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da nota.", 400);
  }

  const { assessmentId, enrollmentId, score } = data;

  validarNota(score);

  const avaliacao = await buscarAvaliacaoComAcesso(
    assessmentId,
    user
  );

  await verificarMatricula(
    enrollmentId,
    avaliacao.classId
  );

  try {
    return await prisma.grade.create({
      data: {
        assessmentId,
        enrollmentId,
        score
      },
      include: {
        assessment: true
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw criarErro(
        "Este aluno já possui uma nota nesta avaliação. Utilize a atualização.",
        409
      );
    }

    throw error;
  }
}

// Lançar ou atualizar várias notas em lote
export async function createGradesBatch(data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem lançar notas.",
      403
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados das notas.", 400);
  }

  const { assessmentId, grades } = data;

  if (!Array.isArray(grades) || grades.length === 0) {
    throw criarErro(
      "Informe pelo menos uma nota para processamento.",
      400
    );
  }

  const avaliacao = await buscarAvaliacaoComAcesso(
    assessmentId,
    user
  );

  const matriculasRecebidas = new Set();

  for (const item of grades) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw criarErro("Existe um registro de nota inválido.", 400);
    }

    if (!item.enrollmentId) {
      throw criarErro("Existe uma nota sem matrícula informada.", 400);
    }

    if (matriculasRecebidas.has(item.enrollmentId)) {
      throw criarErro(
        "A mesma matrícula não pode aparecer mais de uma vez no lote.",
        400
      );
    }

    matriculasRecebidas.add(item.enrollmentId);

    validarNota(item.score);
  }

  const enrollmentIds = [...matriculasRecebidas];

  const matriculas = await prisma.enrollment.findMany({
    where: {
      id: { in: enrollmentIds },
      classId: avaliacao.classId,
      status: "ATIVA"
    },
    select: {
      id: true
    }
  });

  if (matriculas.length !== enrollmentIds.length) {
    throw criarErro(
      "Uma ou mais matrículas não pertencem à turma ou não estão ativas.",
      400
    );
  }

  // Todas as notas são processadas em uma única transação.
  // Se alguma operação falhar, nenhuma alteração será mantida.
  const resultado = await prisma.$transaction(async (transaction) => {
    const notasProcessadas = [];

    for (const item of grades) {
      const nota = await transaction.grade.upsert({
        where: {
          assessmentId_enrollmentId: {
            assessmentId,
            enrollmentId: item.enrollmentId
          }
        },
        create: {
          assessmentId,
          enrollmentId: item.enrollmentId,
          score: item.score
        },
        update: {
          score: item.score
        }
      });

      notasProcessadas.push(nota);
    }

    return notasProcessadas;
  });

  return {
    total: resultado.length,
    notas: resultado
  };
}

// Lançar ou atualizar notas da prova final em lote
export async function createFinalExamGradesBatch(data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem lançar notas da prova final.",
      403
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados das notas finais.", 400);
  }

  const { classId, grades } = data;

  if (!classId) {
    throw criarErro("Informe a turma.", 400);
  }

  if (!Array.isArray(grades) || grades.length === 0) {
    throw criarErro("Informe pelo menos uma nota final.", 400);
  }

  await verificarAcessoTurma(classId, user);

  const matriculasRecebidas = new Set();

  for (const item of grades) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw criarErro("Existe um registro de nota inválido.", 400);
    }

    if (!item.enrollmentId) {
      throw criarErro("Existe uma nota sem matrícula informada.", 400);
    }

    if (matriculasRecebidas.has(item.enrollmentId)) {
      throw criarErro(
        "A mesma matrícula não pode aparecer mais de uma vez no lote.",
        400
      );
    }

    matriculasRecebidas.add(item.enrollmentId);

    validarNota(item.score);
  }

  const enrollmentIds = [...matriculasRecebidas];

  const matriculas = await prisma.enrollment.findMany({
    where: {
      id: { in: enrollmentIds },
      classId,
      status: "ATIVA"
    },
    select: {
      id: true
    }
  });

  if (matriculas.length !== enrollmentIds.length) {
    throw criarErro(
      "Uma ou mais matrículas não pertencem à turma ou não estão ativas.",
      400
    );
  }

  const resultado = await prisma.$transaction(async (transaction) => {
    const notasProcessadas = [];

    for (const item of grades) {
      const nota = await transaction.finalExamGrade.upsert({
        where: {
          enrollmentId: item.enrollmentId
        },
        create: {
          enrollmentId: item.enrollmentId,
          score: item.score
        },
        update: {
          score: item.score
        }
      });

      notasProcessadas.push(nota);
    }

    return notasProcessadas;
  });

  return {
    total: resultado.length,
    notas: resultado
  };
}

// Listar notas e matrículas de uma turma
export async function listGrades(classId, user) {
  if (!classId) {
    throw criarErro("Informe a turma.", 400);
  }

  await verificarAcessoTurma(classId, user);

  const whereMatricula = {
    classId,
    status: "ATIVA"
  };

  // O aluno só visualiza as próprias notas.
  if (user.role === "ALUNO") {
    whereMatricula.student = {
      userId: user.id
    };

    const matricula = await prisma.enrollment.findFirst({
      where: whereMatricula,
      select: { id: true }
    });

    if (!matricula) {
      throw criarErro(
        "Você não possui matrícula ativa nesta turma.",
        403
      );
    }
  }

  // Retorna todas as matrículas ativas, inclusive
  // aquelas que ainda não possuem notas lançadas.
  return prisma.enrollment.findMany({
    where: whereMatricula,
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      grades: {
        where: {
          assessment: {
            classId
          }
        },
        include: {
          assessment: true
        }
      },
      finalExamGrade: true,
    },
    orderBy: {
      enrolledAt: "asc"
    }
  });
}

// Atualizar nota individual
export async function updateGrade(id, data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem atualizar notas.",
      403
    );
  }

  if (!id) {
    throw criarErro("Informe a nota.", 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da atualização.", 400);
  }

  const camposEnviados = Object.keys(data);

  if (
    camposEnviados.length !== 1 ||
    camposEnviados[0] !== "score"
  ) {
    throw criarErro(
      "Somente o valor da nota pode ser alterado.",
      400
    );
  }

  validarNota(data.score);

  const nota = await prisma.grade.findUnique({
    where: { id },
    include: {
      assessment: {
        select: {
          id: true,
          classId: true
        }
      },
      enrollment: {
        select: {
          status: true
        }
      }
    }
  });

  if (!nota) {
    throw criarErro("Nota não encontrada.", 404);
  }

  await verificarAcessoTurma(
    nota.assessment.classId,
    user
  );

  if (nota.enrollment.status !== "ATIVA") {
    throw criarErro(
      "Não é possível atualizar notas de uma matrícula inativa.",
      400
    );
  }

  return prisma.grade.update({
    where: { id },
    data: {
      score: data.score
    },
    include: {
      assessment: true
    }
  });
}


// Consultar boletim completo do aluno autenticado
export async function getStudentReport(user) {
  if (!user || user.role !== "ALUNO") {
    throw criarErro(
      "Somente alunos podem consultar o próprio boletim.",
      403
    );
  }

  const matriculas = await prisma.enrollment.findMany({
    where: {
      status: "ATIVA",
      student: {
        userId: user.id
      }
    },
    include: {
      schoolClass: {
        include: {
          discipline: true
        }
      },
      grades: {
        include: {
          assessment: true
        }
      },
      finalExamGrade: true,
      attendances: {
        where: {
          status: "FALTA"
        }
      }
    },
    orderBy: {
      enrolledAt: "asc"
    }
  });

  return matriculas.map((matricula) => {
    const notasUnidades = {
      U1: null,
      U2: null,
      U3: null
    };

    for (const nota of matricula.grades) {
      const unidade = nota.assessment.unit;

      if (Object.prototype.hasOwnProperty.call(notasUnidades, unidade)) {
        notasUnidades[unidade] = Number(nota.score);
      }
    }

    const notasCompletas = Object.values(notasUnidades)
      .every((nota) => nota !== null);

    const mediaParcial = notasCompletas
      ? Number(
          (
            Object.values(notasUnidades).reduce(
              (total, nota) => total + nota,
              0
            ) / 3
          ).toFixed(2)
        )
      : null;

    const notaFinal = matricula.finalExamGrade
      ? Number(matricula.finalExamGrade.score)
      : null;

    let situacao = "EM_ANDAMENTO";
    let mediaFinal = null;

    if (mediaParcial !== null) {
      if (mediaParcial >= 7) {
        situacao = "APROVADO";
      } else if (mediaParcial >= 3) {
        situacao = "APTO_FINAL";

        if (notaFinal !== null) {
          mediaFinal = Number(
            ((mediaParcial + notaFinal) / 2).toFixed(2)
          );

          situacao = mediaFinal >= 5
            ? "APROVADO_FINAL"
            : "REPROVADO_FINAL";
        }
      } else {
        situacao = "REPROVADO";
      }
    }

    return {
      enrollmentId: matricula.id,
      disciplina: matricula.schoolClass.discipline.name,
      codigo: matricula.schoolClass.discipline.code,
      cargaHoraria: matricula.schoolClass.discipline.workloadHours,
      turma: matricula.schoolClass.name,
      notas: notasUnidades,
      mediaParcial,
      notaFinal,
      mediaFinal,
      faltas: matricula.attendances.length,
      situacao
    };
  });
}
