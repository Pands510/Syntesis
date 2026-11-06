
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  GraduationCap,
  BookOpen,
  Hash,
  CalendarDays,
  LogOut,
  AlertCircle
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "./StudentDashboard.css";

function StudentDashboard() {
  const { encerrarSessao } = useAuth();
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
        console.error("Erro ao carregar perfil acadêmico:", error);

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

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

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
        <button onClick={sair}>Voltar ao login</button>
      </div>
    );
  }

  const dadosUsuario = aluno?.user;

  return (
    <main className="student-dashboard">

      <section className="student-welcome">
        <div>
          <span className="student-welcome-label">
            PAINEL DO ALUNO
          </span>

          <h2>
            Olá, {dadosUsuario?.name?.split(" ")[0]}!
          </h2>

          <p>
            Bem-vindo ao seu ambiente acadêmico.
            Aqui você poderá acompanhar suas informações.
          </p>
        </div>

        <div className="student-welcome-icon">
          <GraduationCap size={58} />
        </div>
      </section>

      <section className="student-section">
        <div className="student-section-heading">
          <div>
            <h2>Meu perfil acadêmico</h2>
            <p>Confira suas informações cadastrais.</p>
          </div>
        </div>

        <div className="student-info-grid">

          <article className="student-info-card">
            <div className="student-info-icon">
              <UserRound size={21} />
            </div>

            <div>
              <span>Nome completo</span>
              <strong>{dadosUsuario?.name || "Não informado"}</strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <Mail size={21} />
            </div>

            <div>
              <span>E-mail</span>
              <strong>{dadosUsuario?.email || "Não informado"}</strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <Hash size={21} />
            </div>

            <div>
              <span>Matrícula</span>
              <strong>
                {aluno?.registrationNumber || "Não informada"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <span>Curso</span>
              <strong>{aluno?.course || "Não informado"}</strong>
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
              <GraduationCap size={21} />
            </div>

            <div>
              <span>Perfil de acesso</span>
              <strong>Aluno</strong>
            </div>
          </article>

        </div>
      </section>

      <footer className="student-footer">
        Syntesis — Sistema de Educação
      </footer>

    </main>
  );
}

export default StudentDashboard;
