import {
  createStudent,
  updateStudent,
  updateStudentStatus
} from "../services/studentService.js";

export async function registerStudent(req, res) {
  try {
    const {
      name,
      email,
      password,
      registrationNumber,
      courseId,
      semester
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof registrationNumber !== "string" ||
      typeof courseId !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password ||
      !registrationNumber.trim() ||
      !courseId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatórios."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRegistration = registrationNumber.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        mensagem: "Informe um e-mail válido."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 8 caracteres."
      });
    }

    if (!Number.isInteger(semester) || semester < 1) {
      return res.status(400).json({
        mensagem: "Informe um semestre válido."
      });
    }

    const student = await createStudent({
      name: normalizedName,
      email: normalizedEmail,
      password,
      registrationNumber: normalizedRegistration,
      courseId: courseId.trim(),
      semester
    });

    return res.status(201).json({
      mensagem: "Aluno cadastrado com sucesso!",
      usuario: student
    });

  } catch (error) {
    console.error("Erro no cadastro de aluno:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        mensagem: "O e-mail ou a matrícula informada já está cadastrado."
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao cadastrar aluno."
    });
  }
}

export async function editStudent(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      registrationNumber,
      semester,
      password
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof registrationNumber !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !registrationNumber.trim()
    ) {
      return res.status(400).json({
        mensagem: "Preencha todos os campos obrigatórios."
      });
    }

    if (!Number.isInteger(semester) || semester < 1) {
      return res.status(400).json({
        mensagem: "Informe um semestre válido."
      });
    }

    if (password !== undefined && password !== "" &&
        (typeof password !== "string" || password.length < 8)) {
      return res.status(400).json({
        mensagem: "A senha deve possuir pelo menos 8 caracteres."
      });
    }

    const student = await updateStudent(id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      registrationNumber: registrationNumber.trim(),
      semester,
      password: password || undefined
    });

    return res.status(200).json({
      mensagem: "Cadastro do aluno atualizado com sucesso!",
      usuario: student
    });

  } catch (error) {
    console.error("Erro ao editar aluno:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        mensagem: "O e-mail ou a matrícula informada já está cadastrado."
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao editar aluno."
    });
  }
}

export async function changeStudentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const student = await updateStudentStatus(id, { status });

    return res.status(200).json({
      mensagem: "Situação acadêmica atualizada com sucesso!", //literalmente eu trancando o curso
      aluno: student
    });

  } catch (error) {
    console.error("Erro ao alterar situação acadêmica:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao alterar situação acadêmica."
    });
  }
}