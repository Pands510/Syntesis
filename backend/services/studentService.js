//diante mão, já digo q não me responsabilizo por nenhuma desgraça q venha a cair por algo vindo dessa pasta
//qnd fiz isso, só eu e Deus sabia o que eu tava fazendo, hoje só Deus sabe

import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

export async function createStudent(data) {
  const {
    name,
    email,
    password,
    registrationNumber,
    courseId,
    semester
  } = data;

  // Verifica se o e-mail já está cadastrado.
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  // Verifica se a matrícula já está sendo utilizada.
  const existingStudent = await prisma.student.findUnique({
    where: { registrationNumber }
  });

  if (existingStudent) {
    const error = new Error("Esta matrícula já está cadastrada.");
    error.statusCode = 409;
    throw error;
  }

  // Verifica se o curso existe e está ativo.
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isActive: true
    }
  });

  if (!course) {
    const error = new Error("Curso não encontrado ou inativo.");
    error.statusCode = 404;
    throw error;
  }

  // Criptografa a senha.
  const passwordHash = await bcrypt.hash(password, 12);

  // Cria usuário, aluno e histórico de ingresso.
  const student = await prisma.$transaction(async (tx) => {
    return tx.user.create({
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
  });

  return student;
}


export async function updateStudent(studentId, data) {
  const {
    name,
    email,
    registrationNumber,
    semester,
    password
  } = data;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true
    }
  });

  if (!student) {
    const error = new Error("Aluno não encontrado.");
    error.statusCode = 404;
    throw error;
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
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
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
    const error = new Error("Esta matrícula já está cadastrada.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : undefined;

  return prisma.$transaction(async (tx) => {
    return tx.user.update({
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
  });
}

export async function updateStudentStatus(studentId, data) {
  const { status } = data;

  const statusPermitidos = ["ATIVO", "TRANCADO", "CONCLUIDO"];

  if (!statusPermitidos.includes(status)) {
    const error = new Error("Situação acadêmica inválida.");
    error.statusCode = 400;
    throw error;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) {
    const error = new Error("Aluno não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  if (student.status === status) {
    const error = new Error("O aluno já possui essa situação acadêmica.");
    error.statusCode = 409;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updatedStudent = await tx.student.update({
      where: { id: studentId },
      data: { status },
      select: {
        id: true,
        registrationNumber: true,
        course: true,
        courseId: true,
        semester: true,
        status: true
      }
    });

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

    return updatedStudent;
  });
}