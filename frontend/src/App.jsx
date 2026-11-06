
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

// Layouts
import AdminLayout from "./components/admin/AdminLayout";
import ProfessorLayout from "./components/professor/ProfessorLayout";

// Aluno
import StudentDashboard from "./pages/student/StudentDashboard";

// Professor
import ProfessorDashboard from "./pages/professor/ProfessorDashboard";
import ProfessorClasses from "./pages/professor/ProfessorClasses";
import ProfessorAttendance from "./pages/professor/ProfessorAttendance";
import ProfessorGrades from "./pages/professor/ProfessorGrades";

// Administrador
import AdminDashboard from "./pages/admin/AdminDashboard";
import Users from "./pages/admin/Users";
import Professors from "./pages/admin/Professors";
import Courses from "./pages/admin/Courses";
import Disciplines from "./pages/admin/Disciplines";
import Settings from "./pages/admin/Settings";
import AcademicTerms from "./pages/admin/AcademicTerms";

function HomeRedirect() {
  const { usuario, autenticado, carregando } = useAuth();

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace />;
  }

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-senha" element={<ForgotPassword />} />
        <Route path="/redefinir-senha" element={<ResetPassword />} />

        {/* Aluno */}
        <Route element={<ProtectedRoute allowedRoles={["ALUNO"]} />}>
          <Route path="/aluno" element={<StudentDashboard />} />
        </Route>

        {/* Professor */}
        <Route element={<ProtectedRoute allowedRoles={["PROFESSOR"]} />}>
          <Route path="/professor" element={<ProfessorLayout />}>
            <Route index element={<ProfessorDashboard />} />
            <Route path="frequencia" element={<ProfessorAttendance />} />
            <Route path="turmas" element={<ProfessorClasses />} />
            <Route path="notas" element={<ProfessorGrades />} />
            <Route path="agenda" element={<h2>Agenda</h2>} />
          </Route>
        </Route>

        {/* Administrador */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="professores" element={<Professors />} />
            <Route path="cursos" element={<Courses />} />
            <Route path="disciplinas" element={<Disciplines />} />
            <Route path="periodos-letivos" element={<AcademicTerms />} />
            <Route path="configuracoes" element={<Settings />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<h1>Página não encontrada</h1>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
