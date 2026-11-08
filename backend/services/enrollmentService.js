
import prisma from "../database/prisma.js";


// Matricular aluno em uma turma.
export async function createEnrollment(data) {
  const { studentId, classId } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      // Evitar conflitos com ativação ou encerramento do período.
      await tx.$executeRaw`
        LOCK TABLE academic_terms IN SHARE MODE
      `;

      // Verificar se o aluno existe e está academicamente ativo.
      const student = await tx.student.findUnique({
        where: {
          id: studentId
        }
      });

      if (!student) {
        throw criarErro(
          "Aluno não encontrado.",
          404
        );
      }

      if (student.status !== "ATIVO") {
        throw criarErro(
          "Somente alunos com situação acadêmica ATIVO podem ser matriculados.",
          409
        );
      }

      if (!student.courseId || !student.semester) {
        throw criarErro(
          "O aluno não possui curso ou semestre curricular definido.",
          409
        );
      }

      // Verificar se a turma existe e está ativa.
      const schoolClass = await tx.schoolClass.findFirst({
        where: {
          id: classId,
          isActive: true
        },
        include: {
          discipline: true,
          academicTerm: true
        }
      });

      if (!schoolClass) {
        throw criarErro(
          "Turma não encontrada ou inativa.",
          404
        );
      }

      // Exigir período letivo em andamento.
      if (
        !schoolClass.academicTerm ||
        schoolClass.academicTerm.status !== "EM_ANDAMENTO"
      ) {
        throw criarErro(
          "Só é possível matricular alunos em turmas de um período letivo em andamento.",
          409
        );
      }

      // Verificar se existe vínculo acadêmico compatível.
      if (
        !schoolClass.discipline.isActive ||
        schoolClass.discipline.courseId !== student.courseId ||
        schoolClass.discipline.semester !== student.semester
      ) {
        throw criarErro(
          "A turma não corresponde ao curso e semestre curricular atual do aluno.",
          409
        );
      }

      // Verificar matrícula anterior.
      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          studentId_classId: {
            studentId,
            classId
          }
        }
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === "CONCLUIDA") {
          throw criarErro(
            "Esta matrícula já foi concluída e não pode ser reativada.",
            409
          );
        }

        if (existingEnrollment.status === "ATIVA") {
          throw criarErro(
            "Este aluno já possui uma matrícula ativa nesta turma.",
            409
          );
        }

        // Reativar matrícula cancelada somente na turma elegível
        // do período letivo que está em andamento.
        return tx.enrollment.update({
          where: {
            id: existingEnrollment.id
          },
          data: {
            status: "ATIVA"
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

      // Criar nova matrícula.
      return tx.enrollment.create({
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
    });

  } catch (error) {
    if (error.code === "P2002") {
      throw criarErro(
        "Este aluno já possui uma matrícula nesta turma.",
        409
      );
    }

    throw error;
  }
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


// Atualizar status de uma matrícula.
export async function updateEnrollmentStatus(id, status) {
  const allowedStatuses = [
    "ATIVA",
    "CONCLUIDA",
    "CANCELADA"
  ];

  if (!allowedStatuses.includes(status)) {
    throw criarErro(
      "Status de matrícula inválido.",
      400
    );
  }

  return prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        schoolClass: {
          include: {
            discipline: true,
            academicTerm: true
          }
        }
      }
    });

    if (!enrollment) {
      throw criarErro(
        "Matrícula não encontrada.",
        404
      );
    }

    // Matrículas concluídas são registros históricos.
    if (
      enrollment.status === "CONCLUIDA" &&
      status !== "CONCLUIDA"
    ) {
      throw criarErro(
        "Matrículas concluídas não podem ser reativadas ou canceladas.",
        409
      );
    }

    // Validar condições para ativação.
    if (status === "ATIVA") {
      if (enrollment.student.status !== "ATIVO") {
        throw criarErro(
          "Somente alunos com situação acadêmica ATIVO podem possuir matrículas ativas.",
          409
        );
      }

      if (
        !enrollment.schoolClass.isActive ||
        !enrollment.schoolClass.academicTerm ||
        enrollment.schoolClass.academicTerm.status !== "EM_ANDAMENTO"
      ) {
        throw criarErro(
          "Somente matrículas de turmas ativas do período letivo em andamento podem ser ativadas.",
          409
        );
      }

      if (
        !enrollment.schoolClass.discipline.isActive ||
        enrollment.schoolClass.discipline.courseId !== enrollment.student.courseId ||
        enrollment.schoolClass.discipline.semester !== enrollment.student.semester
      ) {
        throw criarErro(
          "A turma não corresponde ao curso e semestre curricular atual do aluno.",
          409
        );
      }
    }

    return tx.enrollment.update({
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
  });
}
