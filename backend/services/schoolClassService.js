//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";
import { garantirAvaliacoesDaTurma } from "./assessmentService.js";

export async function createSchoolClass(data) {
  const {
    name,
    code,
    academicYear,
    term,
    semester,
    disciplineId,
    professorId
  } = data;

  // Verificar se a disciplina existe e está ativa
  const discipline = await prisma.discipline.findFirst({
    where: {
      id: disciplineId,
      isActive: true
    }
  });

  if (!discipline) {
    const error = new Error(
      "Disciplina não encontrada ou inativa."
    );
    error.statusCode = 404;
    throw error;
  }

  // Verificar se o professor existe e está ativo
  const professor = await prisma.professor.findFirst({
    where: {
      id: professorId,
      user: {
        isActive: true
      }
    }
  });

  if (!professor) {
    const error = new Error(
      "Professor não encontrado ou inativo."
    );
    error.statusCode = 404;
    throw error;
  }

  // Verificar vínculo entre professor e disciplina
  if (professor.disciplineId !== disciplineId) {
    const error = new Error(
      "O professor não está vinculado à disciplina selecionada."
    );
    error.statusCode = 400;
    throw error;
  }

  // Verificar duplicidade do código
  const existingClass = await prisma.schoolClass.findUnique({
    where: { code }
  });

  if (existingClass) {
    const error = new Error(
      "Já existe uma turma com esse código."
    );
    error.statusCode = 409;
    throw error;
  }

  // Localizar o período letivo e criar a turma
  const turma = await prisma.$transaction(async (tx) => {
    // Impede que o período seja encerrado durante a criação da turma.
    await tx.$executeRaw`
      LOCK TABLE academic_terms IN SHARE MODE
    `;

    const academicTerm = await tx.academicTerm.findFirst({
      where: {
        year: academicYear,
        termNumber: term,
        status: "EM_ANDAMENTO"
      }
    });

    if (!academicTerm) {
      const error = new Error(
        "Não existe um período letivo em andamento para o ano e número informados."
      );
      error.statusCode = 409;
      throw error;
    }

    return tx.schoolClass.create({
      data: {
        name,
        code,
        academicYear,
        term,
        semester: semester ?? null,
        disciplineId,
        professorId,
        academicTermId: academicTerm.id
      },
      include: {
        discipline: {
          select: {
            id: true,
            name: true,
            code: true,
            workloadHours: true
          }
        },
        professor: {
          select: {
            id: true,
            employeeNumber: true,
            department: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        academicTerm: true
      }
    });
  });

  // Criar avaliações iniciais da turma
  await garantirAvaliacoesDaTurma(turma.id);

  return turma;
}

// Listar turmas conforme o perfil do usuário autenticado
export async function listSchoolClasses(user) {
  let where = {};

  if (user.role === "PROFESSOR") {
    where = {
      professor: {
        is: {
          userId: user.id
        }
      }
    };
  } else if (user.role === "ALUNO") {
    where = {
      enrollments: {
        some: {
          student: {
            is: {
              userId: user.id
            }
          },
          status: "ATIVA"
        }
      }
    };
  } else if (user.role !== "ADMIN") {
    const error = new Error(
      "Perfil sem permissão para consultar turmas."
    );
    error.statusCode = 403;
    throw error;
  }

  return prisma.schoolClass.findMany({
    where,
    include: {
      discipline: {
        select: {
          id: true,
          name: true,
          code: true,
          workloadHours: true
        }
      },
      professor: {
        select: {
          id: true,
          employeeNumber: true,
          department: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      academicTerm: true
    },
    orderBy: [
      { academicYear: "desc" },
      { name: "asc" }
    ]
  });
}
