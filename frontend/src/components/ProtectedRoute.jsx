
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { usuario, autenticado, carregando } = useAuth();

  if (carregando) {
    return <p>Verificando autenticação...</p>;
  }

  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(usuario.role)) {
    switch (usuario.role) {
      case "ALUNO":
        return <Navigate to="/aluno" replace />;

      case "PROFESSOR":
        return <Navigate to="/professor" replace />;

      case "ADMIN":
        return <Navigate to="/admin" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;
