import { Outlet, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  Menu,
  X,
  CalendarDays,
  School
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();
  const { usuario, encerrarSessao } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  const itensMenu = [
    { titulo: "Visão geral", icone: LayoutDashboard, caminho: "/admin" },
    { titulo: "Usuários", icone: Users, caminho: "/admin/usuarios" },
    { titulo: "Cursos", icone: GraduationCap, caminho: "/admin/cursos" },
    { titulo: "Disciplinas", icone: GraduationCap, caminho: "/admin/disciplinas" },
    { titulo: "Turmas", icone: School, caminho: "/admin/turmas" },
    { titulo: "Cadastrar professor", icone: UserPlus, caminho: "/admin/professores" },
    { titulo: "Períodos letivos", icone: CalendarDays, caminho: "/admin/periodos-letivos" },
    { titulo: "Configurações", icone: Settings, caminho: "/admin/configuracoes" }
  ];  

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${menuAberto ? "aberto" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h2>Syntesis</h2>
            <span>Sistema de Educação</span>
          </div>

          <button
            className="admin-close-menu"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <X size={21} />
          </button>
        </div>

        <div className="admin-menu-label">MENU PRINCIPAL</div>

        <nav className="admin-navigation">
          {itensMenu.map((item) => {
            const Icone = item.icone;

            return (
              <button
                key={item.caminho}
                className="admin-nav-item"
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

        <div className="admin-sidebar-footer">
          <div className="admin-user-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="admin-user-info">
            <strong>{usuario?.name || "Administrador"}</strong>
            <span>Administrador</span>
          </div>

          <button className="admin-logout" onClick={sair} title="Sair">
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      {menuAberto && (
        <div
          className="admin-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      <main className="admin-main">
        <header className="admin-header">
          <button
            className="admin-menu-toggle"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={23} />
          </button>

          <div>
            <span>Painel administrativo</span>
            <h1>
              Bem-vindo, {usuario?.name?.split(" ")[0] || "Administrador"}!
            </h1>
          </div>

          <div className="admin-header-avatar">
            {usuario?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;