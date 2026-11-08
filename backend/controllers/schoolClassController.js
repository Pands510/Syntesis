
import {
  createSchoolClass,
  listSchoolClasses
} from "../services/schoolClassService.js";

// Cadastrar turma.
export async function registerSchoolClass(req, res) {
  try {
    const {
      name,
      code,
      academicYear,
      term,
      disciplineId,
      professorId
    } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        mensagem: "O nome da turma é obrigatório."
      });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        mensagem: "O código da turma é obrigatório."
      });
    }

    if (
      !Number.isInteger(academicYear) ||
      academicYear < 2000
    ) {
      return res.status(400).json({
        mensagem: "Informe um ano letivo válido."
      });
    }

    if (
      !Number.isInteger(term) ||
      term < 1
    ) {
      return res.status(400).json({
        mensagem: "Informe um período letivo válido."
      });
    }

    if (!disciplineId || typeof disciplineId !== "string") {
      return res.status(400).json({
        mensagem: "A disciplina é obrigatória."
      });
    }

    if (!professorId || typeof professorId !== "string") {
      return res.status(400).json({
        mensagem: "O professor é obrigatório."
      });
    }

    const schoolClass = await createSchoolClass({
      name: name.trim(),
      code: code.trim(),
      academicYear,
      term,
      disciplineId,
      professorId
    });

    return res.status(201).json({
      mensagem: "Turma cadastrada com sucesso.",
      matriculasCriadas: schoolClass.matriculasCriadas,
      turma: schoolClass
    });

  } catch (error) {
    console.error("Erro ao cadastrar turma:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao cadastrar turma."
    });
  }
}

// Listar turmas conforme o perfil do usuário autenticado.
export async function getSchoolClasses(req, res) {
  try {
    const classes = await listSchoolClasses(req.user);

    return res.status(200).json({
      quantidade: classes.length,
      turmas: classes
    });

  } catch (error) {
    console.error("Erro ao listar turmas:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao listar turmas."
    });
  }
}
