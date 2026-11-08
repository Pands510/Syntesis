
import { useEffect, useState } from "react";
import {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  FileText,
  UserRound,
  ArrowRight,
  AlertCircle
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const resposta = await api.get("/api/users/me");
        setAluno(resposta.data.aluno);
      } catch (error) {
        console.error("Erro ao carregar dados do aluno:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar seus dados acadêmicos."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const dadosUsuario = aluno?.user;

  const atalhos = [
    {
      titulo: "Meu boletim",
      descricao: "Consulte suas notas e médias.",
      icone: BookOpen,
      rota: "/aluno/notas"
    },
    {
      titulo: "Minha frequência",
      descricao: "Acompanhe suas faltas por disciplina.",
      icone: ClipboardCheck,
      rota: "/aluno/frequencia"
    },
    {
      titulo: "Meu horário",
      descricao: "Consulte os horários das suas aulas.",
      icone: CalendarDays,
      rota: "/aluno/horario"
    },
    {
      titulo: "Comprovante de matrícula",
      descricao: "Emita seu comprovante acadêmico.",
      icone: FileText,
      rota: "/aluno/comprovante"
    },
    {
      titulo: "Meu perfil",
      descricao: "Consulte seus dados cadastrais.",
      icone: UserRound,
      rota: "/aluno/perfil"
    }
  ];

  if (carregando) {
    return (
      <div className="student-loading">
        Carregando seus dados acadêmicos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-error">
        <AlertCircle size={22} />
        <p>{erro}</p>
      </div>
    );
  }

  return (
    <main className="student-dashboard">

      <section className="student-welcome">
        <div>
          <span className="student-welcome-label">
            PAINEL DO ALUNO
          </span>

          <h2>
            Olá, {dadosUsuario?.name?.split(" ")[0] || "Aluno"}!
          </h2>

          <p>
            Bem-vindo ao seu ambiente acadêmico.
            Acompanhe sua vida acadêmica e acesse os serviços disponíveis.
          </p>
        </div>

        <div className="student-welcome-icon">
          <GraduationCap size={58} />
        </div>
      </section>

      <section className="student-section student-overview-section">

        <div className="student-section-heading">
          <div>
            <h2>Resumo acadêmico</h2>
            <p>Confira suas principais informações.</p>
          </div>
        </div>

        <div className="student-info-grid">

          <article className="student-info-card">
            <div className="student-info-icon">
              <GraduationCap size={21} />
            </div>

            <div>
              <span>Curso</span>
              <strong>
                {aluno?.course || "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <span>Semestre</span>
              <strong>
                {aluno?.semester
                  ? `${aluno.semester}º semestre`
                  : "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <UserRound size={21} />
            </div>

            <div>
              <span>Matrícula</span>
              <strong>
                {aluno?.registrationNumber || "Não informada"}
              </strong>
            </div>
          </article>

        </div>
      </section>

      <section className="student-section student-shortcuts-section">

        <div className="student-section-heading">
          <div>
            <h2>Acesso rápido</h2>
            <p>Escolha o serviço acadêmico que deseja acessar.</p>
          </div>
        </div>

        <div className="student-shortcuts-grid">
          {atalhos.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <button
                type="button"
                className="student-shortcut-card"
                key={atalho.rota}
                onClick={() => navigate(atalho.rota)}
              >
                <div className="student-shortcut-icon">
                  <Icone size={23} />
                </div>

                <div className="student-shortcut-info">
                  <h3>{atalho.titulo}</h3>
                  <p>{atalho.descricao}</p>
                </div>

                <ArrowRight
                  size={19}
                  className="student-shortcut-arrow"
                />
              </button>
            );
          })}
        </div>

      </section>

      <footer className="student-footer">
        Syntesis — Sistema de Educação
      </footer>

    </main>
  );
}

export default StudentDashboard;
