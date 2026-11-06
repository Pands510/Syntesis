//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

const STATUS = {
  PLANEJADO: "PLANEJADO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  ENCERRADO: "ENCERRADO"
};

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function validarDatas(startDate, endDate) {
  const inicio = new Date(startDate);
  const fim = new Date(endDate);

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime())
  ) {
    throw criarErro("Informe datas de início e término válidas.", 400);
  }

  if (fim < inicio) {
    throw criarErro(
      "A data de término não pode ser anterior à data de início.",
      400
    );
  }

  return { inicio, fim };
}

export async function createAcademicTerm(data) {
  const { name, year, termNumber, startDate, endDate } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw criarErro("Informe o nome do período letivo.", 400);
  }

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    !Number.isInteger(termNumber) ||
    termNumber < 1
  ) {
    throw criarErro("Ano ou número do período inválido.", 400);
  }

  const { inicio, fim } = validarDatas(startDate, endDate);

  const existing = await prisma.academicTerm.findUnique({
    where: {
      year_termNumber: { year, termNumber }
    }
  });

  if (existing) {
    throw criarErro(
      "Já existe um período letivo cadastrado para esse ano e número.",
      409
    );
  }

  return prisma.academicTerm.create({
    data: {
      name: name.trim(),
      year,
      termNumber,
      startDate: inicio,
      endDate: fim
    }
  });
}

export async function listAcademicTerms() {
  return prisma.academicTerm.findMany({
    orderBy: [
      { year: "desc" },
      { termNumber: "desc" }
    ],
    include: {
      _count: {
        select: { schoolClasses: true }
      }
    }
  });
}

export async function getAcademicTerm(id) {
  const term = await prisma.academicTerm.findUnique({
    where: { id },
    include: {
      _count: {
        select: { schoolClasses: true }
      }
    }
  });

  if (!term) {
    throw criarErro("Período letivo não encontrado.", 404);
  }

  return term;
}

export async function updateAcademicTerm(id, data) {
  const term = await getAcademicTerm(id);

  if (term.status !== STATUS.PLANEJADO) {
    throw criarErro(
      "Somente períodos letivos planejados podem ser editados.",
      409
    );
  }

  const name = data.name ?? term.name;
  const year = data.year ?? term.year;
  const termNumber = data.termNumber ?? term.termNumber;
  const startDate = data.startDate ?? term.startDate;
  const endDate = data.endDate ?? term.endDate;

  if (typeof name !== "string" || !name.trim()) {
    throw criarErro("Informe um nome válido.", 400);
  }

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    !Number.isInteger(termNumber) ||
    termNumber < 1
  ) {
    throw criarErro("Ano ou número do período inválido.", 400);
  }

  const { inicio, fim } = validarDatas(startDate, endDate);

  const duplicate = await prisma.academicTerm.findFirst({
    where: {
      id: { not: id },
      year,
      termNumber
    }
  });

  if (duplicate) {
    throw criarErro(
      "Já existe outro período cadastrado para esse ano e número.",
      409
    );
  }

  return prisma.academicTerm.update({
    where: { id },
    data: {
      name: name.trim(),
      year,
      termNumber,
      startDate: inicio,
      endDate: fim
    }
  });
}

export async function startAcademicTerm(id) {
  return prisma.$transaction(async (tx) => {
    // Serializa as operações de início de período.
    await tx.$executeRaw`
      LOCK TABLE academic_terms IN EXCLUSIVE MODE
    `;

    const term = await tx.academicTerm.findUnique({
      where: { id }
    });

    if (!term) {
      throw criarErro("Período letivo não encontrado.", 404);
    }

    if (term.status !== STATUS.PLANEJADO) {
      throw criarErro(
        "Somente períodos planejados podem ser iniciados.",
        409
      );
    }

    const current = await tx.academicTerm.findFirst({
      where: { status: STATUS.EM_ANDAMENTO }
    });

    if (current) {
      throw criarErro(
        "Já existe outro período letivo em andamento.",
        409
      );
    }

    return tx.academicTerm.update({
      where: { id },
      data: { status: STATUS.EM_ANDAMENTO }
    });
  });
}

export async function closeAcademicTerm(id) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      LOCK TABLE academic_terms IN EXCLUSIVE MODE
    `;

    const term = await tx.academicTerm.findUnique({
      where: { id }
    });

    if (!term) {
      throw criarErro("Período letivo não encontrado.", 404);
    }

    if (term.status !== STATUS.EM_ANDAMENTO) {
      throw criarErro(
        "Somente períodos em andamento podem ser encerrados.",
        409
      );
    }

    return tx.academicTerm.update({
      where: { id },
      data: { status: STATUS.ENCERRADO }
    });
  });
}

export async function deleteAcademicTerm(id) {
  const term = await getAcademicTerm(id);

  if (term.status !== STATUS.PLANEJADO) {
    throw criarErro(
      "Somente períodos planejados podem ser excluídos.",
      409
    );
  }

  if (term._count.schoolClasses > 0) {
    throw criarErro(
      "Não é possível excluir um período vinculado a turmas.",
      409
    );
  }

  return prisma.academicTerm.delete({
    where: { id }
  });
}
