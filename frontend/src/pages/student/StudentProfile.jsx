
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
  LoaderCircle,
  LockKeyhole,
  KeyRound,
  Save
} from "lucide-react";

import api from "../../services/api";

import "./StudentProfile.css";

function StudentProfile() {
  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [emailAtual, setEmailAtual] = useState("");
  const [senhaEmail, setSenhaEmail] = useState("");
  const [carregandoEmail, setCarregandoEmail] = useState(false);
  const [mensagemEmail, setMensagemEmail] = useState("");
  const [erroEmail, setErroEmail] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregandoSenha, setCarregandoSenha] = useState(false);
  const [mensagemSenha, setMensagemSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");

  useEffect(() => {
    async function carregarPerfil() {
      try {
        setCarregando(true);
        setErro("");

        const resposta = await api.get("/api/users/me");

        setAluno(resposta.data.aluno);
        setEmailAtual(resposta.data.aluno.user?.email || "");
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

  async function alterarEmail(event) {
    event.preventDefault();

    setMensagemEmail("");
    setErroEmail("");

    const emailNormalizado = emailAtual.trim().toLowerCase();

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      emailNormalizado
    );

    if (!emailValido) {
      setErroEmail("Informe um endereço de e-mail válido.");
      return;
    }

    if (!senhaEmail) {
      setErroEmail("Informe sua senha atual.");
      return;
    }

    try {
      setCarregandoEmail(true);

      const resposta = await api.patch("/api/auth/change-email", {
        currentPassword: senhaEmail,
        newEmail: emailNormalizado
      });

      setEmailAtual(resposta.data.email);

      setAluno((anterior) => ({
        ...anterior,
        user: {
          ...anterior.user,
          email: resposta.data.email
        }
      }));

      setSenhaEmail("");
      setMensagemEmail(resposta.data.mensagem);
    } catch (error) {
      setErroEmail(
        error.response?.data?.mensagem ||
        "Não foi possível alterar seu e-mail."
      );
    } finally {
      setCarregandoEmail(false);
    }
  }

  async function alterarSenha(event) {
    event.preventDefault();

    setMensagemSenha("");
    setErroSenha("");

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErroSenha("Preencha todos os campos de senha.");
      return;
    }

    if (novaSenha.length < 8) {
      setErroSenha("A nova senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha("A confirmação da nova senha não corresponde.");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErroSenha("A nova senha deve ser diferente da senha atual.");
      return;
    }

    try {
      setCarregandoSenha(true);

      const resposta = await api.patch("/api/auth/change-password", {
        currentPassword: senhaAtual,
        newPassword: novaSenha
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setMensagemSenha(resposta.data.mensagem);
    } catch (error) {
      setErroSenha(
        error.response?.data?.mensagem ||
        "Não foi possível alterar sua senha."
      );
    } finally {
      setCarregandoSenha(false);
    }
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
            Consulte suas informações pessoais e acadêmicas
            e gerencie sua conta.
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

        <div className="student-profile-divider" />

        <div className="student-profile-section">
          <h3>
            <LockKeyhole size={20} />
            Configurações da conta
          </h3>

          <p className="student-settings-description">
            Gerencie seu e-mail de acesso e sua senha.
            Essas alterações não modificam seus dados acadêmicos.
          </p>

          <div className="student-settings-form">
            <h4>
              <Mail size={18} />
              Alterar e-mail
            </h4>

            <form onSubmit={alterarEmail}>
              <div className="student-settings-field">
                <label htmlFor="emailAtual">
                  Novo endereço de e-mail
                </label>

                <input
                  id="emailAtual"
                  type="email"
                  value={emailAtual}
                  onChange={(event) => setEmailAtual(event.target.value)}
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="senhaEmail">
                  Confirme sua senha atual
                </label>

                <input
                  id="senhaEmail"
                  type="password"
                  value={senhaEmail}
                  onChange={(event) => setSenhaEmail(event.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>

              {erroEmail && (
                <div className="student-settings-message error">
                  <AlertCircle size={17} />
                  {erroEmail}
                </div>
              )}

              {mensagemEmail && (
                <div className="student-settings-message success">
                  <ShieldCheck size={17} />
                  {mensagemEmail}
                </div>
              )}

              <button
                type="submit"
                className="student-settings-button"
                disabled={carregandoEmail}
              >
                {carregandoEmail ? (
                  <LoaderCircle size={18} className="student-profile-spinner" />
                ) : (
                  <Save size={18} />
                )}

                {carregandoEmail ? "Salvando..." : "Salvar novo e-mail"}
              </button>
            </form>
          </div>

          <div className="student-settings-form">
            <h4>
              <KeyRound size={18} />
              Alterar senha
            </h4>

            <form onSubmit={alterarSenha}>
              <div className="student-settings-field">
                <label htmlFor="senhaAtual">
                  Senha atual
                </label>

                <input
                  id="senhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="novaSenha">
                  Nova senha
                </label>

                <input
                  id="novaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="student-settings-field">
                <label htmlFor="confirmarSenha">
                  Confirmar nova senha
                </label>

                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  placeholder="Digite novamente a nova senha"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {erroSenha && (
                <div className="student-settings-message error">
                  <AlertCircle size={17} />
                  {erroSenha}
                </div>
              )}

              {mensagemSenha && (
                <div className="student-settings-message success">
                  <ShieldCheck size={17} />
                  {mensagemSenha}
                </div>
              )}

              <button
                type="submit"
                className="student-settings-button"
                disabled={carregandoSenha}
              >
                {carregandoSenha ? (
                  <LoaderCircle size={18} className="student-profile-spinner" />
                ) : (
                  <Save size={18} />
                )}

                {carregandoSenha ? "Salvando..." : "Alterar senha"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentProfile;
