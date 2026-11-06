//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

const DIAS_SEMANA = [
  "DOMINGO",
  "SEGUNDA",
  "TERCA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SABADO"
];

const STATUS_VALIDOS = [
  "PRESENTE",
  "FALTA",
  "JUSTIFICADA"
];

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function validarUUID(id) {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return typeof id === "string" && regex.test(id.trim());
}

function validarData(data) {
  if (
    typeof data !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    throw criarErro(
      "Informe uma data válida no formato AAAA-MM-DD.",
      400
    );
  }

  const [ano, mes, dia] = data.split("-").map(Number);

  const dataValidada = new Date(
    Date.UTC(ano, mes - 1, dia)
  );

  if (
    dataValidada.getUTCFullYear() !== ano ||
    dataValidada.getUTCMonth() !== mes - 1 ||
    dataValidada.getUTCDate() !== dia
  ) {
    throw criarErro("Data inválida.", 400);
  }

  return dataValidada;
}

function obterDiaSemana(data) {
  return DIAS_SEMANA[data.getUTCDay()];
}

// Verificar turma e permissão do professor
async function verificarAcessoTurma(classId, user) {
  if (!validarUUID(classId)) {
    throw criarErro("Identificador da turma inválido.", 400);
  }

  if (!user || !user.id || !user.role) {
    throw criarErro("Usuário não autorizado.", 403);
  }

  const turma = await prisma.schoolClass.findUnique({
    where: {
      id: classId.trim()
    },
    select: {
      id: true,
      isActive: true,
      professor: {
        select: {
          userId: true
        }
      },
      discipline: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!turma) {
    throw criarErro("Turma não encontrada.", 404);
  }

  if (!turma.isActive) {
    throw criarErro("Turma inativa.", 400);
  }

  if (
    user.role === "PROFESSOR" &&
    turma.professor.userId !== user.id
  ) {
    throw criarErro(
      "Você não tem permissão para acessar esta turma.",
      403
    );
  }

  if (!["ADMIN", "PROFESSOR"].includes(user.role)) {
    throw criarErro(
      "Perfil sem permissão para consultar a frequência da turma.",
      403
    );
  }

  return turma;
}

// Consultar datas com aulas programadas em um período
export async function listAttendanceDates(
  classId,
  startDate,
  endDate,
  user
) {
  const turma = await verificarAcessoTurma(classId, user);

  const inicio = validarData(startDate);
  const fim = validarData(endDate);

  if (inicio > fim) {
    throw criarErro(
      "A data inicial não pode ser posterior à data final.",
      400
    );
  }

  const diferencaDias =
    (fim.getTime() - inicio.getTime()) /
    (1000 * 60 * 60 * 24);

  if (diferencaDias > 366) {
    throw criarErro(
      "O período de consulta não pode ultrapassar um ano.",
      400
    );
  }

  const horarios = await prisma.scheduleEntry.findMany({
    where: {
      classId: turma.id
    },
    select: {
      weekDay: true,
      shift: true,
      lessonNumber: true
    },
    orderBy: [
      { weekDay: "asc" },
      { shift: "asc" },
      { lessonNumber: "asc" }
    ]
  });

  const diasComAula = new Set(
    horarios.map((horario) => horario.weekDay)
  );

  const datas = [];

  for (
    let atual = new Date(inicio);
    atual <= fim;
    atual.setUTCDate(atual.getUTCDate() + 1)
  ) {
    const diaSemana = obterDiaSemana(atual);

    if (!diasComAula.has(diaSemana)) {
      continue;
    }

    const aulasDoDia = horarios.filter(
      (horario) => horario.weekDay === diaSemana
    );

    datas.push({
      date: atual.toISOString().slice(0, 10),
      weekDay: diaSemana,
      totalAulas: aulasDoDia.length,
      aulas: aulasDoDia
    });
  }

  return {
    turma: turma.discipline.name,
    totalDatas: datas.length,
    datas
  };
}

// Consultar alunos e frequência de uma data
export async function listAttendanceByDate(
  classId,
  date,
  user
) {
  const turma = await verificarAcessoTurma(classId, user);

  const dataValidada = validarData(date);
  const weekDay = obterDiaSemana(dataValidada);

  const horarios = await prisma.scheduleEntry.findMany({
    where: {
      classId: turma.id,
      weekDay
    },
    orderBy: [
      { shift: "asc" },
      { lessonNumber: "asc" }
    ]
  });

  if (horarios.length === 0) {
    throw criarErro(
      "Não existem aulas programadas para esta turma na data selecionada.",
      400
    );
  }

  const matriculas = await prisma.enrollment.findMany({
    where: {
      classId: turma.id,
      status: "ATIVA"
    },
    select: {
      id: true,
      student: {
        select: {
          registrationNumber: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      attendances: {
        where: {
          date: dataValidada
        },
        select: {
          id: true,
          date: true,
          shift: true,
          lessonNumber: true,
          status: true
        },
        orderBy: [
            { shift: "asc" },
            { lessonNumber: "asc" }
        ]
      }
    },
    orderBy: {
      enrolledAt: "asc"
    }
  });

  return {
    turma: turma.discipline.name,
    date: date,
    weekDay,
    aulas: horarios,
    totalAlunos: matriculas.length,
    alunos: matriculas
  };
}

// Validar situação da frequência
function validarStatus(status) {
  if (!STATUS_VALIDOS.includes(status)) {
    throw criarErro(
      "Situação inválida. Utilize PRESENTE, FALTA ou JUSTIFICADA.",
      400
    );
  }
}

function validarTurno(shift) {
  if (!["MANHA", "TARDE"].includes(shift)) {
    throw criarErro(
      "Turno inválido. Utilize MANHA ou TARDE.",
      400
    );
  }

  return shift;
}


function validarAula(lessonNumber) {
  const aula = Number(lessonNumber);

  if (
    !Number.isInteger(aula) ||
    aula < 1 ||
    aula > 6
  ) {
    throw criarErro(
      "A aula deve estar entre 1 e 6.",
      400
    );
  }

  return aula;
}

// Verificar se existe aula programada na data
async function verificarAulaProgramada(
  classId,
  date,
  shift,
  lessonNumber
) {
  const dataValidada = validarData(date);
  const weekDay = obterDiaSemana(dataValidada);
  const turno = validarTurno(shift);
  const aula = validarAula(lessonNumber);

  const horario = await prisma.scheduleEntry.findFirst({
    where: {
      classId,
      weekDay,
      shift: turno,
      lessonNumber: aula
    }
  });

  if (!horario) {
    throw criarErro(
      "Não existe aula programada neste turno e horário para a data informada.",
      400
    );
  }

  return {
    date: dataValidada,
    shift: turno,
    lessonNumber: aula
  };
}

// Verificar matrícula ativa na turma
async function verificarMatriculaAtiva(
  enrollmentId,
  classId,
  transaction = prisma
) {
  const matricula = await transaction.enrollment.findFirst({
    where: {
      id: enrollmentId,
      classId,
      status: "ATIVA"
    },
    select: {
      id: true
    }
  });

  if (!matricula) {
    throw criarErro(
      "Matrícula não encontrada ou inativa nesta turma.",
      400
    );
  }

  return matricula;
}

// Registrar ou corrigir frequência individual
export async function registerAttendance(data, user) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da frequência.", 400);
  }

  const {
    classId,
    enrollmentId,
    date,
    shift,
    lessonNumber,
    status
  } = data;

  const turma = await verificarAcessoTurma(classId, user);

  if (!validarUUID(enrollmentId)) {
    throw criarErro(
      "Identificador da matrícula inválido.",
      400
    );
  }

  validarStatus(status);

  const aula = await verificarAulaProgramada(
    turma.id,
    date,
    shift,
    lessonNumber
  );

  await verificarMatriculaAtiva(
    enrollmentId,
    turma.id
  );

  return prisma.attendance.upsert({
    where: {
      enrollmentId_date_shift_lessonNumber: {
        enrollmentId,
        date: aula.date,
        shift: aula.shift,
        lessonNumber: aula.lessonNumber
      }
    },
    create: {
      enrollmentId,
      date: aula.date,
      shift: aula.shift,
      lessonNumber: aula.lessonNumber,
      status
    },
    update: {
      status
    }
  });
}

// Registrar ou corrigir frequência de vários alunos
export async function registerAttendanceBatch(data, user) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw criarErro("Informe os dados da frequência.", 400);
  }

  const {
    classId,
    date,
    shift,
    lessonNumber,
    attendances
  } = data;

  const turma = await verificarAcessoTurma(classId, user);

  const aula = await verificarAulaProgramada(
    turma.id,
    date,
    shift,
    lessonNumber
  );

  if (
    !Array.isArray(attendances) ||
    attendances.length === 0
  ) {
    throw criarErro(
      "Informe pelo menos um registro de frequência.",
      400
    );
  }

  if (attendances.length > 200) {
    throw criarErro(
      "O lote não pode ultrapassar 200 alunos.",
      400
    );
  }

  const matriculasRecebidas = new Set();

  for (const item of attendances) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw criarErro(
        "Existe um registro de frequência inválido.",
        400
      );
    }

    if (!validarUUID(item.enrollmentId)) {
      throw criarErro(
        "Existe um identificador de matrícula inválido.",
        400
      );
    }

    if (matriculasRecebidas.has(item.enrollmentId)) {
      throw criarErro(
        "A mesma matrícula não pode aparecer duas vezes no lote.",
        400
      );
    }

    matriculasRecebidas.add(item.enrollmentId);
    validarStatus(item.status);
  }

  return prisma.$transaction(async (tx) => {
    const enrollmentIds = [...matriculasRecebidas];

    const matriculas = await tx.enrollment.findMany({
      where: {
        id: { in: enrollmentIds },
        classId: turma.id,
        status: "ATIVA"
      },
      select: {
        id: true
      }
    });

    if (matriculas.length !== enrollmentIds.length) {
      throw criarErro(
        "Uma ou mais matrículas não pertencem à turma ou não estão ativas.",
        400
      );
    }

    const resultado = [];

    for (const item of attendances) {
      const registro = await tx.attendance.upsert({
        where: {
          enrollmentId_date_shift_lessonNumber: {
            enrollmentId: item.enrollmentId,
            date: aula.date,
            shift: aula.shift,
            lessonNumber: aula.lessonNumber
          }
        },
        create: {
          enrollmentId: item.enrollmentId,
          date: aula.date,
          shift: aula.shift,
          lessonNumber: aula.lessonNumber,
          status: item.status
        },
        update: {
          status: item.status
        }
      });

      resultado.push(registro);
    }

    return {
      total: resultado.length,
      registros: resultado
    };
  });
}

