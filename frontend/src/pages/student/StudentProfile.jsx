import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  GraduationCap,
  Hash,
  CalendarDays,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  LoaderCircle
} from "lucide-react";

import api from "../../services/api";

import "./StudentProfile.css";

function StudentProfile() {
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await api.get("/api/users/me");

        setAluno(resposta.data.aluno);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar seus dados cadastrais."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, []);

  function formatarData(data) {
    if (!data) return "Não informado";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  function formatarStatus(status) {
    const situacoes = {
      ATIVO: "Ativo",
      TRANCADO: "Trancado",
      CONCLUIDO: "Concluído"
    };

    return situacoes[status] || "Não informado";
  }

  if (carregando) {
    return (
      <div className="student-profile-state">
        <LoaderCircle size={28} className="student-profile-spinner" />
        <p>Carregando seus dados...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-profile-error">
        <AlertCircle size={22} />
        <p>{erro}</p>
      </div>
    );
  }

  if (!aluno) return null;

  return (
    <section className="student-profile">
      <header className="student-profile-header">
        <div>
          <span className="student-profile-eyebrow">
            ÁREA DO ALUNO
          </span>

          <h1>Meu Perfil</h1>

          <p>
            Consulte suas informações pessoais e acadêmicas.
          </p>
        </div>
      </header>

      <div className="student-profile-card">
        <div className="student-profile-user">
          <div className="student-profile-avatar">
            <UserRound size={34} />
          </div>

          <div>
            <h2>{aluno.user?.name || "Aluno"}</h2>
            <span>
              Matrícula: {aluno.registrationNumber || "Não informado"}
            </span>
          </div>
        </div>

        <div className="student-profile-divider" />

        <div className="student-profile-section">
          <h3>
            <UserRound size={19} />
            Dados pessoais
          </h3>

          <div className="student-profile-grid">
            <div className="student-profile-field">
              <span>Nome completo</span>
              <strong>{aluno.user?.name || "Não informado"}</strong>
            </div>

            <div className="student-profile-field">
              <span>E-mail</span>
              <strong>
                <Mail size={15} />
                {aluno.user?.email || "Não informado"}
              </strong>
            </div>

            <div className="student-profile-field">
              <span>Data de cadastro</span>
              <strong>
                <CalendarDays size={15} />
                {formatarData(aluno.user?.createdAt)}
              </strong>
            </div>

            <div className="student-profile-field">
              <span>Número de matrícula</span>
              <strong>
                <Hash size={15} />
                {aluno.registrationNumber || "Não informado"}
              </strong>
            </div>
          </div>
        </div>

        <div className="student-profile-divider" />

        <div className="student-profile-section">
          <h3>
            <GraduationCap size={20} />
            Dados acadêmicos
          </h3>

          <div className="student-profile-grid">
            <div className="student-profile-field">
              <span>Curso</span>
              <strong>
                <BookOpen size={15} />
                {aluno.academicCourse?.name || "Não informado"}
              </strong>
            </div>

            <div className="student-profile-field">
              <span>Código do curso</span>
              <strong>
                {aluno.academicCourse?.code || "Não informado"}
              </strong>
            </div>

            <div className="student-profile-field">
              <span>Semestre</span>
              <strong>
                {aluno.semester
                  ? `${aluno.semester}º semestre`
                  : "Não informado"}
              </strong>
            </div>

            <div className="student-profile-field">
              <span>Situação acadêmica</span>
              <strong className="student-profile-status">
                <ShieldCheck size={16} />
                {formatarStatus(aluno.status)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentProfile;