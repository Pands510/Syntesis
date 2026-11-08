import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  RefreshCw,
  UserCheck,
  UserX,
  GraduationCap,
  X,
  AlertTriangle
} from "lucide-react";

import api from "../../services/api";
import "./AdminStudents.css";

const formularioInicial = {
  name: "",
  email: "",
  password: "",
  registrationNumber: "",
  courseId: "",
  semester: "1"
};

function AdminStudents() {
  const [alunos, setAlunos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);

  async function buscarAlunos() {
    try {
      setErro("");

      const resposta = await api.get("/api/admin/students");

      setAlunos(resposta.data.alunos || []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os alunos."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function buscarCursos() {
    try {
      const resposta = await api.get("/api/courses");

      setCursos(resposta.data.cursos || []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
    }
  }

  useEffect(() => {
    buscarAlunos();
    buscarCursos();
  }, []);

  const cursosAtivos = useMemo(
    () => cursos.filter((curso) => curso.isActive !== false),
    [cursos]
  );

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      const nome = aluno.user?.name || "";
      const email = aluno.user?.email || "";
      const matricula = aluno.registrationNumber || "";

      const termo = pesquisa.toLowerCase();

      const correspondePesquisa =
        nome.toLowerCase().includes(termo) ||
        email.toLowerCase().includes(termo) ||
        matricula.toLowerCase().includes(termo);

      const correspondeCurso =
        !filtroCurso ||
        aluno.academicCourse?.id === filtroCurso;

      const correspondeSituacao =
        !filtroSituacao ||
        aluno.status === filtroSituacao;

      return (
        correspondePesquisa &&
        correspondeCurso &&
        correspondeSituacao
      );
    });
  }, [alunos, pesquisa, filtroCurso, filtroSituacao]);

  const totalAtivos = alunos.filter(
    (aluno) => aluno.status === "ATIVO"
  ).length;

  const totalTrancados = alunos.filter(
    (aluno) => aluno.status === "TRANCADO"
  ).length;

  const totalConcluidos = alunos.filter(
    (aluno) => aluno.status === "CONCLUIDO"
  ).length;

  function abrirCadastro() {
    setAlunoEditando(null);
    setFormulario(formularioInicial);
    setModalAberto(true);
  }

  function abrirEdicao(aluno) {
    setAlunoEditando(aluno);

    setFormulario({
      name: aluno.user?.name || "",
      email: aluno.user?.email || "",
      password: "",
      registrationNumber: aluno.registrationNumber || "",
      courseId: "",
      semester: String(aluno.semester || 1)
    });

    setModalAberto(true);
  }

    function fecharModal() {
      setModalAberto(false);
      setAlunoEditando(null);
      setFormulario(formularioInicial);
    }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((atual) => ({
      ...atual,
      [name]: value
    }));
  }

  async function salvarAluno(event) {
    event.preventDefault();

    const semestre = Number(formulario.semester);

    if (!Number.isInteger(semestre) || semestre < 1) {
      alert("Informe um semestre curricular válido.");
      return;
    }

    if (!alunoEditando && !formulario.courseId) {
      alert("Selecione um curso para o aluno.");
      return;
    }

    const cursoSelecionado = cursos.find(
      (curso) => curso.id === formulario.courseId
    );

    if (
      !alunoEditando &&
      cursoSelecionado?.totalSemesters &&
      semestre > cursoSelecionado.totalSemesters
    ) {
      alert(
        `O curso selecionado possui ${cursoSelecionado.totalSemesters} semestres.`
      );
      return;
    }

    try {
      setSalvando(true);

      if (alunoEditando) {
        const dados = {
          name: formulario.name.trim(),
          email: formulario.email.trim(),
          registrationNumber: formulario.registrationNumber.trim(),
          semester: semestre
        };

        if (formulario.password.trim()) {
          dados.password = formulario.password;
        }

        await api.put(
          `/api/admin/students/${alunoEditando.id}`,
          dados
        );
      } else {
        await api.post("/api/admin/students", {
          name: formulario.name.trim(),
          email: formulario.email.trim(),
          password: formulario.password,
          registrationNumber: formulario.registrationNumber.trim(),
          courseId: formulario.courseId,
          semester: semestre
        });
      }

      fecharModal();
      await buscarAlunos();

      alert(
        alunoEditando
          ? "Dados do aluno atualizados com sucesso!"
          : "Aluno cadastrado com sucesso!"
      );
    } catch (error) {
      alert(
        error.response?.data?.mensagem ||
        "Não foi possível salvar os dados do aluno."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSituacao(aluno, novoStatus) {
    const mensagens = {
      ATIVO: "Deseja realmente reativar a situação acadêmica deste aluno?",
      TRANCADO: "Deseja realmente trancar a matrícula deste aluno?",
      CONCLUIDO: "Deseja realmente registrar a conclusão deste aluno?"
    };

    if (!window.confirm(mensagens[novoStatus])) return;

    try {
      await api.patch(
        `/api/admin/students/${aluno.id}/status`,
        { status: novoStatus }
      );

      await buscarAlunos();
    } catch (error) {
      alert(
        error.response?.data?.mensagem ||
        "Não foi possível alterar a situação acadêmica."
      );
    }
  }

  async function alterarConta(aluno) {
    const usuario = aluno.user;

    if (!usuario) return;

    const novaSituacao = !usuario.isActive;

    const mensagem = novaSituacao
      ? "Deseja ativar o acesso deste aluno ao sistema?"
      : "Deseja desativar o acesso deste aluno ao sistema?";

    if (!window.confirm(mensagem)) return;

    try {
      await api.patch(
        `/api/admin/users/${usuario.id}/status`,
        { isActive: novaSituacao }
      );

      await buscarAlunos();
    } catch (error) {
      alert(
        error.response?.data?.mensagem ||
        "Não foi possível alterar o acesso do aluno."
      );
    }
  }

  function obterClasseSituacao(status) {
    return {
      ATIVO: "students-status-active",
      TRANCADO: "students-status-locked",
      CONCLUIDO: "students-status-completed"
    }[status] || "";
  }

  function obterTextoSituacao(status) {
    return {
      ATIVO: "Ativo",
      TRANCADO: "Trancado",
      CONCLUIDO: "Concluído"
    }[status] || status;
  }

  function semestreForaDaDuracao(aluno) {
    const total = aluno.academicCourse?.totalSemesters;

    return (
      total &&
      aluno.semester > total
    );
  }

  return (
    <div className="students-page">
      <div className="students-heading">
        <div>
          <span className="students-eyebrow">
            ADMINISTRAÇÃO ACADÊMICA
          </span>

          <h2>Gerenciamento de alunos</h2>

          <p>
            Consulte e gerencie os dados acadêmicos dos alunos.
          </p>
        </div>

        <button
          className="students-primary-button"
          onClick={abrirCadastro}
        >
          <Plus size={19} />
          Cadastrar aluno
        </button>
      </div>

      <div className="students-summary">
        <div className="students-summary-card">
          <div className="students-summary-icon">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Total de alunos</span>
            <strong>{alunos.length}</strong>
          </div>
        </div>

        <div className="students-summary-card">
          <div className="students-summary-icon active">
            <UserCheck size={22} />
          </div>

          <div>
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
          </div>
        </div>

        <div className="students-summary-card">
          <div className="students-summary-icon locked">
            <UserX size={22} />
          </div>

          <div>
            <span>Trancados</span>
            <strong>{totalTrancados}</strong>
          </div>
        </div>

        <div className="students-summary-card">
          <div className="students-summary-icon completed">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Concluídos</span>
            <strong>{totalConcluidos}</strong>
          </div>
        </div>
      </div>

      <div className="students-panel">
        <div className="students-toolbar">
          <div className="students-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Pesquisar por nome, e-mail ou matrícula..."
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
            />
          </div>

          <select
            value={filtroCurso}
            onChange={(event) => setFiltroCurso(event.target.value)}
          >
            <option value="">Todos os cursos</option>

            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.name}
              </option>
            ))}
          </select>

          <select
            value={filtroSituacao}
            onChange={(event) => setFiltroSituacao(event.target.value)}
          >
            <option value="">Todas as situações</option>
            <option value="ATIVO">Ativos</option>
            <option value="TRANCADO">Trancados</option>
            <option value="CONCLUIDO">Concluídos</option>
          </select>

          <button
            className="students-refresh-button"
            onClick={buscarAlunos}
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {erro && (
          <div className="students-error">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="students-empty">
            Carregando alunos...
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="students-empty">
            Nenhum aluno encontrado.
          </div>
        ) : (
          <div className="students-table-wrapper">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Matrícula</th>
                  <th>Curso</th>
                  <th>Semestre</th>
                  <th>Situação acadêmica</th>
                  <th>Acesso ao sistema</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {alunosFiltrados.map((aluno) => {
                  const foraDaDuracao =
                    semestreForaDaDuracao(aluno);

                  return (
                    <tr key={aluno.id}>
                      <td>
                        <div className="students-user-cell">
                          <div className="students-avatar">
                            {aluno.user?.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>

                          <div>
                            <strong>{aluno.user?.name || "Sem nome"}</strong>
                            <span>{aluno.user?.email || "Sem e-mail"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{aluno.registrationNumber}</td>

                      <td>
                        {aluno.academicCourse?.name || (
                          <span className="students-warning-text">
                            Sem curso vinculado
                          </span>
                        )}
                      </td>

                      <td>
                        {aluno.academicCourse ? (
                          <div className="students-semester">
                            <span>
                              {aluno.semester}º / {aluno.academicCourse.totalSemesters}º
                            </span>

                            {foraDaDuracao && (
                              <span
                                className="students-warning"
                                title="O semestre cadastrado ultrapassa a duração do curso."
                              >
                                <AlertTriangle size={15} />
                                Fora da duração
                              </span>
                            )}
                          </div>
                        ) : (
                          `${aluno.semester}º`
                        )}
                      </td>

                      <td>
                        <span
                          className={`students-status ${obterClasseSituacao(aluno.status)}`}
                        >
                          {obterTextoSituacao(aluno.status)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`students-account ${
                            aluno.user?.isActive
                              ? "students-account-active"
                              : "students-account-inactive"
                          }`}
                        >
                          {aluno.user?.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td>
                        <div className="students-actions">
                          <button
                            className="students-action edit"
                            title="Editar dados"
                            onClick={() => abrirEdicao(aluno)}
                          >
                            <Pencil size={17} />
                          </button>

                          {aluno.status === "ATIVO" && (
                            <>
                              <button
                                className="students-action lock"
                                title="Trancar matrícula"
                                onClick={() =>
                                  alterarSituacao(aluno, "TRANCADO")
                                }
                              >
                                <UserX size={17} />
                              </button>

                              <button
                                className="students-action complete"
                                title="Concluir aluno"
                                onClick={() =>
                                  alterarSituacao(aluno, "CONCLUIDO")
                                }
                              >
                                <GraduationCap size={17} />
                              </button>
                            </>
                          )}

                          {aluno.status !== "ATIVO" && (
                            <button
                              className="students-action activate"
                              title="Reativar situação acadêmica"
                              onClick={() =>
                                alterarSituacao(aluno, "ATIVO")
                              }
                            >
                              <UserCheck size={17} />
                            </button>
                          )}

                          <button
                            className={`students-action ${
                              aluno.user?.isActive
                                ? "deactivate"
                                : "activate"
                            }`}
                            title={
                              aluno.user?.isActive
                                ? "Desativar acesso"
                                : "Ativar acesso"
                            }
                            onClick={() => alterarConta(aluno)}
                          >
                            {aluno.user?.isActive ? (
                              <UserX size={17} />
                            ) : (
                              <UserCheck size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="students-table-footer">
          Exibindo {alunosFiltrados.length} de {alunos.length} alunos
        </div>
      </div>

      {modalAberto && (
        <div className="students-modal-overlay">
          <div className="students-modal">
            <div className="students-modal-header">
              <div>
                <h3>
                  {alunoEditando ? "Editar aluno" : "Cadastrar aluno"}
                </h3>

                <p>
                  {alunoEditando
                    ? "Atualize os dados cadastrais."
                    : "Preencha os dados para cadastrar um novo aluno."}
                </p>
              </div>

              <button
                type="button"
                className="students-modal-close"
                onClick={fecharModal}
                disabled={salvando}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={salvarAluno}>
              <div className="students-form-grid">
                <label>
                  Nome completo
                  <input
                    name="name"
                    value={formulario.name}
                    onChange={atualizarCampo}
                    required
                  />
                </label>

                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    value={formulario.email}
                    onChange={atualizarCampo}
                    required
                  />
                </label>

                <label>
                  Matrícula
                  <input
                    name="registrationNumber"
                    value={formulario.registrationNumber}
                    onChange={atualizarCampo}
                    required
                  />
                </label>

                <label>
                  Senha {alunoEditando && "(deixe em branco para manter)"}
                  <input
                    name="password"
                    type="password"
                    value={formulario.password}
                    onChange={atualizarCampo}
                    required={!alunoEditando}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>

                {!alunoEditando && (
                  <label className="students-form-full">
                    Curso
                    <select
                      name="courseId"
                      value={formulario.courseId}
                      onChange={atualizarCampo}
                      required
                    >
                      <option value="">Selecione um curso</option>

                      {cursosAtivos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.name} ({curso.totalSemesters} semestres)
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  Semestre curricular
                  <input
                    name="semester"
                    type="number"
                    min="1"
                    max={
                      !alunoEditando
                        ? cursos.find(
                            (curso) => curso.id === formulario.courseId
                          )?.totalSemesters || undefined
                        : undefined
                    }
                    value={formulario.semester}
                    onChange={atualizarCampo}
                    required
                  />
                </label>
              </div>

              {alunoEditando && (
                <p className="students-edit-note">
                  O curso atual não pode ser alterado por esta tela.
                  Uma transferência exige um procedimento acadêmico próprio,
                  com registro no histórico do aluno.
                </p>
              )}

              <div className="students-modal-actions">
                <button
                  type="button"
                  className="students-secondary-button"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="students-primary-button"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar aluno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminStudents;