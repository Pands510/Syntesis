
import { useState } from "react";
import {
  UserRound,
  Mail,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  LogOut
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

import "./Settings.css";

function Settings() {
  const { usuario, encerrarSessao } = useAuth();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [mostrarSenha, setMostrarSenha] = useState({
    atual: false,
    nova: false,
    confirmar: false
  });

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function alternarVisibilidade(campo) {
    setMostrarSenha((anterior) => ({
      ...anterior,
      [campo]: !anterior[campo]
    }));
  }

  async function alterarSenha(event) {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (formulario.newPassword.length < 8) {
      setErro("A nova senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (formulario.newPassword !== formulario.confirmPassword) {
      setErro("A confirmação da nova senha não corresponde.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.patch(
        "/api/auth/change-password",
        {
          currentPassword: formulario.currentPassword,
          newPassword: formulario.newPassword
        }
      );

      setFormulario({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    window.alert(
        `${resposta.data.mensagem} Faça login novamente com sua nova senha.`
    );

    encerrarSessao();
    navigate("/login", { replace: true });

    } catch (error) {
      console.error("Erro ao alterar senha:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível alterar sua senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  function campoSenha(nome, titulo, campoVisibilidade) {
    return (
      <div className="settings-field">
        <label htmlFor={nome}>{titulo}</label>

        <div className="settings-input-wrapper">
          <LockKeyhole size={18} />

          <input
            id={nome}
            name={nome}
            type={mostrarSenha[campoVisibilidade] ? "text" : "password"}
            value={formulario[nome]}
            onChange={atualizarCampo}
            placeholder="Digite sua senha"
            required
            autoComplete="off"
          />

          <button
            type="button"
            className="settings-password-toggle"
            onClick={() => alternarVisibilidade(campoVisibilidade)}
            aria-label={
              mostrarSenha[campoVisibilidade]
                ? "Ocultar senha"
                : "Mostrar senha"
            }
          >
            {mostrarSenha[campoVisibilidade] ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">

      <div className="settings-heading">
        <div>
          <h2>Configurações</h2>
          <p>
            Gerencie suas informações e as configurações da sua conta.
          </p>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <UserRound size={22} />
          </div>

          <div>
            <h3>Perfil administrativo</h3>
            <p>Informações da conta atualmente conectada.</p>
          </div>
        </div>

        <div className="settings-profile">
          <div className="settings-profile-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="settings-profile-info">
            <h4>{usuario?.name || "Administrador"}</h4>
            <span>
              <Mail size={15} />
              {usuario?.email}
            </span>
            <span className="settings-profile-role">
              <ShieldCheck size={15} />
              Administrador
            </span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <LockKeyhole size={22} />
          </div>

          <div>
            <h3>Segurança da conta</h3>
            <p>Atualize sua senha de acesso ao Syntesis.</p>
          </div>
        </div>

        {mensagem && (
          <div className="settings-feedback success">
            <CheckCircle2 size={18} />
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="settings-feedback error" role="alert">
            <AlertCircle size={18} />
            {erro}
          </div>
        )}

        <form onSubmit={alterarSenha}>
          <div className="settings-password-grid">

            {campoSenha(
              "currentPassword",
              "Senha atual",
              "atual"
            )}

            {campoSenha(
              "newPassword",
              "Nova senha",
              "nova"
            )}

            {campoSenha(
              "confirmPassword",
              "Confirmar nova senha",
              "confirmar"
            )}

          </div>

          <div className="settings-password-info">
            A nova senha deve possuir pelo menos 8 caracteres e ser
            diferente da senha atual.
          </div>

          <div className="settings-form-footer">
            <button
              type="submit"
              className="settings-save-button"
              disabled={carregando}
            >
              <Save size={17} />
              {carregando ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section settings-institution">
        <div className="settings-section-header">
          <div className="settings-section-icon">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h3>Sobre o sistema</h3>
            <p>Informações institucionais da plataforma.</p>
          </div>
        </div>

        <div className="settings-institution-info">
          <strong>Syntesis</strong>
          <span>Sistema de Educação</span>
          <span>Plataforma de gerenciamento acadêmico.</span>
        </div>
      </div>

      <div className="settings-logout-section">
        <div>
          <h3>Encerrar sessão</h3>
          <p>Saia da sua conta administrativa neste dispositivo.</p>
        </div>

        <button
          className="settings-logout-button"
          onClick={() => {
            encerrarSessao();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut size={17} />
          Sair da conta
        </button>
      </div>

    </div>
  );
}

export default Settings;
