import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  FileText,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import "./ProfessorLayout.css";

function ProfessorLayout() {
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
      caminho: "/professor"
    },
    {
      titulo: "Frequência",
      icone: ClipboardCheck,
      caminho: "/professor/frequencia"
    },
    {
      titulo: "Turmas e disciplinas",
      icone: BookOpen,
      caminho: "/professor/turmas"
    },
    {
      titulo: "Agenda",
      icone: CalendarDays,
      caminho: "/professor/agenda"
    },
    {
        titulo: "Notas",
        icone: FileText,
        caminho: "/professor/notas"
    },
  ];

  return (
    <div className="professor-layout">
      <aside className={`professor-sidebar ${menuAberto ? "aberto" : ""}`}>
        <div className="professor-brand">
          <div className="professor-brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2>Syntesis</h2>
            <span>Sistema de Educação</span>
          </div>

          <button
            className="professor-close-menu"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="professor-menu-label">
          MENU PRINCIPAL
        </div>

        <nav className="professor-navigation">
          {itensMenu.map((item) => {
            const Icone = item.icone;

            const ativo =
              item.caminho === "/professor"
                ? location.pathname === item.caminho
                : location.pathname.startsWith(item.caminho);

            return (
              <button
                key={item.caminho}
                className={`professor-nav-item ${ativo ? "ativo" : ""}`}
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

        <div className="professor-sidebar-footer">
          <div className="professor-user-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>

          <div className="professor-user-info">
            <strong>{usuario?.name || "Professor"}</strong>
            <span>Professor</span>
          </div>

          <button
            className="professor-logout"
            onClick={sair}
            title="Sair"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {menuAberto && (
        <div
          className="professor-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <main className="professor-main">
        <header className="professor-header">
          <button
            className="professor-menu-toggle"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={23} />
          </button>

          <div>
            <span>Painel do professor</span>
            <h1>
              Bem-vindo, {usuario?.name?.split(" ")[0] || "Professor"}!
            </h1>
          </div>

          <div className="professor-header-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>
        </header>

        <section className="professor-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default ProfessorLayout;
