
import prisma from "../database/prisma.js";

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

// Criar turma, matricular alunos e gerar avaliações iniciais.
export async function createSchoolClass(data) {
  const {
    name,
    code,
    academicYear,
    term,
    disciplineId,
    professorId
  } = data;

  // Verificar se a disciplina existe e está ativa.
  const discipline = await prisma.discipline.findFirst({
    where: {
      id: disciplineId,
      isActive: true
    }
  });

  if (!discipline) {
    throw criarErro(
      "Disciplina não encontrada ou inativa.",
      404
    );
  }

  // Verificar se o professor existe e está ativo.
  const professor = await prisma.professor.findFirst({
    where: {
      id: professorId,
      user: {
        isActive: true
      }
    }
  });

  if (!professor) {
    throw criarErro(
      "Professor não encontrado ou inativo.",
      404
    );
  }

  // Verificar vínculo entre professor e disciplina.
  if (professor.disciplineId !== disciplineId) {
    throw criarErro(
      "O professor não está vinculado à disciplina selecionada.",
      400
    );
  }

  // Verificar duplicidade do código.
  const existingClass = await prisma.schoolClass.findUnique({
    where: { code }
  });

  if (existingClass) {
    throw criarErro(
      "Já existe uma turma com esse código.",
      409
    );
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {

      // Impede que o período seja encerrado durante a criação da turma.
      await tx.$executeRaw`
        LOCK TABLE academic_terms IN SHARE MODE
      `;

      // Localizar o período letivo em andamento.
      const academicTerm = await tx.academicTerm.findFirst({
        where: {
          year: academicYear,
          termNumber: term,
          status: "EM_ANDAMENTO"
        }
      });

      if (!academicTerm) {
        throw criarErro(
          "Não existe um período letivo em andamento para o ano e número informados.",
          409
        );
      }

      // Impedir mais de uma turma da mesma disciplina no período.
      const turmaExistente = await tx.schoolClass.findFirst({
        where: {
          disciplineId,
          academicTermId: academicTerm.id
        },
        select: {
          id: true,
          name: true,
          code: true
        }
      });

      if (turmaExistente) {
        throw criarErro(
          "Já existe uma turma para esta disciplina neste período letivo.",
          409
        );
      }

      // Criar a turma.
      // O semestre é sempre obtido da disciplina.
      const turma = await tx.schoolClass.create({
        data: {
          name,
          code,
          academicYear,
          term,
          semester: discipline.semester,
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

      // Localizar alunos elegíveis para matrícula automática.
      const alunosElegiveis = await tx.student.findMany({
        where: {
          status: "ATIVO",
          courseId: discipline.courseId,
          semester: discipline.semester
        },
        select: {
          id: true
        }
      });

      // Matricular os alunos na turma.
      let matriculasCriadas = 0;

      if (alunosElegiveis.length > 0) {
        const matriculas = await tx.enrollment.createMany({
          data: alunosElegiveis.map((aluno) => ({
            studentId: aluno.id,
            classId: turma.id
          })),
          skipDuplicates: true
        });

        matriculasCriadas = matriculas.count;
      }

      // Criar as três avaliações iniciais.
      await tx.assessment.createMany({
        data: ["U1", "U2", "U3"].map((unit) => ({
          classId: turma.id,
          unit,
          number: "AVALIACAO1",
          title: `Avaliação ${unit}`
        }))
      });

      return {
        turma,
        matriculasCriadas
      };
    });

    return {
      ...resultado.turma,
      matriculasCriadas: resultado.matriculasCriadas
    };

  } catch (error) {
    // Tratar conflitos de unicidade, inclusive requisições simultâneas.
    if (error.code === "P2002") {
      throw criarErro(
        "Já existe uma turma com esse código ou para esta disciplina neste período letivo.",
        409
      );
    }

    throw error;
  }
}

// Listar turmas conforme o perfil do usuário autenticado.
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
    throw criarErro(
      "Perfil sem permissão para consultar turmas.",
      403
    );
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
