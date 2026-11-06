import {
  createCourse,
  linkStudentToCourse,
  listCourses,
  updateCourse as updateCourseService,
  deleteCourse as deleteCourseService
} from "../services/courseService.js";

export async function getCourses(req, res) {
  try {
    const courses = await listCourses();

    return res.status(200).json({
      quantidade: courses.length,
      cursos: courses
    });

  } catch (error) {
    console.error("Erro ao listar cursos:", error);
    //q o service esteja certo, amém
    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao listar cursos."
    });
  }
}

export async function registerCourse(req, res) {
  try {
    const { name, code, description, mainShift } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        mensagem: "O nome do curso é obrigatório."
      });
    }
    //tava com sono o suficiente pra lembrar, oq importa é que tá funcionando(eu acho)
    const course = await createCourse({
      name: name.trim(),
      code: code?.trim() || null,
      description: description?.trim() || null,
      mainShift: mainShift || null
    });

    return res.status(201).json({
      mensagem: "Curso cadastrado com sucesso!",
      curso: course
    });

  } catch (error) {
    console.error("Erro ao cadastrar curso:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao cadastrar curso."
    });
  }
}

export async function enrollStudentInCourse(req, res) {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        mensagem: "O ID do aluno e o ID do curso são obrigatórios."
      });
    }

    const student = await linkStudentToCourse(studentId, courseId);

    return res.status(200).json({
      mensagem: "Aluno vinculado ao curso com sucesso!",
      aluno: student//retorna o aluno modificado
    });

  } catch (error) {
    console.error("Erro ao vincular aluno ao curso:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao vincular aluno ao curso."
    });
  }
}

export async function updateCourse(req, res) {
  try {
    const { id } = req.params;
    const { name, code, description, mainShift } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        mensagem: "O nome do curso é obrigatório."
      });
    }

    const course = await updateCourseService(id, {
      name: name.trim(),
      code: code?.trim() || null,
      description: description?.trim() || null,
      mainShift: mainShift || null
    });

    return res.status(200).json({
      mensagem: "Curso atualizado com sucesso!",
      curso: course
    });

  } catch (error) {
    console.error("Erro ao atualizar curso:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao atualizar curso."
    });
  }
}

export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    await deleteCourseService(id);

    return res.status(200).json({
      mensagem: "Curso excluído com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao excluir curso:", error);

    return res.status(error.statusCode || 500).json({
      mensagem: error.statusCode
        ? error.message
        : "Erro interno ao excluir curso."
    });
  }
}