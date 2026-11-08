
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  CalendarDays,
  FolderOpen,
  UserRound,
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

  const itensMenu = [
    {
      titulo: "Visão geral",
      icone: LayoutDashboard,
      caminho: "/aluno"
    },
    {
      titulo: "Boletim",
      icone: FileText,
      caminho: "/aluno/notas"
    },
    {
      titulo: "Frequência",
      icone: ClipboardCheck,
      caminho: "/aluno/frequencia"
    },
    {
      titulo: "Meu horário",
      icone: CalendarDays,
      caminho: "/aluno/horario"
    },
    {
      titulo: "Comprovante de matrícula",
      icone: FolderOpen,
      caminho: "/aluno/comprovante"
    },
    {
      titulo: "Meu perfil",
      icone: UserRound,
      caminho: "/aluno/perfil"
    }
  ];

  const itemAtual = itensMenu.find((item) =>
    item.caminho === "/aluno"
      ? location.pathname === "/aluno"
      : location.pathname.startsWith(item.caminho)
  );

  function navegar(caminho) {
    navigate(caminho);
    setMenuAberto(false);
  }

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  const primeiroNome = usuario?.name?.split(" ")[0] || "Aluno";
  const inicial = usuario?.name?.charAt(0)?.toUpperCase() || "A";

  return (
    <div className="student-layout">

      {/* Menu lateral */}
      <aside
        className={`student-sidebar ${menuAberto ? "aberto" : ""}`}
      >
        <div className="student-brand">
          <div className="student-brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2>Syntesis</h2>
            <span>Sistema de Educação</span>
          </div>

          <button
            type="button"
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
                type="button"
                key={item.caminho}
                className={`student-nav-item ${ativo ? "ativo" : ""}`}
                onClick={() => navegar(item.caminho)}
              >
                <Icone size={20} />
                <span>{item.titulo}</span>
              </button>
            );
          })}
        </nav>

        {/* Identificação do aluno */}
        <div className="student-sidebar-footer">
          <div className="student-user-avatar">
            {inicial}
          </div>

          <div className="student-user-info">
            <strong>{usuario?.name || "Aluno"}</strong>
            <span>Aluno</span>
          </div>

          <button
            type="button"
            className="student-logout"
            onClick={sair}
            title="Sair"
            aria-label="Encerrar sessão"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {/* Fundo do menu mobile */}
      {menuAberto && (
        <div
          className="student-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* Conteúdo principal */}
      <main className="student-main">

        <header className="student-header">
          <button
            type="button"
            className="student-menu-toggle"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={23} />
          </button>

          <div className="student-header-title">
            <span>Portal do aluno</span>

            <h1>
              {itemAtual?.titulo || "Área do aluno"}
            </h1>
          </div>

          <div className="student-header-user">
            <div className="student-header-user-info">
              <strong>{primeiroNome}</strong>
              <span>Aluno</span>
            </div>

            <div className="student-header-avatar">
              {inicial}
            </div>
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
