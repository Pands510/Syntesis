import {
  createDiscipline,
  listDisciplines,
  updateDiscipline,
  deleteDiscipline
} from "../services/disciplineService.js";

export async function registerDiscipline(req, res) {
  try {
    const {
      name,
      code,
      workloadHours,
      courseId,
      semester
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        mensagem: "O nome da disciplina é obrigatório."
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        mensagem: "O código da disciplina é obrigatório."
      });
    }

    if (!Number.isInteger(workloadHours) || workloadHours <= 0) {
      return res.status(400).json({
        mensagem: "A carga horária deve ser um número inteiro positivo."
      });
    }

    if (!Number.isInteger(semester) || semester <= 0) {
      return res.status(400).json({
        mensagem: "O semestre deve ser um número inteiro positivo."
      });
    }

    if (!courseId) {
      return res.status(400).json({
        mensagem: "O ID do curso é obrigatório."
      });
    }

    const discipline = await createDiscipline({
      name: name.trim(),
      code: code.trim(),
      workloadHours,
      courseId,
      semester
    });

    return res.status(201).json({
      mensagem: "Disciplina cadastrada com sucesso!",
      disciplina: discipline
    });

  } catch (error) {
    console.error("Erro ao cadastrar disciplina:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao cadastrar disciplina."
    });
  }
}

export async function getDisciplines(req, res) {
  try {
    const { courseId, semester } = req.query;

    let semestreNumerico;

    if (semester !== undefined) {
      semestreNumerico = Number(semester);

      if (
        !Number.isInteger(semestreNumerico) ||
        semestreNumerico <= 0
      ) {
        return res.status(400).json({
          mensagem: "Informe um semestre válido."
        });
      }
    }

    const disciplines = await listDisciplines({
      courseId,
      semester: semestreNumerico
    });

    return res.status(200).json({
      quantidade: disciplines.length,
      disciplinas: disciplines
    });

  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);

    return res.status(500).json({
      mensagem: "Erro interno ao listar disciplinas."
    });
  }
}

export async function editDiscipline(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      workloadHours,
      courseId,
      semester
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        mensagem: "O nome da disciplina é obrigatório."
      });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({
        mensagem: "O código da disciplina é obrigatório."
      });
    }

    if (!Number.isInteger(workloadHours) || workloadHours <= 0) {
      return res.status(400).json({
        mensagem: "A carga horária deve ser um número inteiro positivo."
      });
    }

    if (!Number.isInteger(semester) || semester <= 0) {
      return res.status(400).json({
        mensagem: "O semestre deve ser um número inteiro positivo."
      });
    }

    if (!courseId) {
      return res.status(400).json({
        mensagem: "O curso é obrigatório."
      });
    }

    const discipline = await updateDiscipline(id, {
      name: name.trim(),
      code: code.trim(),
      workloadHours,
      courseId,
      semester
    });

    return res.status(200).json({
      mensagem: "Disciplina atualizada com sucesso!",
      disciplina: discipline
    });

  } catch (error) {
    console.error("Erro ao editar disciplina:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao editar disciplina."
    });
  }
}

export async function removeDiscipline(req, res) {
  try {
    const { id } = req.params;

    await deleteDiscipline(id);

    return res.status(200).json({
      mensagem: "Disciplina excluída com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao excluir disciplina:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao excluir disciplina."
    });
  }
}