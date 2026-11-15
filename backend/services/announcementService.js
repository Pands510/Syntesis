import prisma from "../database/prisma.js";

const TARGET_TYPES = {
  TODOS: "TODOS",
  ALUNOS: "ALUNOS",
  CURSO: "CURSO",
  TODAS_TURMAS: "TODAS_TURMAS",
  TURMA: "TURMA",
  ALUNO: "ALUNO"
};

function criarErro(mensagem, statusCode) {
  const error = new Error(mensagem);
  error.statusCode = statusCode;
  return error;
}

function validarTexto(valor, campo) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw criarErro(`Informe ${campo}.`, 400);
  }

  return valor.trim();
}

async function obterProfessor(tx, userId) {
  const professor = await tx.professor.findUnique({
    where: { userId }
  });

  if (!professor) {
    throw criarErro("Perfil de professor não encontrado.", 404);
  }

  return professor;
}

async function obterDestinatarios(tx, user, targetType, data) {
  let userIds = [];

  if (user.role === "ADMIN") {
    if (
      ![
        TARGET_TYPES.TODOS,
        TARGET_TYPES.ALUNOS,
        TARGET_TYPES.CURSO
      ].includes(targetType)
    ) {
      throw criarErro(
        "Tipo de público inválido para administrador.",
        400
      );
    }

    if (targetType === TARGET_TYPES.TODOS) {
      const users = await tx.user.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true
        }
      });

      userIds = users.map(item => item.id);
    }

    if (targetType === TARGET_TYPES.ALUNOS) {
      const users = await tx.user.findMany({
        where: {
          role: "ALUNO",
          isActive: true,
          student: {
            is: {
              status: "ATIVO"
            }
          }
        },
        select: {
          id: true
        }
      });

      userIds = users.map(item => item.id);
    }

    if (targetType === TARGET_TYPES.CURSO) {
      if (!data.courseId) {
        throw criarErro("Selecione um curso.", 400);
      }

      const course = await tx.course.findUnique({
        where: { id: data.courseId }
      });

      if (!course || !course.isActive) {
        throw criarErro("Curso não encontrado ou inativo.", 404);
      }

      const users = await tx.user.findMany({
        where: {
          role: "ALUNO",
          isActive: true,
          student: {
            is: {
              courseId: data.courseId,
              status: "ATIVO"
            }
          }
        },
        select: {
          id: true
        }
      });

      userIds = users.map(item => item.id);
    }
  }

  if (user.role === "PROFESSOR") {
    const professor = await obterProfessor(tx, user.id);

    const classes = await tx.schoolClass.findMany({
      where: {
        professorId: professor.id
      },
      select: {
        id: true
      }
    });

    const classIds = classes.map(item => item.id);

    if (targetType === TARGET_TYPES.TODAS_TURMAS) {
      if (classIds.length === 0) {
        throw criarErro(
          "Você não possui turmas vinculadas.",
          409
        );
      }

      const enrollments = await tx.enrollment.findMany({
        where: {
          classId: {
            in: classIds
          },
          status: "ATIVA",
          student: {
            is: {
              status: "ATIVO",
              user: {
                is: {
                  isActive: true
                }
              }
            }
          }
        },
        select: {
          student: {
            select: {
              userId: true
            }
          }
        }
      });

      userIds = enrollments.map(
        item => item.student.userId
      );
    }

    if (targetType === TARGET_TYPES.TURMA) {
      if (!data.classId) {
        throw criarErro("Selecione uma turma.", 400);
      }

      if (!classIds.includes(data.classId)) {
        throw criarErro(
          "Você não possui permissão para essa turma.",
          403
        );
      }

      const enrollments = await tx.enrollment.findMany({
        where: {
          classId: data.classId,
          status: "ATIVA",
          student: {
            is: {
              status: "ATIVO",
              user: {
                is: {
                  isActive: true
                }
              }
            }
          }
        },
        select: {
          student: {
            select: {
              userId: true
            }
          }
        }
      });

      userIds = enrollments.map(
        item => item.student.userId
      );
    }

    if (targetType === TARGET_TYPES.ALUNO) {
      if (!data.studentId) {
        throw criarErro("Selecione um aluno.", 400);
      }

      const enrollment = await tx.enrollment.findFirst({
        where: {
          studentId: data.studentId,
          classId: {
            in: classIds
          },
          status: "ATIVA",
          student: {
            is: {
              status: "ATIVO",
              user: {
                is: {
                  isActive: true
                }
              }
            }
          }
        },
        include: {
          student: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!enrollment) {
        throw criarErro(
          "O aluno não possui matrícula ativa em uma de suas turmas.",
          403
        );
      }

      userIds = [enrollment.student.userId];
    }
  }

  if (!["ADMIN", "PROFESSOR"].includes(user.role)) {
    throw criarErro("Perfil sem permissão para publicar avisos.", 403);
  }

  return [...new Set(userIds)];
}

function montarDadosPublico(targetType, data) {
  return {
    targetType,
    courseId:
      targetType === TARGET_TYPES.CURSO
        ? data.courseId
        : null,
    classId:
      targetType === TARGET_TYPES.TURMA
        ? data.classId
        : null,
    studentId:
      targetType === TARGET_TYPES.ALUNO
        ? data.studentId
        : null
  };
}

export async function createAnnouncement(user, data) {
  const title = validarTexto(data.title, "o título");
  const content = validarTexto(data.content, "o conteúdo");
  const targetType = data.targetType;

  return prisma.$transaction(async tx => {
    const userIds = await obterDestinatarios(
      tx,
      user,
      targetType,
      data
    );

    const announcement = await tx.announcement.create({
      data: {
        authorId: user.id,
        title,
        content,
        ...montarDadosPublico(targetType, data),
        recipients: {
          create: userIds.map(userId => ({
            userId
          }))
        }
      },
      include: {
        _count: {
          select: {
            recipients: true
          }
        }
      }
    });

    return announcement;
  });
}

export async function listAuthoredAnnouncements(user) {
  const where = user.role === "ADMIN"
    ? {
        author: {
          role: "ADMIN"
        }
      }
    : {
        authorId: user.id
      };

  return prisma.announcement.findMany({
    where,
    include: {
      targetCourse: {
        select: {
          id: true,
          name: true
        }
      },
      targetClass: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      targetStudent: {
        select: {
          id: true,
          user: {
            select: {
              name: true
            }
          }
        }
      },
      _count: {
        select: {
          recipients: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    }
  });
}

export async function listReceivedAnnouncements(user, category) {
  if (user.role !== "ALUNO") {
    throw criarErro(
      "Somente alunos podem consultar comunicados recebidos.",
      403
    );
  }

  if (!["GERAL", "INDIVIDUAL"].includes(category)) {
    throw criarErro("Categoria de comunicado inválida.", 400);
  }

  const targetTypes = category === "INDIVIDUAL"
    ? [TARGET_TYPES.ALUNO]
    : [
        TARGET_TYPES.TODOS,
        TARGET_TYPES.ALUNOS,
        TARGET_TYPES.CURSO,
        TARGET_TYPES.TODAS_TURMAS,
        TARGET_TYPES.TURMA
      ];

  return prisma.announcement.findMany({
    where: {
      isActive: true,
      targetType: {
        in: targetTypes
      },
      recipients: {
        some: {
          userId: user.id
        }
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true
        }
      },
      recipients: {
        where: {
          userId: user.id
        },
        select: {
          readAt: true
        }
      }
    },
    orderBy: {
      publishedAt: "desc"
    }
  });
}

async function obterAnuncioEditavel(tx, id, user) {
  const announcement = await tx.announcement.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          role: true
        }
      }
    }
  });

  if (!announcement) {
    throw criarErro("Comunicado não encontrado.", 404);
  }

  const permitido =
    user.role === "ADMIN"
      ? announcement.author.role === "ADMIN"
      : user.role === "PROFESSOR" &&
        announcement.authorId === user.id;

  if (!permitido) {
    throw criarErro(
      "Você não possui permissão para alterar este comunicado.",
      403
    );
  }

  return announcement;
}