// Consultar total de faltas não justificadas por matrícula
export async function countStudentAbsences(enrollmentId) {
  if (!validarUUID(enrollmentId)) {
    throw criarErro(
      "Identificador da matrícula inválido.",
      400
    );
  }

  const total = await prisma.attendance.count({
    where: {
      enrollmentId,
      status: "FALTA"
    }
  });

  return total;
}

// Listar frequências do aluno autenticado
export async function listMyAttendance(user) {
  if (!user || user.role !== "ALUNO") {
    throw criarErro(
      "Somente alunos podem consultar suas próprias frequências.",
      403
    );
  }

  const matriculas = await prisma.enrollment.findMany({
    where: {
      student: {
        userId: user.id
      }
    },
    include: {
      schoolClass: {
        include: {
          discipline: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      },
      attendances: {
        orderBy: [
          { date: "desc" },
          { shift: "asc" },
          { lessonNumber: "asc" }
        ]
      }
    },
    orderBy: {
      enrolledAt: "desc"
    }
  });

  return matriculas.map((matricula) => ({
    enrollmentId: matricula.id,
    statusMatricula: matricula.status,
    turma: matricula.schoolClass.name,
    disciplina: matricula.schoolClass.discipline,
    totalFaltas: matricula.attendances.filter(
      (frequencia) => frequencia.status === "FALTA"
    ).length,
    frequencias: matricula.attendances
  }));
}