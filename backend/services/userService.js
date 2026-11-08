import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

export async function createStudent(data) {
  const {
    name,
    email,
    password,
    registrationNumber,
    course,
    semester
  } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ALUNO",

      student: {
        create: {
          registrationNumber: registrationNumber || null,
          course: course || null,
          semester: semester ?? null
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      student: {
        select: {
          registrationNumber: true,
          course: true,
          semester: true
        }
      }
    }
  });

  return student;
}

// Consulta os dados acadêmicos do aluno autenticado

export async function getStudentProfile(userId) {
  return prisma.student.findUnique({
    where: {
      userId
    },
    select: {
      id: true,
      registrationNumber: true,
      semester: true,
      status: true,

      academicCourse: {
        select: {
          name: true,
          code: true
        }
      },

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }
    }
  });
}


// Consultar somente as matrículas do aluno autenticado
export async function getMyEnrollments(userId) {
  const student = await prisma.student.findUnique({
    where: {
      userId
    },
    select: {
      id: true
    }
  });

  if (!student) {
    const error = new Error("Perfil acadêmico não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return prisma.enrollment.findMany({
    where: {
      studentId: student.id
    },
    select: {
      id: true,
      status: true,
      enrolledAt: true,

      schoolClass: {
        select: {
          id: true,
          name: true,
          code: true,
          academicYear: true,
          term: true,
          semester: true,

          discipline: {
            select: {
              name: true,
              code: true,
              workloadHours: true,

              course: {
                select: {
                  name: true
                }
              }
            }
          },

          professor: {
            select: {
              department: true,

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
}import prisma from "../database/prisma.js";
import bcrypt from "bcryptjs";

export async function createStudent(data) {
  const {
    name,
    email,
    password,
    registrationNumber,
    course,
    semester
  } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error("Este e-mail já está cadastrado.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const student = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ALUNO",

      student: {
        create: {
          registrationNumber: registrationNumber || null,
          course: course || null,
          semester: semester ?? null
        }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      student: {
        select: {
          registrationNumber: true,
          course: true,
          semester: true
        }
      }
    }
  });

  return student;
}

// Consulta os dados acadêmicos do aluno autenticado

export async function getStudentProfile(userId) {
  return prisma.student.findUnique({
    where: {
      userId
    },
    select: {
      id: true,
      registrationNumber: true,
      semester: true,
      status: true,

      academicCourse: {
        select: {
          name: true,
          code: true
        }
      },

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }
    }
  });
}


// Consultar somente as matrículas do aluno autenticado
export async function getMyEnrollments(userId) {
  const student = await prisma.student.findUnique({
    where: {
      userId
    },
    select: {
      id: true
    }
  });

  if (!student) {
    const error = new Error("Perfil acadêmico não encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return prisma.enrollment.findMany({
    where: {
      studentId: student.id
    },
    select: {
      id: true,
      status: true,
      enrolledAt: true,

      schoolClass: {
        select: {
          id: true,
          name: true,
          code: true,
          academicYear: true,
          term: true,
          semester: true,

          discipline: {
            select: {
              name: true,
              code: true,
              workloadHours: true,

              course: {
                select: {
                  name: true
                }
              }
            }
          },

          professor: {
            select: {
              department: true,

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