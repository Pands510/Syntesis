
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import api from "../services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    if (!token) {
      setErro("Link de recuperação inválido ou incompleto.");
      return;
    }

    if (novaSenha.length < 8) {
      setErro("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const response = await api.post("/api/auth/reset-password", {
        token,
        newPassword: novaSenha,
        confirmPassword: confirmarSenha
      });

      setMensagem(
        response.data.mensagem || "Senha redefinida com sucesso!"
      );

      setNovaSenha("");
      setConfirmarSenha("");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2500);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível redefinir sua senha. Solicite um novo link."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card auth-card">
        <div className="login-logo">
          <img
            src="/brand/syntesis-logo.png"
            alt="Syntesis"
            className="login-logo-image"
          />
        </div>

        <h1>Syntesis</h1>

        <p className="login-subtitle">
          Sistema de Educação
        </p>

        {!token ? (
          <>
            <div className="login-heading">
              <h2>Link inválido</h2>
              <p>
                O link de recuperação é inválido ou está incompleto.
                Solicite um novo link para continuar.
              </p>
            </div>

            <Link
              to="/recuperar-senha"
              className="login-button auth-button-link"
            >
              Solicitar novo link
            </Link>
          </>
        ) : (
          <>
            <div className="login-heading">
              <h2>Redefinir senha</h2>
              <p>
                Cadastre uma nova senha para acessar o Syntesis.
                Ela deve possuir pelo menos 8 caracteres.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="novaSenha">Nova senha</label>

                <div className="input-container">
                  <Lock size={19} />

                  <input
                    id="novaSenha"
                    type={mostrarSenha ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite sua nova senha"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmarSenha">
                  Confirmar nova senha
                </label>

                <div className="input-container">
                  <Lock size={19} />

                  <input
                    id="confirmarSenha"
                    type={mostrarConfirmacao ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente sua senha"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                    aria-label={
                      mostrarConfirmacao
                        ? "Ocultar confirmação"
                        : "Mostrar confirmação"
                    }
                  >
                    {mostrarConfirmacao ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {mensagem && (
                <div className="auth-success" role="status">
                  <CheckCircle size={18} />
                  {mensagem}
                </div>
              )}

              {erro && (
                <div className="login-error" role="alert">
                  {erro}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
                disabled={carregando}
              >
                {carregando ? "Redefinindo..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}

        <div className="auth-back">
          <Link to="/login">
            <ArrowLeft size={16} />
            Voltar para o login
          </Link>
        </div>

        <footer className="login-footer">
          Syntesis - Sistema de Educação
        </footer>
      </section>
    </main>
  );
}

export default ResetPassword;
