//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

export async function createProfessor(data) {
  const {
    name,
    email,
    password,
    employeeNumber,
    department,
    disciplineId
  } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!disciplineId) {
    const error = new Error("Selecione uma disciplina para o professor.");
    error.statusCode = 400;
    throw error;
  }

  const discipline = await prisma.discipline.findUnique({
    where: { id: disciplineId }
  });

  if (!discipline || !discipline.isActive) {
    const error = new Error("Disciplina não encontrada ou inativa.");
    error.statusCode = 400;
    throw error;
  }

  if (existingUser) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const professor = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "PROFESSOR",
      professor: {
        create: {
          employeeNumber: employeeNumber || null,
          department: department || null,
          discipline: {
            connect: {
              id: disciplineId
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
      createdAt: true,
      professor: {
        select: {
          employeeNumber: true,
          department: true,
          discipline: {
            select: {
              id: true,
              name: true,
              code: true,
              course: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });
  return professor;
}

export async function listProfessors() {
  return prisma.professor.findMany({
    where: {
      user: {
        role: "PROFESSOR"
      }
    },
    select: {
      id: true,
      employeeNumber: true,
      department: true,
      discipline: {
        select: {
          id: true,
          name: true,
          code: true,
          course: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
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

export async function updateProfessor(professorId, data) {
  const {
    name,
    email,
    employeeNumber,
    department,
    password,
    disciplineId
  } = data;

  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    include: {
      user: true
    }
  });

  if (!professor) {
    const error = new Error("Professor não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  const existingEmail = await prisma.user.findFirst({
    where: {
      email,
      id: { not: professor.userId }
    }
  });

  if (existingEmail) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  if (employeeNumber) {
    const existingNumber = await prisma.professor.findFirst({
      where: {
        employeeNumber,
        id: { not: professorId }
      }
    });

    if (!disciplineId) {
      const error = new Error("Selecione uma disciplina para o professor.");
      error.statusCode = 400;
      throw error;
    }

    const discipline = await prisma.discipline.findUnique({
      where: { id: disciplineId }
    });

    if (!discipline || !discipline.isActive) {
      const error = new Error("Disciplina não encontrada ou inativa.");
      error.statusCode = 400;
      throw error;
    }

    if (existingNumber) {
      const error = new Error("Esta matrícula funcional já está cadastrada.");
      error.statusCode = 409;
      throw error;
    }
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : undefined;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: professor.userId },
      data: {
        name,
        email,
        ...(passwordHash && { passwordHash })
      }
    });

    return tx.professor.update({
      where: { id: professorId },
      data: {
        employeeNumber: employeeNumber || null,
        department: department || null,
        discipline: {
          connect: {
            id: disciplineId
          }
        }
      },
      select: {
        id: true,
        employeeNumber: true,
        department: true,
        discipline: {
          select: {
            id: true,
            name: true,
            code: true,
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    });
    });
    }