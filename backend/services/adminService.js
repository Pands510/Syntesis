//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";

export async function listUsers() {
  return prisma.user.findMany({
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
          status: true
        }
      },
      professor: {
        select: {
          employeeNumber: true,
          department: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function updateUserStatus(userId, isActive, adminId) {
  return prisma.$transaction(async (tx) => {

    // Bloqueio exclusivo para operações de alteração de status.
    // O bloqueio permanece ativo até o fim da transação.
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(20261031, 1) IS NULL AS locked
    `;

    // Consulta o usuário somente depois de adquirir o bloqueio.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      const error = new Error("Usuário não encontrado.");
      error.statusCode = 404;
      throw error;
    }

    // Impede a desativação da própria conta.
    if (user.id === adminId && !isActive) {
      const error = new Error(
        "Você não pode desativar sua própria conta."
      );
      error.statusCode = 400;
      throw error;
    }

    // Impede a desativação do último administrador ativo.
    if (user.role === "ADMIN" && !isActive && user.isActive) {
      const activeAdmins = await tx.user.count({
        where: {
          role: "ADMIN",
          isActive: true
        }
      });

      if (activeAdmins <= 1) {
        const error = new Error(
          "Não é possível desativar o último administrador ativo."
        );
        error.statusCode = 400;
        throw error;
      }
    }

    return tx.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });
  });
}

// Consulta os indicadores do painel administrativo
export async function getDashboardStats() {
  const [
    totalAlunos,
    totalProfessores,
    totalAdministradores,
    usuariosAtivos
  ] = await Promise.all([
    prisma.user.count({
      where: { role: "ALUNO" }
    }),
    prisma.user.count({
      where: { role: "PROFESSOR" }
    }),
    prisma.user.count({
      where: { role: "ADMIN" }
    }),
    prisma.user.count({
      where: { isActive: true }
    })
  ]);

  return {
    totalAlunos,
    totalProfessores,
    totalAdministradores,
    usuariosAtivos
  };
}


export async function listStudents() {
  return prisma.student.findMany({
    select: {
      id: true,
      registrationNumber: true,
      semester: true,
      status: true,

      academicCourse: {
        select: {
          id: true,
          name: true,
          code: true,
          totalSemesters: true,
          isActive: true
        }
      },

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        }
      }
    },

    orderBy: {
      user: {
        name: "asc"
      }
    }
  });
}