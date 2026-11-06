
import {
  createAcademicTerm,
  listAcademicTerms,
  getAcademicTerm,
  updateAcademicTerm,
  startAcademicTerm,
  closeAcademicTerm,
  deleteAcademicTerm
} from "../services/academicTermService.js";

export async function registerAcademicTerm(req, res, next) {
  try {
    //confiando cegamente que o req.body não vai quebrar o banco de dados(de novo)
    const term = await createAcademicTerm(req.body);

    return res.status(201).json({
      mensagem: "Período letivo cadastrado com sucesso.",
      periodo: term
    });
  } catch (error) {
    next(error);
  }
}

//busca simples, se puxar coisa pra krlh, finge demencia
export async function getAcademicTerms(req, res, next) {
  try {
    const terms = await listAcademicTerms();

    return res.status(200).json({
      quantidade: terms.length, //passar o tamanho do estrago no front
      periodos: terms
    });
  } catch (error) {
    next(error);
  }
}

//procurando um período específico
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

//literalmente um tampa buraco, algum dia mudo isso(se Deus quiser)
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

//inicio de semestre
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

//fim de semestre
export async function finishAcademicTerm(req, res, next) {
  try {
    const term = await closeAcademicTerm(req.params.id);

    return res.status(200).json({
      mensagem: "Período letivo encerrado com sucesso.",
      periodo: term
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
