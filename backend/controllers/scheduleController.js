
import {
  createScheduleEntry,
  listClassSchedule,
  getStudentSchedule,
  getProfessorSchedule,
  listAllSchedules,
  deleteScheduleEntry
} from "../services/scheduleService.js";

// Cadastrar horário
export async function registerScheduleEntry(req, res) {
  try {
    const entry = await createScheduleEntry(req.body);

    return res.status(201).json({
      mensagem: "Horário cadastrado com sucesso.",
      horario: entry
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao cadastrar horário."
    });
  }
}

// Listar horários de uma turma
export async function getClassSchedule(req, res) {
  try {
    const { classId } = req.params;

    const horarios = await listClassSchedule(
      classId,
      req.user
    );

    return res.status(200).json({
      quantidade: horarios.length,
      horarios
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao consultar horários."
    });
  }
}

// Consultar agenda do aluno autenticado
export async function getMySchedule(req, res) {
  try {
    const horarios = await getStudentSchedule(req.user.id);

    return res.status(200).json({
      quantidade: horarios.length,
      horarios
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao consultar sua agenda."
    });
  }
}

// Excluir horário
export async function removeScheduleEntry(req, res) {
  try {
    const { id } = req.params;

    await deleteScheduleEntry(id);

    return res.status(200).json({
      mensagem: "Horário excluído com sucesso."
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao excluir horário."
    });
  }
}

// Consultar quadro semanal completo do administrador
export async function getAllSchedules(req, res) {
  try {
    const horarios = await listAllSchedules();

    return res.status(200).json({
      quantidade: horarios.length,
      horarios
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao consultar o quadro de horários."
    });
  }
}


// Consultar agenda do professor autenticado
export async function getProfessorMySchedule(req, res) {
  try {
    const horarios = await getProfessorSchedule(req.user.id);

    return res.status(200).json({
      quantidade: horarios.length,
      horarios
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      mensagem: error.message || "Erro ao consultar sua agenda."
    });
  }
}