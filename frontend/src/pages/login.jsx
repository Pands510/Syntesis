
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { salvarSessao } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/api/auth/login", {
        email: email.trim(),
        password: senha
      });

      const { token, usuario } = resposta.data;

      if (!token || !usuario) {
        throw new Error("Resposta inválida do servidor.");
      }

      salvarSessao(token, usuario);

      switch (usuario.role) {
        case "ALUNO":
          navigate("/aluno", { replace: true });
          break;

        case "PROFESSOR":
          navigate("/professor", { replace: true });
          break;

        case "ADMIN":
          navigate("/admin", { replace: true });
          break;

        default:
          setErro("Perfil de usuário não reconhecido.");
      }
    } catch (error) {
      console.error("Erro ao realizar login:", error);

      setErro(
        error.response?.data?.mensagem ||
        error.message ||
        "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">
          <GraduationCap size={42} />
        </div>

        <h1>Syntesis</h1>
        <p className="login-subtitle">Sistema de Educação</p>

        <div className="login-heading">
          <h2>Bem-vindo de volta!</h2>
          <p>Entre com suas credenciais para continuar.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>

            <div className="input-container">
              <Mail size={19} />

              <input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>

            <div className="input-container">
              <Lock size={19} />

              <input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
                autoComplete="current-password"
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

          <div className="login-options">
            <Link to="/recuperar-senha">
              Esqueceu sua senha?
            </Link>
          </div>

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
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <footer className="login-footer">
          <p>Syntesis — Sistema de Educação</p>
        </footer>
      </section>
    </main>
  );
}

export default Login;