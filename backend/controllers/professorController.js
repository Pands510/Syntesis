import {
  createProfessor,
  listProfessors,
  updateProfessor
} from "../services/professorService.js";

export async function registerProfessor(req, res) {
  try {
    const {
      name,
      email,
      password,
      employeeNumber,
      department,
      disciplineId
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        mensagem: "Nome, e-mail e senha são obrigatórios."
      });
    }

    if (
      typeof disciplineId !== "string" ||
      !disciplineId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Selecione uma disciplina para o professor."
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

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

    if (
      employeeNumber !== undefined &&
      employeeNumber !== null &&
      typeof employeeNumber !== "string"
    ) {
      return res.status(400).json({
        mensagem: "A matrícula deve ser um texto válido."
      });
    }

    if (
      department !== undefined &&
      department !== null &&
      typeof department !== "string"
    ) {
      return res.status(400).json({
        mensagem: "O departamento deve ser um texto válido."
      });
    }

    const professor = await createProfessor({
      name: normalizedName,
      email: normalizedEmail,
      password,
      employeeNumber: employeeNumber?.trim() || null,
      department: department?.trim() || null,
      disciplineId: disciplineId.trim()
    });

    return res.status(201).json({
      mensagem: "Professor cadastrado com sucesso!",
      usuario: professor
    });

  } catch (error) {
    console.error("Erro no cadastro de professor:", error);

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
      mensagem: "Erro interno ao cadastrar professor."
    });
  }
}

//listar professores
export async function getProfessors(req, res) {
  try {
    const professors = await listProfessors();

    return res.status(200).json({
      quantidade: professors.length,
      professores: professors
    });

  } catch (error) {
    console.error("Erro ao listar professores:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao listar professores."
    });
  }
}

export async function editProfessor(req, res) {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      employeeNumber,
      department,
      password,
      disciplineId
    } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !name.trim() ||
      !email.trim()
    ) {
      return res.status(400).json({
        mensagem: "Nome e e-mail são obrigatórios."
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        mensagem: "Informe um e-mail válido."
      });
    }

    if (
      typeof disciplineId !== "string" ||
      !disciplineId.trim()
    ) {
      return res.status(400).json({
        mensagem: "Selecione uma disciplina para o professor."
      });
    }
    //mais gambiarra
    if (
      password !== undefined &&
      password !== "" &&
      (typeof password !== "string" || password.length < 8)
    ) {
      return res.status(400).json({
        mensagem: "A nova senha deve possuir pelo menos 8 caracteres."
      });
    }

    if (
      employeeNumber !== undefined &&
      employeeNumber !== null &&
      typeof employeeNumber !== "string"
    ) {
      return res.status(400).json({
        mensagem: "A matrícula deve ser um texto válido."
      });
    }

    if (
      department !== undefined &&
      department !== null &&
      typeof department !== "string"
    ) {
      return res.status(400).json({
        mensagem: "O departamento deve ser um texto válido."
      });
    }

    const professor = await updateProfessor(id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      employeeNumber: employeeNumber?.trim() || null,
      department: department?.trim() || null,
      password: password || undefined,
      disciplineId: disciplineId.trim()
    });

    return res.status(200).json({
      mensagem: "Professor atualizado com sucesso!", //o fato de eu ter escrito "Professor updated com sucesso!" é preocupante
      professor
    });

  } catch (error) {
    console.error("Erro ao editar professor:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        mensagem: "O e-mail ou a matrícula funcional já está cadastrado."
      });
    }

    return res.status(500).json({
      mensagem: "Erro interno ao editar professor."
    });
  }
}