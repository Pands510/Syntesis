//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

export async function createDiscipline(data) {
  const {
    name,
    code,
    workloadHours,
    courseId,
    semester
  } = data;

  // Verificar se o curso existe
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error("Curso não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar se já existe uma disciplina com o mesmo código ou nome no curso
  const existingDiscipline = await prisma.discipline.findFirst({
    where: {
      OR: [
        { code },
        {
          name,
          courseId
        }
      ]
    }
  });

  if (existingDiscipline) {
    const error = new Error(
      "Já existe uma disciplina com esse código ou nome neste curso."
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.discipline.create({
    data: {
      name,
      code,
      workloadHours,
      courseId,
      semester
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
}

// Listar todas as disciplinas
// Listar disciplinas com filtros opcionais
export async function listDisciplines(filters = {}) {
  const { courseId, semester } = filters;

  return prisma.discipline.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(semester ? { semester } : {})
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: [
      { course: { name: "asc" } },
      { semester: "asc" },
      { name: "asc" }
    ]
  });
}

// Editar disciplina
export async function updateDiscipline(id, data) {
  const {
    name,
    code,
    workloadHours,
    courseId,
    semester
  } = data;

  // Verificar se a disciplina existe
  const discipline = await prisma.discipline.findUnique({
    where: { id }
  });

  if (!discipline) {
    const error = new Error("Disciplina não encontrada.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar se o curso existe
  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error("Curso não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar duplicidade de código ou nome no curso
  const existingDiscipline = await prisma.discipline.findFirst({
    where: {
      id: { not: id },
      OR: [
        { code },
        { name, courseId }
      ]
    }
  });

  if (existingDiscipline) {
    const error = new Error(
      "Já existe uma disciplina com esse código ou nome neste curso."
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.discipline.update({
    where: { id },
    data: {
      name,
      code,
      workloadHours,
      courseId,
      semester
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });
}

// Excluir disciplina
export async function deleteDiscipline(id) {
  const discipline = await prisma.discipline.findUnique({
    where: { id }
  });

  if (!discipline) {
    const error = new Error("Disciplina não encontrada.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar se existem turmas vinculadas
  const totalTurmas = await prisma.schoolClass.count({
    where: { disciplineId: id }
  });

  if (totalTurmas > 0) {
    const error = new Error(
      "Não é possível excluir esta disciplina porque existem turmas vinculadas a ela."
    );
    error.statusCode = 409;
    throw error;
  }

  await prisma.discipline.delete({
    where: { id }
  });

  return true;
}