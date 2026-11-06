
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  UserRound,
  BookOpen,
  CalendarDays,
  Library,
  FileText,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import "./StudentLayout.css";

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { usuario, encerrarSessao } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  const itensMenu = [
    {
      titulo: "Visão geral",
      icone: LayoutDashboard,
      caminho: "/aluno"
    },
    {
      titulo: "Meu perfil",
      icone: UserRound,
      caminho: "/aluno/perfil"
    },
    {
      titulo: "Meu boletim",
      icone: BookOpen,
      caminho: "/aluno/boletim"
    },
    {
      titulo: "Agenda",
      icone: CalendarDays,
      caminho: "/aluno/agenda"
    },
    {
      titulo: "Biblioteca",
      icone: Library,
      caminho: "/aluno/biblioteca"
    },
    {
      titulo: "Comprovante de matrícula",
      icone: FileText,
      caminho: "/aluno/comprovante"
    },
    {
      titulo: "Configurações",
      icone: Settings,
      caminho: "/aluno/configuracoes"
    }
  ];

  return (
    <div className="student-layout">
      <aside className={`student-sidebar ${menuAberto ? "aberto" : ""}`}>
        <div className="student-brand">
          <div className="student-brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2>Syntesis</h2>
            <span>Sistema de Educação</span>
          </div>

          <button
            className="student-close-menu"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="student-menu-label">
          MENU PRINCIPAL
        </div>

        <nav className="student-navigation">
          {itensMenu.map((item) => {
            const Icone = item.icone;

            const ativo =
              item.caminho === "/aluno"
                ? location.pathname === item.caminho
                : location.pathname.startsWith(item.caminho);

            return (
              <button
                key={item.caminho}
                className={`student-nav-item ${ativo ? "ativo" : ""}`}
                onClick={() => {
                  navigate(item.caminho);
                  setMenuAberto(false);
                }}
              >
                <Icone size={20} />
                <span>{item.titulo}</span>
              </button>
            );
          })}
        </nav>

        <div className="student-sidebar-footer">
          <div className="student-user-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="student-user-info">
            <strong>{usuario?.name || "Aluno"}</strong>
            <span>Aluno</span>
          </div>

          <button
            className="student-logout"
            onClick={sair}
            title="Sair"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {menuAberto && (
        <div
          className="student-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <main className="student-main">
        <header className="student-header">
          <button
            className="student-menu-toggle"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={23} />
          </button>

          <div>
            <span>Painel do aluno</span>
            <h1>
              Bem-vindo, {usuario?.name?.split(" ")[0] || "Aluno"}!
            </h1>
          </div>

          <div className="student-header-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
        </header>

        <section className="student-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default StudentLayout;
