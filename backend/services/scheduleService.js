//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

const HORARIOS = {
  MANHA: [
    ["07:30", "08:20"],
    ["08:20", "09:10"],
    ["09:10", "10:00"],
    ["10:00", "10:50"],
    ["10:50", "11:40"],
    ["11:40", "12:30"]
  ],
  TARDE: [
    ["13:30", "14:20"],
    ["14:20", "15:10"],
    ["15:10", "16:00"],
    ["16:00", "16:50"],
    ["16:50", "17:40"],
    ["17:40", "18:30"]
  ]
};

const DIAS_VALIDOS = [
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA"
];

function validarUUID(id) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof id === "string" && regex.test(id.trim());
}

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function formatarHorario(entry) {
  const horario = HORARIOS[entry.shift][entry.lessonNumber - 1];

  return {
    ...entry,
    startTime: horario[0],
    endTime: horario[1]
  };
}


export async function createScheduleEntry(data) {
  if (!data || typeof data !== "object") {
    throw criarErro("Dados da solicitação inválidos.", 400);
  }

  const { classId, weekDay, shift, lessonNumber } = data;

  if (
    classId == null ||
    !weekDay ||
    !shift ||
    lessonNumber == null
  ) {
    throw criarErro("Todos os campos são obrigatórios.", 400);
  }

  if (typeof classId !== "string" || !classId.trim()) {
    throw criarErro("Identificador da turma inválido.", 400);
  }

  if (!validarUUID(classId)) {
    throw criarErro("Identificador da turma inválido.", 400);
  }

  if (!DIAS_VALIDOS.includes(weekDay)) {
    throw criarErro("Dia da semana inválido.", 400);
  }

  if (!Object.prototype.hasOwnProperty.call(HORARIOS, shift)) {
    throw criarErro("Turno inválido.", 400);
  }

  const aula = Number(lessonNumber);

  if (!Number.isInteger(aula) || aula < 1 || aula > 6) {
    throw criarErro("A aula deve estar entre 1 e 6.", 400);
  }

  const MAX_TENTATIVAS = 3;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const entry = await prisma.$transaction(
        async (tx) => {
          const schoolClass = await tx.schoolClass.findFirst({
            where: {
              id: classId.trim(),
              isActive: true
            },
            select: {
              id: true,
              professorId: true
            }
          });

          if (!schoolClass) {
            throw criarErro("Turma não encontrada ou inativa.", 404);
          }

          // Bloqueia a linha do professor até o fim da transação.
          await tx.$queryRaw`
            SELECT "id"
            FROM "professors"
            WHERE "id" = ${schoolClass.professorId}
            FOR UPDATE
          `;

          // Verificar conflito na própria turma.
          const conflitoTurma = await tx.scheduleEntry.findFirst({
            where: {
              classId: schoolClass.id,
              weekDay,
              shift,
              lessonNumber: aula
            }
          });

          if (conflitoTurma) {
            throw criarErro(
              "Esta turma já possui uma aula cadastrada nesse período.",
              409
            );
          }

          // Verificar conflito do professor em outra turma.
          const conflitoProfessor = await tx.scheduleEntry.findFirst({
            where: {
              weekDay,
              shift,
              lessonNumber: aula,
              classId: {
                not: schoolClass.id
              },
              schoolClass: {
                professorId: schoolClass.professorId
              }
            }
          });

          if (conflitoProfessor) {
            throw criarErro(
              "Este professor já possui uma aula cadastrada nesse horário.",
              409
            );
          }

          // Criar horário após as verificações.
          return await tx.scheduleEntry.create({
            data: {
              classId: schoolClass.id,
              weekDay,
              shift,
              lessonNumber: aula
            },
            include: {
              schoolClass: {
                include: {
                  discipline: true,
                  professor: {
                    include: {
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
        },
      );

      return formatarHorario(entry);

    } catch (error) {
      // Repetir a transação em caso de conflito de serialização.
      if (error.code === "P2034") {
        if (tentativa < MAX_TENTATIVAS) {
          continue;
        }

        throw criarErro(
          "Não foi possível cadastrar o horário devido a operações simultâneas. Tente novamente.",
          409
        );
      }

      if (error.code === "P2002") {
        throw criarErro(
          "Esta turma já possui uma aula cadastrada nesse período.",
          409
        );
      }

      throw error;
    }
  }
}


// Consultar horários de uma turma
// Consultar horários de uma turma
export async function listClassSchedule(classId, user) {
  if (!validarUUID(classId)) {
    throw criarErro("Identificador da turma inválido.", 400);
  }

  if (!user || !user.id || !user.role) {
    throw criarErro("Usuário não autorizado.", 403);
  }

  const schoolClass = await prisma.schoolClass.findUnique({
    where: {
      id: classId.trim()
    },
    select: {
      id: true,
      professor: {
        select: {
          userId: true
        }
      }
    }
  });

  if (!schoolClass) {
    throw criarErro("Turma não encontrada.", 404);
  }

  // ADMIN pode consultar qualquer turma.
  // PROFESSOR só pode consultar suas próprias turmas.
  if (
    user.role === "PROFESSOR" &&
    schoolClass.professor.userId !== user.id
  ) {
    throw criarErro(
      "Você não tem permissão para consultar os horários desta turma.",
      403
    );
  }

  if (!["ADMIN", "PROFESSOR"].includes(user.role)) {
    throw criarErro(
      "Perfil sem permissão para consultar horários da turma.",
      403
    );
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: {
      classId: schoolClass.id
    },
    include: {
      schoolClass: {
        include: {
          discipline: true,
          professor: {
            include: {
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
    orderBy: [
      { weekDay: "asc" },
      { shift: "asc" },
      { lessonNumber: "asc" }
    ]
  });

  return entries.map(formatarHorario);
}

// Consultar agenda do aluno autenticado
export async function getStudentSchedule(userId) {
  if (!validarUUID(userId)) {
    throw criarErro("Identificador do usuário inválido.", 400);
  }

  const student = await prisma.student.findUnique({
    where: {
      userId
    },
    select: {
      id: true
    }
  });

  if (!student) {
    throw criarErro("Perfil acadêmico não encontrado.", 404);
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: {
      schoolClass: {
        enrollments: {
          some: {
            studentId: student.id,
            status: "ATIVA"
          }
        }
      }
    },
    include: {
      schoolClass: {
        include: {
          discipline: true,
          professor: {
            include: {
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
    orderBy: [
      { weekDay: "asc" },
      { shift: "asc" },
      { lessonNumber: "asc" }
    ]
  });

  return entries.map(formatarHorario);
}

// Excluir horário
export async function deleteScheduleEntry(id) {
  if (!validarUUID(id)) {
    throw criarErro("Identificador do horário inválido.", 400);
  }

  const entry = await prisma.scheduleEntry.findUnique({
    where: {
      id: id.trim()
    }
  });

  if (!entry) {
    throw criarErro("Horário não encontrado.", 404);
  }

  return prisma.scheduleEntry.delete({
    where: {
      id: entry.id
    }
  });
}