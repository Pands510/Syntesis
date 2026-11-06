//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

// Matricular aluno em uma turma
export async function createEnrollment(data) {
  const { studentId, classId } = data;

  // Verificar se o aluno existe e está ativo
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      user: {
        isActive: true
      }
    }
  });

  if (!student) {
    const error = new Error(
      "Aluno não encontrado ou inativo."
    );
    error.statusCode = 404;
    throw error;
  }

  // Verificar se a turma existe e está ativa
  const schoolClass = await prisma.schoolClass.findFirst({
    where: {
      id: classId,
      isActive: true
    }
  });

  if (!schoolClass) {
    const error = new Error(
      "Turma não encontrada ou inativa."
    );
    error.statusCode = 404;
    throw error;
  }

  // Verificar se o aluno já está matriculado
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_classId: {
        studentId,
        classId
      }
    }
  });

  if (existingEnrollment) {
    const error = new Error(
      "Este aluno já possui uma matrícula nesta turma."
    );
    error.statusCode = 409;
    throw error;
  }

  // Criar matrícula
  return prisma.enrollment.create({
    data: {
      studentId,
      classId
    },
    include: {
      student: {
        select: {
          id: true,
          registrationNumber: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      schoolClass: {
        select: {
          id: true,
          name: true,
          code: true,
          academicYear: true,
          term: true,
          discipline: {
            select: {
              name: true,
              code: true
            }
          }
        }
      }
    }
  });
}

// Listar matrículas
// Listar matrículas conforme o perfil do usuário autenticado
export async function listEnrollments(user) {
  let where = {};

  if (user.role === "PROFESSOR") {
    where = {
      schoolClass: {
        is: {
          professor: {
            is: {
              userId: user.id
            }
          }
        }
      }
    };
  } else if (user.role === "ALUNO") {
    where = {
      student: {
        is: {
          userId: user.id
        }
      }
    };
  } else if (user.role !== "ADMIN") {
    const error = new Error(
      "Perfil sem permissão para consultar matrículas."
    );
    error.statusCode = 403;
    throw error;
  }

  return prisma.enrollment.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          registrationNumber: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      schoolClass: {
        select: {
          id: true,
          name: true,
          code: true,
          academicYear: true,
          term: true,
          discipline: {
            select: {
              name: true,
              code: true
            }
          },
          professor: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      enrolledAt: "desc"
    }
  });
}

// Atualizar status de uma matrícula
export async function updateEnrollmentStatus(id, status) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id }
  });

  if (!enrollment) {
    const error = new Error("Matrícula não encontrada.");
    error.statusCode = 404;
    throw error;
  }

  const allowedStatuses = [
    "ATIVA",
    "CONCLUIDA",
    "CANCELADA"
  ];

  if (!allowedStatuses.includes(status)) {
    const error = new Error("Status de matrícula inválido.");
    error.statusCode = 400;
    throw error;
  }

  return prisma.enrollment.update({
    where: { id },
    data: { status },
    include: {
      student: {
        select: {
          id: true,
          registrationNumber: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      schoolClass: {
        select: {
          id: true,
          name: true,
          code: true,
          academicYear: true,
          term: true,
          discipline: {
            select: {
              name: true,
              code: true
            }
          },
          professor: {
            select: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
}