export async function updateAnnouncement(id, user, data) {
  return prisma.$transaction(async tx => {
    const current = await obterAnuncioEditavel(
      tx,
      id,
      user
    );

    const title = data.title !== undefined
      ? validarTexto(data.title, "o título")
      : current.title;

    const content = data.content !== undefined
      ? validarTexto(data.content, "o conteúdo")
      : current.content;

      const isActive = data.isActive !== undefined
          ? data.isActive
          : current.isActive;

        if (typeof isActive !== "boolean") {
          throw criarErro("O status do comunicado é inválido.", 400);
        }

    const targetChanged =
      data.targetType !== undefined ||
      data.courseId !== undefined ||
      data.classId !== undefined ||
      data.studentId !== undefined;

    let publicData = {
      targetType: current.targetType,
      courseId: current.courseId,
      classId: current.classId,
      studentId: current.studentId
    };

    if (targetChanged) {
      const targetType = data.targetType ?? current.targetType;

      const targetData = {
        courseId: data.courseId ?? current.courseId,
        classId: data.classId ?? current.classId,
        studentId: data.studentId ?? current.studentId
      };

      publicData = montarDadosPublico(
        targetType,
        targetData
      );

      const userIds = await obterDestinatarios(
        tx,
        user,
        targetType,
        publicData
      );

      const atuais = await tx.announcementRecipient.findMany({
        where: {
          announcementId: id
        },
        select: {
          userId: true
        }
      });

      const atuaisIds = atuais.map(item => item.userId);

      const remover = atuaisIds.filter(
        userId => !userIds.includes(userId)
      );

      const adicionar = userIds.filter(
        userId => !atuaisIds.includes(userId)
      );

      if (remover.length > 0) {
        await tx.announcementRecipient.deleteMany({
          where: {
            announcementId: id,
            userId: {
              in: remover
            }
          }
        });
      }

      if (adicionar.length > 0) {
        await tx.announcementRecipient.createMany({
          data: adicionar.map(userId => ({
            announcementId: id,
            userId
          })),
          skipDuplicates: true
        });
      }
    }

    return tx.announcement.update({
      where: { id },
      data: {
        title,
        content,
        isActive,
        ...publicData
      },
      include: {
        _count: {
          select: {
            recipients: true
          }
        }
      }
    });
  });
}



export async function deleteAnnouncement(id, user) {
  return prisma.$transaction(async tx => {
    await obterAnuncioEditavel(tx, id, user);

    return tx.announcement.delete({
      where: { id }
    });
  });
}

export async function markAnnouncementAsRead(id, user) {
  const recipient = await prisma.announcementRecipient.findFirst({
    where: {
      announcementId: id,
      userId: user.id
    }
  });

  if (!recipient) {
    throw criarErro(
      "Comunicado não encontrado para este usuário.",
      404
    );
  }

  if (recipient.readAt) {
    return recipient;
  }

  return prisma.announcementRecipient.update({
    where: {
      id: recipient.id
    },
    data: {
      readAt: new Date()
    }
  });
}