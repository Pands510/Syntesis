
import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}


/**
 * Sincroniza as matrículas de um aluno com as turmas
 * elegíveis do período letivo em andamento.
 *
 * Deve ser chamada dentro de uma transação Prisma.
 */
async function sincronizarMatriculasDoAluno(tx, studentId) {
  // Impede conflitos com ativação ou encerramento do período letivo.
  await tx.$executeRaw`
    LOCK TABLE academic_terms IN SHARE MODE
  `;

  const student = await tx.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      status: true,
      courseId: true,
      semester: true
    }
  });

  if (
    !student ||
    student.status !== "ATIVO" ||
    !student.courseId ||
    !student.semester
  ) {
    return 0;
  }

  // Localizar o período letivo atual.
  const academicTerm = await tx.academicTerm.findFirst({
    where: {
      status: "EM_ANDAMENTO"
    },
    select: {
      id: true
    }
  });

  if (!academicTerm) {
    return 0;
  }

  // Localizar turmas ativas compatíveis com o aluno.
  const turmas = await tx.schoolClass.findMany({
    where: {
      isActive: true,
      academicTermId: academicTerm.id,
      discipline: {
        is: {
          isActive: true,
          courseId: student.courseId,
          semester: student.semester
        }
      }
    },
    select: {
      id: true
    }
  });

  const classIds = turmas.map((turma) => turma.id);
  const turmasElegiveis = new Set(classIds);

  // Localizar matrículas ativas do aluno no período atual.
  const matriculasAtivasNoPeriodo = await tx.enrollment.findMany({
    where: {
      studentId,
      status: "ATIVA",
      schoolClass: {
        is: {
          academicTermId: academicTerm.id
        }
      }
    },
    select: {
      id: true,
      classId: true
    }
  });

  // Cancelar matrículas que deixaram de ser compatíveis.
  const matriculasIncompativeis = matriculasAtivasNoPeriodo
    .filter((matricula) => !turmasElegiveis.has(matricula.classId))
    .map((matricula) => matricula.id);

  if (matriculasIncompativeis.length > 0) {
    await tx.enrollment.updateMany({
      where: {
        id: {
          in: matriculasIncompativeis
        },
        status: "ATIVA"
      },
      data: {
        status: "CANCELADA"
      }
    });
  }

  if (classIds.length === 0) {
    return 0;
  }

  // Consultar matrículas que já existem nas turmas elegíveis.
  const matriculasExistentes = await tx.enrollment.findMany({
    where: {
      studentId,
      classId: {
        in: classIds
      }
    },
    select: {
      id: true,
      classId: true,
      status: true
    }
  });

  const turmasComMatricula = new Set(
    matriculasExistentes.map((matricula) => matricula.classId)
  );

  // Criar somente matrículas inexistentes.
  const novasMatriculas = classIds
    .filter((classId) => !turmasComMatricula.has(classId))
    .map((classId) => ({
      studentId,
      classId,
      status: "ATIVA"
    }));

  let quantidadeCriada = 0;

  if (novasMatriculas.length > 0) {
    const resultado = await tx.enrollment.createMany({
      data: novasMatriculas,
      skipDuplicates: true
    });

    quantidadeCriada = resultado.count;
  }

  // Reativar somente matrículas canceladas das turmas elegíveis
  // pertencentes ao período letivo atual.
  const matriculasCanceladas = matriculasExistentes
    .filter((matricula) => matricula.status === "CANCELADA")
    .map((matricula) => matricula.classId);

  if (matriculasCanceladas.length > 0) {
    await tx.enrollment.updateMany({
      where: {
        studentId,
        classId: {
          in: matriculasCanceladas
        },
        status: "CANCELADA",
        schoolClass: {
          is: {
            academicTermId: academicTerm.id
          }
        }
      },
      data: {
        status: "ATIVA"
      }
    });
  }

  // Matrículas concluídas permanecem como histórico.
  return quantidadeCriada;
}


export async function createStudent(data) {
  const {
    name,
    email,
    password,
    registrationNumber,
    courseId,
    semester
  } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw criarErro("Este e-mail já está cadastrado.", 409);
  }

  const existingStudent = await prisma.student.findUnique({
    where: { registrationNumber }
  });

  if (existingStudent) {
    throw criarErro("Esta matrícula já está cadastrada.", 409);
  }

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isActive: true
    }
  });

  if (!course) {
    throw criarErro("Curso não encontrado ou inativo.", 404);
  }

  if (
    !Number.isInteger(semester) ||
    semester < 1 ||
    semester > course.totalSemesters
  ) {
    throw criarErro(
      "O semestre informado não é válido para a duração do curso.",
      400
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ALUNO",

        student: {
          create: {
            registrationNumber,
            course: course.name,
            academicCourse: {
              connect: {
                id: course.id
              }
            },
            semester,
            status: "ATIVO",

            academicHistory: {
              create: {
                type: "INGRESSO",
                newCourseId: course.id,
                semester,
                description: "Ingresso inicial no curso."
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            registrationNumber: true,
            course: true,
            courseId: true,
            semester: true,
            status: true,
            academicCourse: {
              select: {
                id: true,
                name: true,
                code: true,
                mainShift: true
              }
            }
          }
        }
      }
    });

    // Sincronizar matrículas dentro da mesma transação.
    await sincronizarMatriculasDoAluno(
      tx,
      usuario.student.id
    );

    return usuario;
  });
}

