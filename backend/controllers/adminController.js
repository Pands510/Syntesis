
import {
  listUsers,
  updateUserStatus,
  getDashboardStats
} from "../services/adminService.js";

//listando geral do banco
export async function getUsers(req, res) {
  try {
    const users = await listUsers();

    return res.status(200).json({
      quantidade: users.length,
      usuarios: users
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return res.status(500).json({
      mensagem: "Erro ao consultar usuários."
    });
  }
}

//basicamente uma função pra banir
export async function changeUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        mensagem: "Informe isActive como true ou false."
      });
    }

    const user = await updateUserStatus(
      id,
      isActive,
      req.user.id
    );

    return res.status(200).json({
      mensagem: isActive
        ? "Usuário ativado com sucesso."
        : "Usuário desativado com sucesso.",
      usuario: user
    });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        mensagem: error.message
      });
    }

    return res.status(500).json({
      mensagem: "Erro ao atualizar o usuário."
    });
  }
}

//retorna os indicadores do painel administrativo
export async function getStats(req, res) {
  try {
    const estatisticas = await getDashboardStats();

    return res.status(200).json({
      estatisticas
    });
  } catch (error) {
    console.error("Erro ao consultar estatísticas:", error);

    return res.status(500).json({
      mensagem: "Erro ao consultar as estatísticas do painel."
    });
  }
}
