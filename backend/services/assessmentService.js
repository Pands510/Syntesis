//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

const UNIDADES_VALIDAS = ["U1", "U2", "U3"];

export async function garantirAvaliacoesDaTurma(classId, user = null) {
  if (user) {
    await verificarAcessoTurma(classId, user);
  }

  const avaliacoes = UNIDADES_VALIDAS.map((unit) => ({
    classId,
    unit,
    number: "AVALIACAO1",
    title: `Avaliação ${unit}`
  }));

  await prisma.$transaction(
    avaliacoes.map((avaliacao) =>
      prisma.assessment.upsert({
        where: {
          classId_unit_number: {
            classId: avaliacao.classId,
            unit: avaliacao.unit,
            number: avaliacao.number
          }
        },
        update: {},
        create: avaliacao
      })
    )
  );
}


function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

// Verificar se o usuário possui acesso à turma
async function verificarAcessoTurma(classId, user) {
  const turma = await prisma.schoolClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      professor: {
        select: {
          userId: true
        }
      },
      enrollments: {
        where: {
          status: "ATIVA",
          student: {
            userId: user.id
          }
        },
        select: {
          id: true
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

  if (
    user.role === "ALUNO" &&
    turma.enrollments.length === 0
  ) {
    throw criarErro(
      "Você não possui matrícula ativa nesta turma.",
      403
    );
  }

  return turma;
}

// Cadastrar avaliação
// Cadastrar avaliação
export async function createAssessment(data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem cadastrar avaliações.",
      403
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da avaliação.", 400);
  }

  const {
    classId,
    unit,
    number,
    title
  } = data;

  if (!classId || !unit || !number || title === undefined || title === null || title === "") {
    throw criarErro(
      "Informe a turma, unidade, número e título da avaliação.",
      400
    );
  }

  if (typeof title !== "string") {
    throw criarErro("O título deve ser um texto.", 400);
  }

  if (!title.trim()) {
    throw criarErro("O título da avaliação não pode ficar vazio.", 400);
  }

  if (title.trim().length > 100) {
    throw criarErro(
      "O título deve possuir no máximo 100 caracteres.",
      400
    );
  }

  if (!UNIDADES_VALIDAS.includes(unit)) {
    throw criarErro("Unidade inválida.", 400);
  }

  if (number !== "AVALIACAO1") {
    throw criarErro(
      "Cada unidade deve possuir uma única prova.",
      400
    );
  }

  await verificarAcessoTurma(classId, user);

  try {
    return await prisma.assessment.create({
      data: {
        classId,
        unit,
        number,
        title: title.trim()
      }
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw criarErro(
        "Já existe uma avaliação com essa posição nesta unidade.",
        409
      );
    }

    throw error;
  }
}
// Listar avaliações de uma turma
export async function listAssessments(classId, user) {
  if (!classId) {
    throw criarErro("Informe a turma.", 400);
  }

  await verificarAcessoTurma(classId, user);

  return prisma.assessment.findMany({
    where: { classId },
    include: {
      _count: {
        select: {
          grades: true
        }
      }
    },
    orderBy: [
      { unit: "asc" },
      { number: "asc" }
    ]
  });
}


// Editar avaliação
export async function updateAssessment(id, data, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem editar avaliações.",
      403
    );
  }

  if (!id) {
    throw criarErro("Informe a avaliação.", 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da avaliação.", 400);
  }

  // Somente o título pode ser alterado
  const camposPermitidos = ["title"];

  const camposEnviados = Object.keys(data);

  if (
    camposEnviados.some(
      campo => !camposPermitidos.includes(campo)
    )
  ) {
    throw criarErro(
      "Somente o título da avaliação pode ser alterado.",
      400
    );
  }

  const { title } = data;

  if (typeof title !== "string" || !title.trim()) {
    throw criarErro(
      "Informe um título válido para a avaliação.",
      400
    );
  }

  if (title.trim().length > 100) {
    throw criarErro(
      "O título deve possuir no máximo 100 caracteres.",
      400
    );
  }

  const avaliacao = await prisma.assessment.findUnique({
    where: { id },
    select: {
      id: true,
      classId: true
    }
  });

  if (!avaliacao) {
    throw criarErro("Avaliação não encontrada.", 404);
  }

  await verificarAcessoTurma(avaliacao.classId, user);

  return prisma.assessment.update({
    where: { id },
    data: {
      title: title.trim()
    }
  });
}

// Excluir avaliação
export async function deleteAssessment(id, user) {
  if (!user || user.role !== "PROFESSOR") {
    throw criarErro(
      "Somente professores podem excluir avaliações.",
      403
    );
  }

  if (!id) {
    throw criarErro("Informe a avaliação.", 400);
  }

  const avaliacao = await prisma.assessment.findUnique({
    where: { id },
    select: {
      id: true,
      classId: true
    }
  });

  if (!avaliacao) {
    throw criarErro("Avaliação não encontrada.", 404);
  }

  await verificarAcessoTurma(avaliacao.classId, user);

  // Só permite excluir se não houver notas vinculadas.
  // O filtro também protege contra a inclusão de notas
  // entre a verificação e a exclusão.
  const resultado = await prisma.assessment.deleteMany({
    where: {
      id,
      grades: {
        none: {}
      }
    }
  });

  if (resultado.count === 0) {
    throw criarErro(
      "Não é possível excluir uma avaliação que possui notas vinculadas.",
      409
    );
  }

  return true;
}
