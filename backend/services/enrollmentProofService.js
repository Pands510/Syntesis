import prisma from "../database/prisma.js";

function criarErro(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function getMyEnrollmentProofData(userId) {
  // Localizar o cadastro acadêmico do usuário autenticado.
  const student = await prisma.student.findUnique({
    where: {
      userId
    },
    include: {
      user: {
        select: {
          name: true
        }
      },
      academicCourse: {
        select: {
          id: true,
          name: true,
          code: true,
          totalSemesters: true
        }
      }
    }
  });

  if (!student) {
    throw criarErro(
      "Não foi encontrado um cadastro acadêmico para este usuário.",
      404
    );
  }

  if (student.status !== "ATIVO") {
    throw criarErro(
      "O comprovante só pode ser emitido para alunos com situação acadêmica ATIVO.",
      409
    );
  }

  if (!student.academicCourse) {
    throw criarErro(
      "O aluno não possui um curso vinculado ao cadastro acadêmico.",
      409
    );
  }

  // Buscar somente matrículas ativas em turmas ativas
  // pertencentes a períodos letivos em andamento.
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: student.id,
      status: "ATIVA",
      schoolClass: {
        is: {
          isActive: true,
          academicTerm: {
            is: {
              status: "EM_ANDAMENTO"
            }
          }
        }
      }
    },
    include: {
      schoolClass: {
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              code: true,
              workloadHours: true
            }
          },
          academicTerm: {
            select: {
              id: true,
              name: true,
              year: true,
              termNumber: true,
              startDate: true,
              endDate: true
            }
          }
        }
      }
    },
    orderBy: {
      schoolClass: {
        discipline: {
          name: "asc"
        }
      }
    }
  });

  if (enrollments.length === 0) {
    throw criarErro(
      "Não existem matrículas ativas em um período letivo em andamento para emitir o comprovante.",
      409
    );
  }

  // Garantir que todas as matrículas pertençam ao mesmo período.
  const academicTermIds = [
    ...new Set(
      enrollments.map(
        enrollment => enrollment.schoolClass.academicTerm.id
      )
    )
  ];

  if (academicTermIds.length !== 1) {
    throw criarErro(
      "Foram encontradas matrículas em mais de um período letivo em andamento. Procure a administração acadêmica para regularizar o cadastro.",
      409
    );
  }

  const academicTerm = enrollments[0].schoolClass.academicTerm;

  const totalWorkload = enrollments.reduce(
    (total, enrollment) =>
      total + enrollment.schoolClass.discipline.workloadHours,
    0
  );

  return {
    student,
    academicTerm,
    enrollments,
    totalWorkload,
    issuedAt: new Date()
  };
}