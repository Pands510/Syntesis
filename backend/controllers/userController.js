import {
  createStudent,
  getStudentProfile,
  getMyEnrollments
} from "../services/userService.js";

export async function registerStudent(req, res) {
  try {
    const {
      name,
      email,
      password,
      registrationNumber,
      course,
      semester
    } = req.body;

    // Validação dos campos obrigatórios
    if (!name || !email || !password) {
      return res.status(400).json({
        mensagem: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string") {
      return res.status(400).json({
        mensagem: "Os dados enviados possuem formato inválido."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 8 caracteres."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        mensagem: "Informe um nome e um e-mail válidos."
      });
    }

    let parsedSemester = null;
    //no outro arquivo o semestre era obrigatório.aqui ele aceita vazio e vira null. 
    //aluno de shrodinger
    if (semester !== undefined && semester !== null && semester !== "") {
      parsedSemester = Number(semester);

      if (!Number.isInteger(parsedSemester) || parsedSemester < 1) {
        return res.status(400).json({
          mensagem: "O semestre deve ser um número inteiro positivo."
        });
      }
    }

    const student = await createStudent({
      name: normalizedName,
      email: normalizedEmail,
      password,
      registrationNumber: registrationNumber?.trim() || null,
      course: course?.trim() || null,
      semester: parsedSemester
    });

    return res.status(201).json({
      mensagem: "Aluno cadastrado com sucesso!",
      usuario: student
    });

  } catch (error) {
    console.error("Erro no cadastro:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        mensagem: "Um dos dados informados já está cadastrado."
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar aluno."
    });
  }
}

export async function getMyStudentProfile(req, res) {
  try {
    const student = await getStudentProfile(req.user.id);

    if (!student) {
      return res.status(404).json({
        mensagem: "Perfil acadêmico não encontrado."
      });
    }

    return res.status(200).json({
      mensagem: "Perfil acadêmico encontrado com sucesso!",
      aluno: student
    });

  } catch (error) {
    console.error("Erro ao consultar perfil do aluno:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao consultar perfil acadêmico."
    });
  }
}

// Consultar matrículas do próprio aluno autenticado
export async function getMyStudentEnrollments(req, res) {
  try {
    const enrollments = await getMyEnrollments(req.user.id);

    return res.status(200).json({
      mensagem: "Matrículas consultadas com sucesso!",
      quantidade: enrollments.length,
      matriculas: enrollments
    });

  } catch (error) {
    console.error("Erro ao consultar matrículas do aluno:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao consultar matrículas."
    });
  }
}