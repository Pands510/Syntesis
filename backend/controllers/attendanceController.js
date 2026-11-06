
import {
  listAttendanceDates as listAttendanceDatesService,
  listAttendanceByDate as listAttendanceByDateService,
  registerAttendance as registerAttendanceService,
  registerAttendanceBatch as registerAttendanceBatchService,
  countStudentAbsences as countStudentAbsencesService,
  listMyAttendance as listMyAttendanceService
} from "../services/attendanceService.js";

//consultar calendário de aulas
export async function listAttendanceDates(req, res, next) {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query; //na minha máquina funciona, só Deus sabe se qnd publicar tbm vai

    const result = await listAttendanceDatesService(
      classId,
      startDate,
      endDate,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

//consultar alunos e frequência de uma data
export async function listAttendanceByDate(req, res, next) {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const result = await listAttendanceByDateService(
      classId,
      date,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

//registrar frequência individual
export async function registerAttendance(req, res, next) {
  try {
    const result = await registerAttendanceService(
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Frequência registrada com sucesso.",
      frequencia: result
    });
  } catch (error) {
    next(error);
  }
}

//registrar frequência em lote
export async function registerAttendanceBatch(req, res, next) {
  try {
    const result = await registerAttendanceBatchService(
      req.body,
      req.user
    );

    return res.status(200).json({
      mensagem: "Frequências processadas com sucesso.",
      ...result
    });
  } catch (error) {
    next(error);
  }
}

//consultar total de faltas
export async function countStudentAbsences(req, res, next) {
  try {
    const { enrollmentId } = req.params;

    const total = await countStudentAbsencesService(
      enrollmentId
    );

    return res.status(200).json({
      enrollmentId,
      totalFaltas: total
    });
  } catch (error) {
    next(error);
  }
}

//consultar frequências do aluno autenticado
export async function listMyAttendance(req, res, next) {
  try {
    const result = await listMyAttendanceService(req.user);

    return res.status(200).json({
      total: result.length,
      matriculas: result
    });
  } catch (error) {
    next(error);
  }
}