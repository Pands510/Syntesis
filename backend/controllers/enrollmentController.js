
import {
  createEnrollment,
  listEnrollments,
  updateEnrollmentStatus
} from "../services/enrollmentService.js";

//matricular aluno em uma turma
export async function registerEnrollment(req, res) {
  try {
    const { studentId, classId } = req.body;

    if (!studentId || typeof studentId !== "string") {
      return res.status(400).json({
        mensagem: "O aluno é obrigatório."
      });
    }

    if (!classId || typeof classId !== "string") {
      return res.status(400).json({
        mensagem: "A turma é obrigatória."
      });
    }

    const enrollment = await createEnrollment({
      studentId,
      classId
    });

    return res.status(201).json({
      mensagem: "Aluno matriculado com sucesso.",
      matricula: enrollment
    });
  } catch (error) {
    console.error("Erro ao matricular aluno:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao realizar matrícula."
    });
  }
}

//listar matrículas conforme o perfil do usuário
export async function getEnrollments(req, res) {
  try {
    //francamente, tudo envolvendo service eu to jogando pra Deus
    const enrollments = await listEnrollments(req.user);

    return res.status(200).json({
      quantidade: enrollments.length,
      matriculas: enrollments
    });
  } catch (error) {
    console.error("Erro ao listar matrículas:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao listar matrículas."
    });
  }
}

//alterar status de uma matrícula
export async function changeEnrollmentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        mensagem: "O status da matrícula é obrigatório."
      });
    }

    const enrollment = await updateEnrollmentStatus(id, status);

    return res.status(200).json({
      mensagem: "Status da matrícula atualizado com sucesso.",
      matricula: enrollment
    });
  } catch (error) {
    console.error("Erro ao atualizar matrícula:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao atualizar matrícula."
    });
  }
}