// ======================================================
// ATUALIZAR ALUNO
// ======================================================

export async function updateStudent(studentId, data) {
  const {
    name,
    email,
    registrationNumber,
    semester,
    password
  } = data;

  const student = await prisma.student.findUnique({
    where: {
      id: studentId
    },
    include: {
      user: true,
      academicCourse: {
        select: {
          id: true,
          name: true,
          totalSemesters: true
        }
      }
    }
  });

  if (!student) {
    throw criarErro("Aluno não encontrado.", 404);
  }

  if (
    !Number.isInteger(semester) ||
    semester < 1 ||
    (
      student.academicCourse?.totalSemesters &&
      semester > student.academicCourse.totalSemesters
    )
  ) {
    throw criarErro(
      "O semestre informado não é válido para a duração do curso.",
      400
    );
  }

  const existingEmail = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: student.userId
      }
    }
  });

  if (existingEmail) {
    throw criarErro("Este e-mail já está cadastrado.", 409);
  }

  const existingRegistration = await prisma.student.findFirst({
    where: {
      registrationNumber,
      NOT: {
        id: studentId
      }
    }
  });

  if (existingRegistration) {
    throw criarErro("Esta matrícula já está cadastrada.", 409);
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : undefined;

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.user.update({
      where: {
        id: student.userId
      },
      data: {
        name,
        email,
        ...(passwordHash && { passwordHash }),

        student: {
          update: {
            registrationNumber,
            semester
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        student: {
          select: {
            id: true,
            registrationNumber: true,
            course: true,
            courseId: true,
            semester: true,
            status: true
          }
        }
      }
    });

    // Garante a sincronização mesmo quando o aluno já possuía
    // cadastro e apenas seus dados foram atualizados.
    await sincronizarMatriculasDoAluno(
      tx,
      studentId
    );

    return usuario;
  });
}

// ======================================================
// ALTERAR SITUAÇÃO ACADÊMICA
// ======================================================

export async function updateStudentStatus(studentId, data) {
  const { status } = data;

  const statusPermitidos = [
    "ATIVO",
    "TRANCADO",
    "CONCLUIDO"
  ];

  if (!statusPermitidos.includes(status)) {
    throw criarErro("Situação acadêmica inválida.", 400);
  }

  const student = await prisma.student.findUnique({
    where: {
      id: studentId
    }
  });

  if (!student) {
    throw criarErro("Aluno não encontrado.", 404);
  }

  if (student.status === status) {
    throw criarErro(
      "O aluno já possui essa situação acadêmica.",
      409
    );
  }

  return prisma.$transaction(async (tx) => {
    const updatedStudent = await tx.student.update({
      where: {
        id: studentId
      },
      data: {
        status
      },
      select: {
        id: true,
        registrationNumber: true,
        course: true,
        courseId: true,
        semester: true,
        status: true
      }
    });

    // Registrar a alteração no histórico acadêmico.
    await tx.academicHistory.create({
      data: {
        studentId,
        type:
          status === "TRANCADO"
            ? "TRANCAMENTO"
            : status === "CONCLUIDO"
              ? "CONCLUSAO"
              : "RETORNO",

        previousCourseId: student.courseId,
        newCourseId: student.courseId,
        semester: student.semester,

        description:
          status === "TRANCADO"
            ? "Trancamento do curso."
            : status === "CONCLUIDO"
              ? "Conclusão do curso."
              : "Retorno às atividades acadêmicas."
      }
    });

    if (status === "TRANCADO") {
      // Preservar os registros, mas impedir novas alterações
      // nas matrículas que estavam ativas.
      await tx.enrollment.updateMany({
        where: {
          studentId,
          status: "ATIVA"
        },
        data: {
          status: "CANCELADA"
        }
      });
    }

    if (status === "CONCLUIDO") {
      // Concluir as matrículas sem apagar notas ou frequência.
      await tx.enrollment.updateMany({
        where: {
          studentId,
          status: "ATIVA"
        },
        data: {
          status: "CONCLUIDA"
        }
      });
    }

    if (status === "ATIVO") {
      // Sincronizar somente com as turmas do período atual.
      await sincronizarMatriculasDoAluno(
        tx,
        studentId
      );
    }

    return updatedStudent;
  });
}
