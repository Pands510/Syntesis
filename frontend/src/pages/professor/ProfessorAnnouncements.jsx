
import { useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  User
} from "lucide-react";

import api from "../../services/api";
import "../admin/AdminAnnouncements.css";

const FORMULARIO_INICIAL = {
  title: "",
  content: "",
  targetType: "TODAS_TURMAS",
  classId: "",
  studentId: ""
};

function ProfessorAnnouncements() {
  const [comunicados, setComunicados] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [turmas, setTurmas] = useState([]);

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
      const [
        resComunicados,
        resMatriculas,
        resTurmas
      ] = await Promise.all([
        api.get("/api/announcements"),
        api.get("/api/enrollments"),
        api.get("/api/school-classes")
      ]);

      const listaComunicados = Array.isArray(resComunicados.data)
        ? resComunicados.data
        : resComunicados.data.comunicados || [];

      const listaMatriculas = Array.isArray(resMatriculas.data)
        ? resMatriculas.data
        : resMatriculas.data.matriculas || [];

      const listaTurmas = Array.isArray(resTurmas.data)
        ? resTurmas.data
        : resTurmas.data.turmas || [];

      setComunicados(listaComunicados);
      setMatriculas(listaMatriculas);
      setTurmas(listaTurmas);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os dados dos comunicados."
      );
    } finally {
      setCarregando(false);
    }
  }

  const matriculasAtivas = useMemo(
    () => matriculas.filter(matricula =>
      matricula.status === "ATIVA"
    ),
    [matriculas]
  );

  const turmasDisponiveis = useMemo(() => {
    const idsComMatriculasAtivas = new Set(
      matriculasAtivas.map(matricula => matricula.schoolClass?.id)
    );

    return turmas.filter(turma =>
      turma.isActive !== false &&
      idsComMatriculasAtivas.has(turma.id)
    );
  }, [turmas, matriculasAtivas]);

  const alunosDisponiveis = useMemo(() => {
    const alunosMap = new Map();

    matriculasAtivas.forEach(matricula => {
      const aluno = matricula.student;

      if (!aluno?.id) return;

      if (!alunosMap.has(aluno.id)) {
        alunosMap.set(aluno.id, {
          id: aluno.id,
          name: aluno.user?.name || "Aluno sem nome",
          registrationNumber: aluno.registrationNumber || "",
          turmas: []
        });
      }

      const alunoAtual = alunosMap.get(aluno.id);
      const nomeTurma = matricula.schoolClass?.name;

      if (
        nomeTurma &&
        !alunoAtual.turmas.includes(nomeTurma)
      ) {
        alunoAtual.turmas.push(nomeTurma);
      }
    });

    return Array.from(alunosMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [matriculasAtivas]);

  const alunosDaTurmaSelecionada = useMemo(() => {
    if (!formulario.classId) return [];

    const alunosMap = new Map();

    matriculasAtivas
      .filter(matricula =>
        matricula.schoolClass?.id === formulario.classId
      )
      .forEach(matricula => {
        const aluno = matricula.student;

        if (!aluno?.id) return;

        alunosMap.set(aluno.id, {
          id: aluno.id,
          name: aluno.user?.name || "Aluno sem nome",
          registrationNumber: aluno.registrationNumber || ""
        });
      });

    return Array.from(alunosMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [matriculasAtivas, formulario.classId]);

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
      title: comunicado.title || "",
      content: comunicado.content || "",
      targetType: comunicado.targetType,
      classId: comunicado.classId || "",
      studentId: comunicado.studentId || ""
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
      formulario.targetType === "TURMA" &&
      !formulario.classId
    ) {
      setErro("Selecione uma turma para publicar o comunicado.");
      return;
    }

    if (
      formulario.targetType === "ALUNO" &&
      !formulario.studentId
    ) {
      setErro("Selecione um aluno para publicar o comunicado.");
      return;
    }

    const dados = {
      title: formulario.title.trim(),
      content: formulario.content.trim(),
      targetType: formulario.targetType,
      classId:
        formulario.targetType === "TURMA"
          ? formulario.classId
          : null,
      studentId:
        formulario.targetType === "ALUNO"
          ? formulario.studentId
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
      case "TODAS_TURMAS":
        return "Alunos de todas as minhas turmas";

      case "TURMA":
        return `Turma: ${
          comunicado.targetClass?.name ||
          turmas.find(turma => turma.id === comunicado.classId)?.name ||
          "Turma não identificada"
        }`;

      case "ALUNO": {
        const aluno = comunicado.targetStudent;

        return `Aluno: ${
          aluno?.user?.name ||
          aluno?.registrationNumber ||
          "Aluno não identificado"
        }`;
      }

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
            Publique avisos para os alunos das suas turmas.
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
            <label htmlFor="professor-announcement-title">
              Título do comunicado
            </label>

            <input
              id="professor-announcement-title"
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
            <label htmlFor="professor-announcement-content">
              Conteúdo
            </label>

            <textarea
              id="professor-announcement-content"
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
            <label htmlFor="professor-announcement-target">
              Público-alvo
            </label>

            <select
              id="professor-announcement-target"
              value={formulario.targetType}
              onChange={event => {
                setFormulario(atual => ({
                  ...atual,
                  targetType: event.target.value,
                  classId: "",
                  studentId: ""
                }));
              }}
            >
              <option value="TODAS_TURMAS">
                Todos os alunos das minhas turmas
              </option>

              <option value="TURMA">
                Uma turma específica
              </option>

              <option value="ALUNO">
                Um aluno específico
              </option>
            </select>
          </div>

          {formulario.targetType === "TURMA" && (
            <div className="announcement-form-group">
              <label htmlFor="professor-announcement-class">
                Selecione a turma
              </label>

              <select
                id="professor-announcement-class"
                value={formulario.classId}
                onChange={event =>
                  atualizarCampo("classId", event.target.value)
                }
                required
              >
                <option value="">Selecione uma turma</option>

                {turmasDisponiveis.map(turma => (
                  <option key={turma.id} value={turma.id}>
                    {turma.name}
                    {turma.discipline?.name
                      ? ` — ${turma.discipline.name}`
                      : ""}
                  </option>
                ))}
              </select>

              {turmasDisponiveis.length === 0 && (
                <small>
                  Nenhuma turma com matrículas ativas foi encontrada.
                </small>
              )}
            </div>
          )}

          {formulario.targetType === "ALUNO" && (
            <div className="announcement-form-group">
              <label htmlFor="professor-announcement-student">
                Selecione o aluno
              </label>

              <select
                id="professor-announcement-student"
                value={formulario.studentId}
                onChange={event =>
                  atualizarCampo("studentId", event.target.value)
                }
                required
              >
                <option value="">Selecione um aluno</option>

                {alunosDisponiveis.map(aluno => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.name}
                    {aluno.registrationNumber
                      ? ` — ${aluno.registrationNumber}`
                      : ""}
                  </option>
                ))}
              </select>

              {alunosDisponiveis.length === 0 && (
                <small>
                  Nenhum aluno com matrícula ativa foi encontrado nas suas turmas.
                </small>
              )}
            </div>
          )}

          <div className="announcement-form-actions">
            <button
              type="submit"
              className="announcement-submit"
              disabled={
                salvando ||
                (formulario.targetType === "TURMA" &&
                  turmasDisponiveis.length === 0) ||
                (formulario.targetType === "ALUNO" &&
                  alunosDisponiveis.length === 0)
              }
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
            <h2>Meus comunicados</h2>
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
              : "Você ainda não publicou nenhum comunicado."}
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
                    {comunicado.targetType === "ALUNO"
                      ? <User size={16} />
                      : <GraduationCap size={16} />}
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

export default ProfessorAnnouncements;
