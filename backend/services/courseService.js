//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

export async function createCourse(data) {
  const { name, code, description, mainShift } = data;

  const existingCourse = await prisma.course.findFirst({
    where: {
      OR: [
        { name },
        ...(code ? [{ code }] : [])
      ]
    }
  });

  if (existingCourse) {
    const error = new Error(
      "Já existe um curso com esse nome ou código."
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.course.create({
    data: {
      name,
      code: code || null,
      description: description || null,
      mainShift: mainShift || null
    }
  });
}

export async function linkStudentToCourse(studentId, courseId) {
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    const error = new Error("Aluno não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    const error = new Error("Curso não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return prisma.student.update({
    where: { id: studentId },
    data: {
      courseId,
      course: course.name
    },
    select: {
      id: true,
      registrationNumber: true,
      course: true,
      courseId: true,
      semester: true
    }
  });
}


export async function listCourses() {
  return prisma.course.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      mainShift: true,
      createdAt: true
    }
  });
}

// Atualizar curso
export async function updateCourse(id, data) {
  const { name, code, description, mainShift } = data;

  // Verificar se o curso existe
  const course = await prisma.course.findUnique({
    where: { id }
  });

  if (!course) {
    const error = new Error("Curso não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar duplicidade de nome ou código
  const existingCourse = await prisma.course.findFirst({
    where: {
      id: { not: id },
      OR: [
        { name },
        ...(code ? [{ code }] : [])
      ]
    }
  });

  if (existingCourse) {
    const error = new Error(
      "Já existe outro curso com esse nome ou código."
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.course.update({
    where: { id },
    data: {
      name,
      code: code || null,
      description: description || null,
      mainShift: mainShift || null
    }
  });
}


// Excluir curso
export async function deleteCourse(id) {
  const course = await prisma.course.findUnique({
    where: { id }
  });

  if (!course) {
    const error = new Error("Curso não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  // Verificar disciplinas vinculadas
  const disciplinesCount = await prisma.discipline.count({
    where: { courseId: id }
  });

  // Verificar alunos vinculados
  const studentsCount = await prisma.student.count({
    where: { courseId: id }
  });

  if (disciplinesCount > 0 || studentsCount > 0) {
    const error = new Error(
      "Não é possível excluir este curso porque existem disciplinas ou alunos vinculados a ele."
    );

    error.statusCode = 409;
    throw error;
  }

  return prisma.course.delete({
    where: { id }
  });
}