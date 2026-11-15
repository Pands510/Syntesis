import {
  createAssessment as createAssessmentService,
  listAssessments as listAssessmentsService,
  updateAssessment as updateAssessmentService,
  deleteAssessment as deleteAssessmentService,
  garantirAvaliacoesDaTurma
} from "../services/assessmentService.js";

// Cadastrar avaliação
export async function createAssessment(req, res, next) {
  try {
    const assessment = await createAssessmentService(
      req.body,
      req.user
    );

    return res.status(201).json({
      mensagem: "Avaliação cadastrada com sucesso.",
      avaliacao: assessment
    });
  } catch (error) {
    next(error);
  }
}

// Listar avaliações de uma turma
export async function listAssessments(req, res, next) {
  try {
    const { classId } = req.params;

    if (req.user.role === "PROFESSOR") {
      await garantirAvaliacoesDaTurma(classId, req.user);
    }

    const assessments = await listAssessmentsService(
      classId,
      req.user
    );

    return res.status(200).json({
      total: assessments.length,
      avaliacoes: assessments
    });
  } catch (error) {
    next(error);
  }
}

// Editar avaliação
export async function updateAssessment(req, res, next) {
  try {
    const { id } = req.params;

    const assessment = await updateAssessmentService(
      id,
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Avaliação atualizada com sucesso.",
      avaliacao: assessment
    });
  } catch (error) {
    next(error);
  }
}

// Excluir avaliação
export async function deleteAssessment(req, res, next) {
  try {
    const { id } = req.params;

    await deleteAssessmentService(id, req.user);

    return res.status(200).json({
      mensagem: "Avaliação excluída com sucesso."
    });
  } catch (error) {
    next(error);
  }
}
