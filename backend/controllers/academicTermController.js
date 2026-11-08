
import {
  createAcademicTerm,
  listAcademicTerms,
  getAcademicTerm,
  updateAcademicTerm,
  startAcademicTerm,
  closeAcademicTerm,
  deleteAcademicTerm,
  previewAcademicTermProgression
} from "../services/academicTermService.js";

export async function registerAcademicTerm(req, res, next) {
  try {
    const term = await createAcademicTerm(req.body);

    return res.status(201).json({
      mensagem: "Período letivo cadastrado com sucesso.",
      periodo: term
    });
  } catch (error) {
    next(error);
  }
}

export async function getAcademicTerms(req, res, next) {
  try {
    const terms = await listAcademicTerms();

    return res.status(200).json({
      quantidade: terms.length,
      periodos: terms
    });
  } catch (error) {
    next(error);
  }
}

export async function getAcademicTermById(req, res, next) {
  try {
    const term = await getAcademicTerm(req.params.id);

    return res.status(200).json({
      periodo: term
    });
  } catch (error) {
    next(error);
  }
}

export async function editAcademicTerm(req, res, next) {
  try {
    const term = await updateAcademicTerm(req.params.id, req.body);

    return res.status(200).json({
      mensagem: "Período letivo atualizado com sucesso.",
      periodo: term
    });
  } catch (error) {
    next(error);
  }
}

export async function activateAcademicTerm(req, res, next) {
  try {
    const term = await startAcademicTerm(req.params.id);

    return res.status(200).json({
      mensagem: "Período letivo iniciado com sucesso.",
      periodo: term
    });
  } catch (error) {
    next(error);
  }
}

export async function finishAcademicTerm(req, res, next) {
  try {
    const resultado = await closeAcademicTerm(req.params.id);

    return res.status(200).json({
      mensagem:
        "Período letivo encerrado e progressão curricular processada com sucesso.",
      periodo: resultado.periodo,
      relatorio: resultado.relatorio
    });
  } catch (error) {
    next(error);
  }
}

export async function removeAcademicTerm(req, res, next) {
  try {
    await deleteAcademicTerm(req.params.id);

    return res.status(200).json({
      mensagem: "Período letivo excluído com sucesso."
    });
  } catch (error) {
    next(error);
  }
}

export async function previewAcademicTerm(req, res, next) {
  try {
    const resultado = await previewAcademicTermProgression(
      req.params.id
    );

    return res.status(200).json({
      mensagem:
        "Prévia da progressão curricular gerada com sucesso. Nenhuma alteração foi realizada.",
      periodo: resultado.periodo,
      relatorio: resultado.relatorio
    });
  } catch (error) {
    next(error);
  }
}
