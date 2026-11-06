import {
  createGrade as createGradeService,
  createGradesBatch as createGradesBatchService,
  createFinalExamGradesBatch as createFinalExamGradesBatchService,
  listGrades as listGradesService,
  updateGrade as updateGradeService,
  getStudentReport as getStudentReportService
} from "../services/gradeService.js";

//lançar nota individual
export async function createGrade(req, res, next) {
  try {
    const grade = await createGradeService(
      req.body,
      req.user
    );

    return res.status(201).json({
      mensagem: "Nota lançada com sucesso.",
      nota: grade
    });
  } catch (error) {
    next(error);
  }
}

//lançar várias notas em lote
//não julgue minha gambiarra
export async function createGradesBatch(req, res, next) {
  try {
    const result = await createGradesBatchService(
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Notas processadas com sucesso.",
      ...result
    });
  } catch (error) {
    next(error);
  }
}

//lançar ou atualizar notas da prova final em lote
export async function createFinalExamGradesBatch(req, res, next) {
  try {
    const result = await createFinalExamGradesBatchService(
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Notas da prova final processadas com sucesso.",
      ...result
    });
  } catch (error) {
    next(error);
  }
}

//listar notas de uma turma
export async function listGrades(req, res, next) {
  try {
    const { classId } = req.params;

    const grades = await listGradesService(
      classId,
      req.user
    );

    return res.status(200).json({
      total: grades.length,
      notas: grades
    });
  } catch (error) {
    next(error);
  }
}

//atualizar nota individual
export async function updateGrade(req, res, next) {
  try {
    const { id } = req.params;

    const grade = await updateGradeService(
      id,
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Nota atualizada com sucesso.",
      nota: grade
    });
  } catch (error) {
    next(error);
  }
}

//consultar boletim do aluno
export async function getStudentReport(req, res, next) {
  try {
    const boletim = await getStudentReportService(req.user);

    return res.status(200).json({
      total: boletim.length, //papo de qrr trancar o curso
      boletim
    });
  } catch (error) {
    next(error);
  }
}