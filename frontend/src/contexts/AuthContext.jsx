
import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const token = localStorage.getItem("token");

      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const resposta = await api.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setUsuario(resposta.data.usuario);
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();
  }, []);

  function salvarSessao(token, dadosUsuario) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(dadosUsuario));
    setUsuario(dadosUsuario);
  }

  function encerrarSessao() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        carregando,
        salvarSessao,
        encerrarSessao
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider.");
  }

  return contexto;
}
