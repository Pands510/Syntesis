
import { useEffect, useState } from "react";

import {
  GraduationCap,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  UserPlus
} from "lucide-react";

import api from "../../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function buscarEstatisticas() {
      try {
        const resposta = await api.get("/api/admin/stats");

        setEstatisticas(resposta.data.estatisticas);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar os indicadores."
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarEstatisticas();
  }, []);

  const indicadores = [
    {
      titulo: "Total de alunos",
      valor: estatisticas?.totalAlunos,
      descricao: "Alunos cadastrados",
      icone: GraduationCap,
      cor: "azul"
    },
    {
      titulo: "Professores",
      valor: estatisticas?.totalProfessores,
      descricao: "Professores cadastrados",
      icone: Users,
      cor: "verde"
    },
    {
      titulo: "Administradores",
      valor: estatisticas?.totalAdministradores,
      descricao: "Contas administrativas",
      icone: ShieldCheck,
      cor: "roxo"
    },
    {
      titulo: "Usuários ativos",
      valor: estatisticas?.usuariosAtivos,
      descricao: "Contas em funcionamento",
      icone: Activity,
      cor: "laranja"
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <h2>Visão geral</h2>
          <p>
            Acompanhe as principais informações do sistema acadêmico.
          </p>
        </div>

        <div className="dashboard-date">
          Painel de controle
        </div>
      </div>

      {erro && (
        <div className="dashboard-error" role="alert">
          {erro}
        </div>
      )}

      <div className="dashboard-cards">
        {indicadores.map((item) => {
          const Icone = item.icone;

          return (
            <article className="dashboard-card" key={item.titulo}>
              <div className="dashboard-card-top">
                <div className={`dashboard-card-icon ${item.cor}`}>
                  <Icone size={23} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="dashboard-card-arrow"
                />
              </div>

              <div className="dashboard-card-info">
                <span>{item.titulo}</span>

                <strong>
                  {carregando
                    ? "..."
                    : estatisticas
                      ? item.valor
                      : "--"}
                </strong>

                <small>{item.descricao}</small>
              </div>
            </article>
          );
        })}
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h3>Bem-vindo ao Syntesis</h3>
            <p>Sistema de gerenciamento acadêmico.</p>
          </div>
        </div>

        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">
            <UserPlus size={30} />
          </div>

          <h3>Gerencie sua instituição</h3>

          <p>
            Utilize o menu lateral para cadastrar professores,
            consultar usuários e administrar os acessos ao sistema.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
