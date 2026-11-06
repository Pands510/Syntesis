import { useEffect, useState } from "react";
import {
  UserPlus,
  UserRound,
  Mail,
  LockKeyhole,
  BriefcaseBusiness,
  Hash,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Search,
  Pencil,
  Power,
  X,
  RefreshCw
} from "lucide-react";

import api from "../../services/api";
import "./Professors.css";

function Professors() {
  const [formulario, setFormulario] = useState({
    name: "",
    email: "",
    password: "",
    employeeNumber: "",
    department: "",
    courseId: "",
    disciplineId: ""
  });

  useEffect(() => {
    buscarProfessores();
    buscarCursos();
  }, []);

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [professores, setProfessores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [buscandoCursos, setBuscandoCursos] = useState(false);
  const [buscandoDisciplinas, setBuscandoDisciplinas] = useState(false);
  const [buscandoProfessores, setBuscandoProfessores] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [professorEditando, setProfessorEditando] = useState(null);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function atualizarCurso(event) {
    const courseId = event.target.value;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      courseId,
      disciplineId: ""
    }));

    buscarDisciplinas(courseId);
  }

  function iniciarEdicao(professor) {
    setProfessorEditando(professor);
    
    setFormulario({
      name: professor.user.name,
      email: professor.user.email,
      password: "",
      employeeNumber: professor.employeeNumber || "",
      department: professor.department || "",
      courseId: professor.discipline?.course?.id || "",
      disciplineId: professor.discipline?.id || ""
    });
  
    if (professor.discipline?.course?.id) {
      buscarDisciplinas(professor.discipline.course.id);
    } else {
      setDisciplinas([]);
    }
  
    setMensagem("");
    setErro("");
  
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function buscarCursos() {
    try {
      setBuscandoCursos(true);

      const resposta = await api.get("/api/courses");

      setCursos(resposta.data.cursos || []);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);
      setErro("Não foi possível carregar os cursos.");
    } finally {
      setBuscandoCursos(false);
    }
  }

  async function buscarDisciplinas(courseId) {
    if (!courseId) {
      setDisciplinas([]);
      return;
    }

    try {
      setBuscandoDisciplinas(true);

      const resposta = await api.get("/api/disciplinas", {
        params: { courseId }
      });

      setDisciplinas(resposta.data.disciplinas || []);
    } catch (error) {
      console.error("Erro ao buscar disciplinas:", error);
      setErro("Não foi possível carregar as disciplinas.");
    } finally {
      setBuscandoDisciplinas(false);
    }
  }

  async function buscarProfessores() {
    try {
      setBuscandoProfessores(true);
      setErro("");

      const resposta = await api.get("/api/admin/professors");

      setProfessores(resposta.data.professores || []);

    } catch (error) {
      console.error("Erro ao buscar professores:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os professores."
      );

    } finally {
      setBuscandoProfessores(false);
    }
  }

  async function cadastrarProfessor(event) {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (formulario.password.length < 8) {
      setErro("A senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.post(
        "/api/admin/professors",
        formulario
      );

      setMensagem(
        resposta.data.mensagem || "Professor cadastrado com sucesso!"
      );

      setFormulario({
        name: "",
        email: "",
        password: "",
        employeeNumber: "",
        department: ""
      });

      if (professor.discipline?.course?.id) {
        buscarDisciplinas(professor.discipline.course.id);
      } else {
        setDisciplinas([]);
      }

      await buscarProfessores();

    } catch (error) {
      console.error("Erro ao cadastrar professor:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível cadastrar o professor."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (formulario.password && formulario.password.length < 8) {
      setErro("A nova senha deve possuir pelo menos 8 caracteres.");
      return;
    }

    try {
      setCarregando(true);

      const resposta = await api.put(
        `/api/admin/professors/${professorEditando.id}`,
        {
          name: formulario.name,
          email: formulario.email,
          employeeNumber: formulario.employeeNumber,
          department: formulario.department,
          disciplineId: formulario.disciplineId,
          password: formulario.password || undefined
        }
      );

      setMensagem(
        resposta.data.mensagem || "Professor atualizado com sucesso!"
      );

      setProfessorEditando(null);

      setFormulario({
        name: "",
        email: "",
        password: "",
        employeeNumber: "",
        department: "",
        courseId: "",
        disciplineId: ""
      });

      await buscarProfessores();

    } catch (error) {
      console.error("Erro ao editar professor:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível atualizar o professor."
      );

    } finally {
      setCarregando(false);
    }
  }

  async function alterarStatus(professor) {
    const acao = professor.user.isActive ? "desativar" : "ativar";

    const confirmado = window.confirm(
      `Deseja realmente ${acao} o acesso de ${professor.user.name}?`
    );

    if (!confirmado) return;

    try {
      setErro("");
      setMensagem("");

      await api.patch(
        `/api/admin/users/${professor.user.id}/status`,
        {
          isActive: !professor.user.isActive
        }
      );

      setMensagem(
        `Professor ${acao === "ativar" ? "ativado" : "desativado"} com sucesso!`
      );

      await buscarProfessores();

    } catch (error) {
      console.error("Erro ao alterar situação do professor:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível alterar a situação do professor."
      );
    }
  }

  const professoresFiltrados = professores.filter((professor) => {
    const termo = pesquisa.toLowerCase().trim();

    return (
      professor.user.name.toLowerCase().includes(termo) ||
      professor.user.email.toLowerCase().includes(termo) ||
      (professor.employeeNumber || "").toLowerCase().includes(termo) ||
      (professor.department || "").toLowerCase().includes(termo) ||
      (professor.discipline?.name || "").toLowerCase().includes(termo) ||
      (professor.discipline?.code || "").toLowerCase().includes(termo)
    );
  });

  return (
    <div className="professors-page">
      <div className="professors-heading">
        <div>
          <h2>
            {professorEditando ? "Editar professor" : "Cadastrar professor"}
          </h2>
          <p>
            {professorEditando
              ? "Atualize as informações do professor cadastrado."
              : "Cadastre novos professores e disponibilize o acesso ao Syntesis."}
          </p>
        </div>

        <div className="professors-heading-icon">
          <UserPlus size={25} />
        </div>
      </div>

      <div className="professors-form-card">
        <div className="professors-form-header">
          <div className="professors-form-icon">
            <UserRound size={23} />
          </div>

          <div>
            <h3>Informações do professor</h3>
            <p>Preencha os dados para criar uma nova conta.</p>
          </div>
        </div>

        {mensagem && (
          <div className="professors-feedback success" role="status">
            <CheckCircle2 size={19} />
            <span>{mensagem}</span>
          </div>
        )}

        {erro && (
          <div className="professors-feedback error" role="alert">
            <AlertCircle size={19} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={professorEditando ? salvarEdicao : cadastrarProfessor}>
          <div className="professors-form-grid">

            <div className="professors-field full">
              <label htmlFor="name">Nome completo *</label>

              <div className="professors-input-wrapper">
                <UserRound size={18} />

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Digite o nome completo"
                  value={formulario.name}
                  onChange={atualizarCampo}
                  required
                />
              </div>
            </div>

            <div className="professors-field">
              <label htmlFor="email">E-mail *</label>

              <div className="professors-input-wrapper">
                <Mail size={18} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="professor@email.com"
                  value={formulario.email}
                  onChange={atualizarCampo}
                  required
                />
              </div>
            </div>

            <div className="professors-field">
              <label htmlFor="password">
                {professorEditando ? "Nova senha (opcional)" : "Senha inicial *"}
              </label>

              <div className="professors-input-wrapper">
                <LockKeyhole size={18} />

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={
                    professorEditando
                      ? "Deixe vazio para manter a senha atual"
                      : "Mínimo de 8 caracteres"
                  }
                  value={formulario.password}
                  onChange={atualizarCampo}
                  minLength={8}
                  required={!professorEditando}
                />
              </div>
            </div>

            <div className="professors-field">
              <label htmlFor="employeeNumber">
                Matrícula funcional
              </label>

              <div className="professors-input-wrapper">
                <Hash size={18} />

                <input
                  id="employeeNumber"
                  name="employeeNumber"
                  type="text"
                  placeholder="Número de matrícula"
                  value={formulario.employeeNumber}
                  onChange={atualizarCampo}
                />
              </div>
            </div>

            <div className="professors-field">
              <label htmlFor="department">Departamento</label>

              <div className="professors-input-wrapper">
                <BriefcaseBusiness size={18} />

                <input
                  id="department"
                  name="department"
                  type="text"
                  placeholder="Ex.: Informática"
                  value={formulario.department}
                  onChange={atualizarCampo}
                />
              </div>
            </div>

            <div className="professors-field">
              <label htmlFor="courseId">Curso</label>

              <select
                id="courseId"
                name="courseId"
                value={formulario.courseId}
                onChange={atualizarCurso}
                required
              >
                <option value="">Selecione um curso</option>

                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.name} ({curso.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="professors-field">
              <label htmlFor="disciplineId">Disciplina</label>

              <select
                id="disciplineId"
                name="disciplineId"
                value={formulario.disciplineId}
                onChange={atualizarCampo}
                disabled={!formulario.courseId || buscandoDisciplinas}
                required
              >
                <option value="">
                  {!formulario.courseId
                    ? "Selecione primeiro um curso"
                    : buscandoDisciplinas
                      ? "Carregando disciplinas..."
                      : "Selecione uma disciplina"}
                </option>
                  
                {disciplinas.map((disciplina) => (
                  <option key={disciplina.id} value={disciplina.id}>
                    {disciplina.name} ({disciplina.code})
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="professors-form-footer">
            <span>Campos obrigatórios</span>

            {professorEditando && (
              <button
                type="button"
                className="professors-cancel-button"
                onClick={() => {
                  setProfessorEditando(null);
                
                  setFormulario({
                    name: "",
                    email: "",
                    password: "",
                    employeeNumber: "",
                    department: "",
                    courseId: "",
                    disciplineId: ""
                  });
                
                  setMensagem("");
                  setErro("");
                }}
              >
                <X size={18} />
                Cancelar edição
              </button>
            )}

            <button
              type="submit"
              className="professors-submit-button"
              disabled={carregando}
            >
              {carregando
                ? professorEditando
                  ? "Salvando alterações..."
                  : "Cadastrando..."
                : professorEditando
                  ? "Salvar alterações"
                  : "Cadastrar professor"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de professores cadastrados */}
      <div className="professors-list-card">
        <div className="professors-list-header">
          <div>
            <h2>Professores cadastrados</h2>
            <p>Gerencie os professores registrados no sistema.</p>
          </div>

          <button
            type="button"
            className="professors-refresh-button"
            onClick={buscarProfessores}
            disabled={buscandoProfessores}
            title="Atualizar lista"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="professors-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, matrícula ou departamento..."
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
          />
        </div>

        {buscandoProfessores ? (
          <p className="professors-list-message">
            Carregando professores...
          </p>
        ) : professoresFiltrados.length === 0 ? (
          <p className="professors-list-message">
            {pesquisa
              ? "Nenhum professor encontrado para essa pesquisa."
              : "Nenhum professor cadastrado."}
          </p>
        ) : (
          <div className="professors-table-wrapper">
            <table className="professors-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Matrícula</th>
                  <th>Departamento</th>
                  <th>Disciplina</th>
                  <th>Status da conta</th>
                  <th>Ações</th>
                </tr>
              </thead>

<tbody>
                {professoresFiltrados.map((professor) => (
                  <tr key={professor.id}>
                    <td>
                      <strong>{professor.user.name}</strong>
                      <span>{professor.user.email}</span>
                    </td>

                    <td>{professor.employeeNumber || "—"}</td>
                    <td>{professor.department || "—"}</td>

                    <td>
                      {professor.discipline
                        ? `${professor.discipline.name} (${professor.discipline.code})`
                        : "Não atribuída"}
                    </td>

                    <td>
                      <span
                        className={
                          professor.user.isActive
                            ? "professors-status active"
                            : "professors-status inactive"
                        }
                      >
                        {professor.user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="professors-actions">
                        <button
                          type="button"
                          className="professors-edit-button"
                          onClick={() => iniciarEdicao(professor)}
                          title="Editar professor"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className={
                            professor.user.isActive
                              ? "professors-deactivate-button"
                              : "professors-activate-button"
                          }
                          onClick={() => alterarStatus(professor)}
                          title={
                            professor.user.isActive
                              ? "Desativar professor"
                              : "Ativar professor"
                          }
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Professors;