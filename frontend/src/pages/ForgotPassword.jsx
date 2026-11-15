
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send } from "lucide-react";
import api from "../services/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setMensagem("");
    setErro("");
    setCarregando(true);

    try {
      const response = await api.post("/api/auth/forgot-password", {
        email: email.trim()
      });

      setMensagem(response.data.mensagem);
      setEmail("");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível solicitar a recuperação. Tente novamente."
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

        <div className="login-heading">
          <h2>Recuperar senha</h2>
          <p>
            Informe seu e-mail cadastrado para receber um
            link de redefinição de senha.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>

            <div className="input-container">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {mensagem && (
            <div className="auth-success" role="status">
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
            {carregando ? (
              "Enviando..."
            ) : (
              <>
                <Send size={17} />
                Enviar link de recuperação
              </>
            )}
          </button>
        </form>

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

export default ForgotPassword;
