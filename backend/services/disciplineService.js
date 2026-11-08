
import prisma from "../database/prisma.js";

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function validarSemestre(semester, course) {
  if (
    !Number.isInteger(semester) ||
    semester < 1 ||
    semester > course.totalSemesters
  ) {
    throw criarErro(
      `O semestre da disciplina deve estar entre 1 e ${course.totalSemesters}, conforme a duração do curso.`,
      400
    );
  }
}

// Cadastrar disciplina
export async function createDiscipline(data) {
  const {
    name,
    code,
    workloadHours,
    courseId,
    semester
  } = data;

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw criarErro("Curso não encontrado.", 404);
  }

  validarSemestre(semester, course);

  const existingDiscipline = await prisma.discipline.findFirst({
    where: {
      OR: [
        { code },
        { name, courseId }
      ]
    }
  });

  if (existingDiscipline) {
    throw criarErro(
      "Já existe uma disciplina com esse código ou nome neste curso.",
      409
    );
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
          code: true,
          totalSemesters: true
        }
      }
    }
  });
}

// Listar disciplinas com filtros opcionais
export async function listDisciplines(filters = {}) {
  const { courseId, semester } = filters;

  return prisma.discipline.findMany({
    where: {
      ...(courseId ? { courseId } : {}),
      ...(semester !== undefined ? { semester } : {})
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          totalSemesters: true
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

  const discipline = await prisma.discipline.findUnique({
    where: { id }
  });

  if (!discipline) {
    throw criarErro("Disciplina não encontrada.", 404);
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId }
  });

  if (!course) {
    throw criarErro("Curso não encontrado.", 404);
  }

  validarSemestre(semester, course);

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
    throw criarErro(
      "Já existe uma disciplina com esse código ou nome neste curso.",
      409
    );
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
          code: true,
          totalSemesters: true,
          totalSemesters: true
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
    throw criarErro("Disciplina não encontrada.", 404);
  }

  const totalTurmas = await prisma.schoolClass.count({
    where: { disciplineId: id }
  });

  if (totalTurmas > 0) {
    throw criarErro(
      "Não é possível excluir esta disciplina porque existem turmas vinculadas a ela.",
      409
    );
  }

  await prisma.discipline.delete({
    where: { id }
  });

  return true;
}
