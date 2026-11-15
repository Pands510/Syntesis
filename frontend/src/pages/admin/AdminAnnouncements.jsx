
import { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Users,
  GraduationCap,
  Search,
  RefreshCw
} from "lucide-react";

import api from "../../services/api";
import "./AdminAnnouncements.css";

const FORMULARIO_INICIAL = {
  title: "",
  content: "",
  targetType: "TODOS",
  courseId: ""
};

function AdminAnnouncements() {
  const [comunicados, setComunicados] = useState([]);
  const [cursos, setCursos] = useState([]);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [editandoId, setEditandoId] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      const [resComunicados, resCursos] = await Promise.all([
        api.get("/api/announcements"),
        api.get("/api/courses")
      ]);

      const listaComunicados = Array.isArray(resComunicados.data)
        ? resComunicados.data
        : resComunicados.data.comunicados || [];

      const listaCursos = Array.isArray(resCursos.data)
        ? resCursos.data
        : resCursos.data.cursos || [];

        console.log("Resposta da API de cursos:", resCursos.data);
        console.log("Lista de cursos:", listaCursos);

      setComunicados(listaComunicados);
      setCursos(listaCursos);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os comunicados."
      );
    } finally {
      setCarregando(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setFormulario(atual => ({
      ...atual,
      [campo]: valor
    }));
  }

  function limparFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setEditandoId(null);
  }

  function iniciarEdicao(comunicado) {
    setFormulario({
      title: comunicado.title,
      content: comunicado.content,
      targetType: comunicado.targetType,
      courseId: comunicado.courseId || ""
    });

    setEditandoId(comunicado.id);
    setErro("");
    setSucesso("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function salvarComunicado(event) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (
      formulario.targetType === "CURSO" &&
      !formulario.courseId
    ) {
      setErro("Selecione um curso para publicar o comunicado.");
      return;
    }

    const dados = {
      title: formulario.title.trim(),
      content: formulario.content.trim(),
      targetType: formulario.targetType,
      courseId:
        formulario.targetType === "CURSO"
          ? formulario.courseId
          : null
    };

    setSalvando(true);

    try {
      if (editandoId) {
        await api.put(
          `/api/announcements/${editandoId}`,
          dados
        );

        setSucesso("Comunicado atualizado com sucesso!");
      } else {
        await api.post("/api/announcements", dados);

        setSucesso("Comunicado publicado com sucesso!");
      }

      limparFormulario();
      await carregarDados();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível salvar o comunicado."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(comunicado) {
    const acao = comunicado.isActive ? "desativar" : "reativar";

    const confirmado = window.confirm(
      `Deseja realmente ${acao} este comunicado?`
    );

    if (!confirmado) return;

    setErro("");
    setSucesso("");

    try {
      await api.put(`/api/announcements/${comunicado.id}`, {
        isActive: !comunicado.isActive
      });

      setSucesso(
        comunicado.isActive
          ? "Comunicado desativado com sucesso!"
          : "Comunicado reativado com sucesso!"
      );

      await carregarDados();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível alterar o status do comunicado."
      );
    }
  }

  async function excluirComunicado(comunicado) {
    const confirmado = window.confirm(
      `Deseja excluir definitivamente o comunicado "${comunicado.title}"?`
    );

    if (!confirmado) return;

    setErro("");
    setSucesso("");

    try {
      await api.delete(`/api/announcements/${comunicado.id}`);

      setSucesso("Comunicado excluído com sucesso!");

      if (editandoId === comunicado.id) {
        limparFormulario();
      }

      await carregarDados();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível excluir o comunicado."
      );
    }
  }

  function obterPublico(comunicado) {
    switch (comunicado.targetType) {
      case "TODOS":
        return "Todos os usuários";

      case "ALUNOS":
        return "Somente alunos";

      case "CURSO":
        return `Curso: ${
          comunicado.targetCourse?.name || "Curso não identificado"
        }`;

      default:
        return comunicado.targetType;
    }
  }

  function formatarData(data) {
    if (!data) return "Data não disponível";

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  const comunicadosFiltrados = comunicados.filter(comunicado =>
    `${comunicado.title} ${comunicado.content}`
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  const totalAtivos = comunicados.filter(
    comunicado => comunicado.isActive
  ).length;

  const totalInativos = comunicados.length - totalAtivos;

  return (
    <div className="admin-announcements">
      <div className="announcements-header">
        <div>
          <h1>
            <Megaphone size={27} />
            Comunicados
          </h1>

          <p>
            Publique e gerencie comunicados da instituição.
          </p>
        </div>

        <button
          className="announcements-refresh"
          onClick={carregarDados}
          disabled={carregando}
          type="button"
        >
          <RefreshCw size={17} />
          Atualizar
        </button>
      </div>

      <div className="announcements-stats">
        <div className="announcement-stat-card">
          <div className="announcement-stat-icon">
            <Megaphone size={22} />
          </div>

          <div>
            <span>Total de comunicados</span>
            <strong>{comunicados.length}</strong>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon ativo">
            <Power size={22} />
          </div>

          <div>
            <span>Comunicados ativos</span>
            <strong>{totalAtivos}</strong>
          </div>
        </div>

        <div className="announcement-stat-card">
          <div className="announcement-stat-icon inativo">
            <Power size={22} />
          </div>

          <div>
            <span>Comunicados inativos</span>
            <strong>{totalInativos}</strong>
          </div>
        </div>
      </div>

      {erro && (
        <div className="announcement-feedback error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="announcement-feedback success">
          {sucesso}
        </div>
      )}

      <section className="announcement-form-card">
        <div className="announcement-section-title">
          <div>
            {editandoId ? <Pencil size={21} /> : <Plus size={21} />}

            <h2>
              {editandoId
                ? "Editar comunicado"
                : "Publicar comunicado"}
            </h2>
          </div>

          {editandoId && (
            <button
              type="button"
              className="announcement-cancel-edit"
              onClick={limparFormulario}
            >
              <X size={16} />
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={salvarComunicado}>
          <div className="announcement-form-group">
            <label htmlFor="announcement-title">
              Título do comunicado
            </label>

            <input
              id="announcement-title"
              type="text"
              value={formulario.title}
              onChange={event =>
                atualizarCampo("title", event.target.value)
              }
              placeholder="Digite o título do comunicado"
              maxLength={150}
              required
            />
          </div>

          <div className="announcement-form-group">
            <label htmlFor="announcement-content">
              Conteúdo
            </label>

            <textarea
              id="announcement-content"
              value={formulario.content}
              onChange={event =>
                atualizarCampo("content", event.target.value)
              }
              placeholder="Escreva o conteúdo do comunicado..."
              rows={5}
              required
            />
          </div>

          <div className="announcement-form-group">
            <label htmlFor="announcement-target">
              Público-alvo
            </label>

            <select
              id="announcement-target"
              value={formulario.targetType}
              onChange={event => {
                atualizarCampo("targetType", event.target.value);
                atualizarCampo("courseId", "");
              }}
            >
              <option value="TODOS">Todos os usuários</option>
              <option value="ALUNOS">Somente alunos</option>
              <option value="CURSO">Alunos de um curso específico</option>
            </select>
          </div>

          {formulario.targetType === "CURSO" && (
            <div className="announcement-form-group">
              <label htmlFor="announcement-course">
                Selecione o curso
              </label>

              <select
                id="announcement-course"
                value={formulario.courseId}
                onChange={event =>
                  atualizarCampo("courseId", event.target.value)
                }
                required
              >
                <option value="">Selecione um curso</option>

                {cursos.map(curso => (
                  <option key={curso.id} value={curso.id}>
                    {curso.name}
                  </option>
                ))}
              </select>

              {cursos.length === 0 && (
                <small>
                  Nenhum curso ativo foi encontrado.
                </small>
              )}
            </div>
          )}

          <div className="announcement-form-actions">
            <button
              type="submit"
              className="announcement-submit"
              disabled={salvando}
            >
              <Megaphone size={18} />

              {salvando
                ? "Salvando..."
                : editandoId
                  ? "Salvar alterações"
                  : "Publicar comunicado"}
            </button>
          </div>
        </form>
      </section>

      <section className="announcement-list-card">
        <div className="announcement-list-header">
          <div className="announcement-section-title">
            <Users size={21} />
            <h2>Comunicados publicados</h2>
          </div>

          <div className="announcement-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar comunicado..."
              value={busca}
              onChange={event => setBusca(event.target.value)}
            />
          </div>
        </div>

        {carregando ? (
          <div className="announcement-empty">
            Carregando comunicados...
          </div>
        ) : comunicadosFiltrados.length === 0 ? (
          <div className="announcement-empty">
            {busca
              ? "Nenhum comunicado encontrado para essa busca."
              : "Nenhum comunicado publicado até o momento."}
          </div>
        ) : (
          <div className="announcement-list">
            {comunicadosFiltrados.map(comunicado => (
              <article
                className="announcement-item"
                key={comunicado.id}
              >
                <div className="announcement-item-top">
                  <div className="announcement-item-title">
                    <h3>{comunicado.title}</h3>

                    <span
                      className={`announcement-status ${
                        comunicado.isActive ? "ativo" : "inativo"
                      }`}
                    >
                      {comunicado.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="announcement-item-actions">
                    <button
                      type="button"
                      className="announcement-action edit"
                      onClick={() => iniciarEdicao(comunicado)}
                      title="Editar comunicado"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      className="announcement-action toggle"
                      onClick={() => alterarStatus(comunicado)}
                      title={
                        comunicado.isActive
                          ? "Desativar comunicado"
                          : "Reativar comunicado"
                      }
                    >
                      <Power size={17} />
                    </button>

                    <button
                      type="button"
                      className="announcement-action delete"
                      onClick={() => excluirComunicado(comunicado)}
                      title="Excluir comunicado"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <p className="announcement-item-content">
                  {comunicado.content}
                </p>

                <div className="announcement-item-info">
                  <span>
                    <GraduationCap size={16} />
                    {obterPublico(comunicado)}
                  </span>

                  <span>
                    <Users size={16} />
                    {comunicado._count?.recipients ?? 0} destinatários
                  </span>

                  <span>
                    {formatarData(comunicado.publishedAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminAnnouncements;
