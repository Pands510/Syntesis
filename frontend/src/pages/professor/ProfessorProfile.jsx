
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  CalendarDays,
  Hash,
  BookOpen,
  Building2,
  ShieldCheck,
  AlertCircle,
  LoaderCircle,
  LockKeyhole,
  KeyRound,
  Save
} from "lucide-react";

import api from "../../services/api";

import "./ProfessorProfile.css";

function ProfessorProfile() {
  const [professor, setProfessor] = useState(null);
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

        const resposta = await api.get("/api/users/professor/me");

        setProfessor(resposta.data.professor);
        setEmailAtual(resposta.data.professor.user?.email || "");
      } catch (error) {
        console.error("Erro ao carregar perfil do professor:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar seus dados profissionais."
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

      setProfessor((anterior) => ({
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
      <div className="professor-profile-state">
        <LoaderCircle size={28} className="professor-profile-spinner" />
        <p>Carregando seus dados...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="professor-profile-error">
        <AlertCircle size={22} />
        <p>{erro}</p>
      </div>
    );
  }

  if (!professor) return null;

  return (
    <section className="professor-profile">
      <header className="professor-profile-header">
        <div>
          <span className="professor-profile-eyebrow">
            ÁREA DO PROFESSOR
          </span>

          <h1>Meu Perfil</h1>

          <p>
            Consulte suas informações pessoais e profissionais
            e gerencie sua conta.
          </p>
        </div>
      </header>

      <div className="professor-profile-card">
        <div className="professor-profile-user">
          <div className="professor-profile-avatar">
            <UserRound size={34} />
          </div>

          <div>
            <h2>{professor.user?.name || "Professor"}</h2>
            <span>
              Registro: {professor.employeeNumber || "Não informado"}
            </span>
          </div>
        </div>

        <div className="professor-profile-divider" />

        <div className="professor-profile-section">
          <h3>
            <UserRound size={19} />
            Dados pessoais
          </h3>

          <div className="professor-profile-grid">
            <div className="professor-profile-field">
              <span>Nome completo</span>
              <strong>{professor.user?.name || "Não informado"}</strong>
            </div>

            <div className="professor-profile-field">
              <span>E-mail</span>
              <strong>
                <Mail size={15} />
                {professor.user?.email || "Não informado"}
              </strong>
            </div>

            <div className="professor-profile-field">
              <span>Data de cadastro</span>
              <strong>
                <CalendarDays size={15} />
                {formatarData(professor.user?.createdAt)}
              </strong>
            </div>

            <div className="professor-profile-field">
              <span>Número de registro</span>
              <strong>
                <Hash size={15} />
                {professor.employeeNumber || "Não informado"}
              </strong>
            </div>
          </div>
        </div>

        <div className="professor-profile-divider" />

        <div className="professor-profile-section">
          <h3>
            <BookOpen size={20} />
            Dados profissionais
          </h3>

          <div className="professor-profile-grid">
            <div className="professor-profile-field">
              <span>Departamento</span>
              <strong>
                <Building2 size={15} />
                {professor.department || "Não informado"}
              </strong>
            </div>

            <div className="professor-profile-field">
              <span>Disciplina vinculada</span>
              <strong>
                {professor.discipline?.name || "Não informada"}
              </strong>
            </div>

            <div className="professor-profile-field">
              <span>Código da disciplina</span>
              <strong>
                {professor.discipline?.code || "Não informado"}
              </strong>
            </div>
          </div>
        </div>

        <div className="professor-profile-divider" />

        <div className="professor-profile-section">
          <h3>
            <LockKeyhole size={20} />
            Configurações da conta
          </h3>

          <p className="professor-settings-description">
            Gerencie seu e-mail de acesso e sua senha.
            Essas alterações não modificam seus dados profissionais.
          </p>

          <div className="professor-settings-form">
            <h4>
              <Mail size={18} />
              Alterar e-mail
            </h4>

            <form onSubmit={alterarEmail}>
              <div className="professor-settings-field">
                <label htmlFor="professorEmailAtual">
                  Novo endereço de e-mail
                </label>

                <input
                  id="professorEmailAtual"
                  type="email"
                  value={emailAtual}
                  onChange={(event) => setEmailAtual(event.target.value)}
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="professor-settings-field">
                <label htmlFor="professorSenhaEmail">
                  Confirme sua senha atual
                </label>

                <input
                  id="professorSenhaEmail"
                  type="password"
                  value={senhaEmail}
                  onChange={(event) => setSenhaEmail(event.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>

              {erroEmail && (
                <div className="professor-settings-message error">
                  <AlertCircle size={17} />
                  {erroEmail}
                </div>
              )}

              {mensagemEmail && (
                <div className="professor-settings-message success">
                  <ShieldCheck size={17} />
                  {mensagemEmail}
                </div>
              )}

              <button
                type="submit"
                className="professor-settings-button"
                disabled={carregandoEmail}
              >
                {carregandoEmail ? (
                  <LoaderCircle size={18} className="professor-profile-spinner" />
                ) : (
                  <Save size={18} />
                )}

                {carregandoEmail ? "Salvando..." : "Salvar novo e-mail"}
              </button>
            </form>
          </div>

          <div className="professor-settings-form">
            <h4>
              <KeyRound size={18} />
              Alterar senha
            </h4>

            <form onSubmit={alterarSenha}>
              <div className="professor-settings-field">
                <label htmlFor="professorSenhaAtual">
                  Senha atual
                </label>

                <input
                  id="professorSenhaAtual"
                  type="password"
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  placeholder="Digite sua senha atual"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="professor-settings-field">
                <label htmlFor="professorNovaSenha">
                  Nova senha
                </label>

                <input
                  id="professorNovaSenha"
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              <div className="professor-settings-field">
                <label htmlFor="professorConfirmarSenha">
                  Confirmar nova senha
                </label>

                <input
                  id="professorConfirmarSenha"
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
                <div className="professor-settings-message error">
                  <AlertCircle size={17} />
                  {erroSenha}
                </div>
              )}

              {mensagemSenha && (
                <div className="professor-settings-message success">
                  <ShieldCheck size={17} />
                  {mensagemSenha}
                </div>
              )}

              <button
                type="submit"
                className="professor-settings-button"
                disabled={carregandoSenha}
              >
                {carregandoSenha ? (
                  <LoaderCircle size={18} className="professor-profile-spinner" />
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

export default ProfessorProfile;
