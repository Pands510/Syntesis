import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardCheck,
  ArrowRight,
  CalendarDays,
  AlertCircle
} from "lucide-react";

import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import "./ProfessorDashboard.css";

function ProfessorDashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarTurmas() {
      try {
        setErro("");

        const resposta = await api.get("/api/school-classes");

        setTurmas(resposta.data.turmas || []);
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar suas turmas."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarTurmas();
  }, []);

  const totalDisciplinas = new Set(
    turmas.map((turma) => turma.discipline?.id).filter(Boolean)
  ).size;

  const totalAlunos = turmas.reduce(
    (total, turma) => total + (turma.enrollments?.length || 0),
    0
  );

  const indicadores = [
    {
      titulo: "Minhas turmas",
      valor: turmas.length,
      icone: BookOpen,
      cor: "azul"
    },
    {
      titulo: "Disciplinas",
      valor: totalDisciplinas,
      icone: GraduationCap,
      cor: "roxo"
    },
    {
      titulo: "Alunos matriculados",
      valor: totalAlunos,
      icone: Users,
      cor: "verde"
    }
  ];

  return (
    <div className="professor-dashboard">
      <section className="professor-welcome">
        <div>
          <span>ÁREA DO PROFESSOR</span>

          <h2>
            Olá, {usuario?.name?.split(" ")[0] || "Professor"}!
          </h2>

          <p>
            Acompanhe suas turmas, disciplinas e atividades acadêmicas.
          </p>
        </div>

        <div className="professor-welcome-icon">
          <GraduationCap size={65} />
        </div>
      </section>

      {erro && (
        <div className="professor-error">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      <section className="professor-indicators">
        {indicadores.map((item) => {
          const Icone = item.icone;

          return (
            <article className="professor-indicator-card" key={item.titulo}>
              <div className={`professor-indicator-icon ${item.cor}`}>
                <Icone size={23} />
              </div>

              <div>
                <span>{item.titulo}</span>

                <strong>
                  {carregando ? "..." : item.valor}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="professor-dashboard-grid">
        <div className="professor-panel professor-classes-panel">
          <div className="professor-panel-header">
            <div>
              <h3>Minhas turmas</h3>
              <p>Turmas vinculadas ao seu perfil</p>
            </div>

            <button
              onClick={() => navigate("/professor/turmas")}
              className="professor-text-button"
            >
              Ver todas <ArrowRight size={16} />
            </button>
          </div>

          {carregando ? (
            <p className="professor-empty">
              Carregando turmas...
            </p>
          ) : turmas.length === 0 ? (
            <p className="professor-empty">
              Nenhuma turma foi vinculada ao seu perfil.
            </p>
          ) : (
            <div className="professor-class-list">
              {turmas.slice(0, 5).map((turma) => (
                <article className="professor-class-item" key={turma.id}>
                  <div className="professor-class-icon">
                    <BookOpen size={21} />
                  </div>

                  <div className="professor-class-info">
                    <strong>
                      {turma.name}
                    </strong>

                    <span>
                      {turma.discipline?.name || "Disciplina não informada"}
                    </span>

                    <small>
                      Código: {turma.code}
                    </small>
                  </div>

                  <span className="professor-class-year">
                    {turma.academicYear}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="professor-panel professor-quick-panel">
          <div className="professor-panel-header">
            <div>
              <h3>Acesso rápido</h3>
              <p>Atalhos para suas atividades</p>
            </div>
          </div>

          <button
            className="professor-quick-action"
            onClick={() => navigate("/professor/frequencia")}
          >
            <div className="professor-quick-icon azul">
              <ClipboardCheck size={22} />
            </div>

            <div>
              <strong>Registrar frequência</strong>
              <span>Gerencie a presença dos alunos</span>
            </div>

            <ArrowRight size={18} />
          </button>

          <button
            className="professor-quick-action"
            onClick={() => navigate("/professor/turmas")}
          >
            <div className="professor-quick-icon verde">
              <BookOpen size={22} />
            </div>

            <div>
              <strong>Consultar turmas</strong>
              <span>Visualize suas disciplinas</span>
            </div>

            <ArrowRight size={18} />
          </button>

          <button
            className="professor-quick-action"
            onClick={() => navigate("/professor/agenda")}
          >
            <div className="professor-quick-icon roxo">
              <CalendarDays size={22} />
            </div>

            <div>
              <strong>Consultar agenda</strong>
              <span>Confira seus horários</span>
            </div>

            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default ProfessorDashboard;