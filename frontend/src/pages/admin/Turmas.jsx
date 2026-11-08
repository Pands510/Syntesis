
import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  Hash,
  Layers,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Save,
  CheckCircle2,
  X,
  School,
  UserRound
} from "lucide-react";

import api from "../../services/api";
import "./Turmas.css";

const formularioInicial = {
  name: "",
  code: "",
  courseId: "",
  disciplineId: "",
  professorId: "",
  academicTermId: ""
};

function Turmas() {
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [turmas, setTurmas] = useState([]);

  const [formulario, setFormulario] = useState(formularioInicial);

  const [carregando, setCarregando] = useState(true);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [formularioAberto, setFormularioAberto] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const periodosEmAndamento = periodos.filter(
    (periodo) => periodo.status === "EM_ANDAMENTO"
  );

  const disciplinaSelecionada = disciplinas.find(
    (disciplina) => disciplina.id === formulario.disciplineId
  );

  const periodoSelecionado = periodosEmAndamento.find(
    (periodo) => periodo.id === formulario.academicTermId
  );

  const professoresDisponiveis = professores.filter((professor) => {
    const disciplinaId =
      professor.disciplineId || professor.discipline?.id;

    return (
      disciplinaId === formulario.disciplineId &&
      professor.user?.isActive !== false
    );
  });

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [
        respostaCursos,
        respostaProfessores,
        respostaPeriodos,
        respostaTurmas
      ] = await Promise.all([
        api.get("/api/courses"),
        api.get("/api/admin/professors"),
        api.get("/api/academic-terms"),
        api.get("/api/school-classes")
      ]);

      setCursos(respostaCursos.data.cursos || []);
      setProfessores(respostaProfessores.data.professores || []);
      setPeriodos(respostaPeriodos.data.periodos || []);
      setTurmas(respostaTurmas.data.turmas || []);

    } catch (error) {
      console.error("Erro ao carregar dados das turmas:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os dados das turmas."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDisciplinas(courseId) {
    if (!courseId) {
      setDisciplinas([]);
      return;
    }

    try {
      setCarregandoDisciplinas(true);
      setErro("");

      const resposta = await api.get("/api/disciplinas", {
        params: { courseId }
      });

      setDisciplinas(resposta.data.disciplinas || []);

    } catch (error) {
      console.error("Erro ao carregar disciplinas:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar as disciplinas."
      );
    } finally {
      setCarregandoDisciplinas(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    carregarDisciplinas(formulario.courseId);
  }, [formulario.courseId]);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
      ...(name === "courseId"
        ? {
            disciplineId: "",
            professorId: ""
          }
        : {}),
      ...(name === "disciplineId"
        ? {
            professorId: ""
          }
        : {})
    }));

    setMensagem("");
    setErro("");
  }

  function limparFormulario() {
    setFormulario(formularioInicial);
  }

  async function cadastrarTurma(event) {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (!formulario.disciplineId) {
      setErro("Selecione uma disciplina.");
      return;
    }

    if (!formulario.professorId) {
      setErro("Selecione um professor.");
      return;
    }

    if (!periodoSelecionado) {
      setErro("Selecione um período letivo em andamento.");
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        name: formulario.name.trim(),
        code: formulario.code.trim(),
        academicYear: periodoSelecionado.year,
        term: periodoSelecionado.termNumber,
        disciplineId: formulario.disciplineId,
        professorId: formulario.professorId
      };

      const resposta = await api.post(
        "/api/school-classes",
        dados
      );

      const quantidade =
        resposta.data.matriculasCriadas ?? 0;

      setMensagem(
        `${resposta.data.mensagem || "Turma cadastrada com sucesso."} ` +
        `${quantidade} aluno(s) matriculado(s) automaticamente.`
      );

      limparFormulario();
      setFormularioAberto(false);

      await carregarDados();

    } catch (error) {
      console.error("Erro ao cadastrar turma:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível cadastrar a turma."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="classes-page">

      <div className="classes-heading">
        <div>
          <h2>Gerenciamento de turmas</h2>
          <p>
            Organize as turmas, professores e matrículas do período letivo.
          </p>
        </div>

        <div className="classes-heading-icon">
          <School size={25} />
        </div>
      </div>

      {erro && (
        <div className="classes-feedback error" role="alert">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      {mensagem && (
        <div className="classes-feedback success" role="status">
          <CheckCircle2 size={19} />
          <span>{mensagem}</span>
        </div>
      )}

      <div className="classes-register-card">

        <div className="classes-register-header">
          <div className="classes-section-heading">
            <div className="classes-section-icon">
              <Plus size={21} />
            </div>

            <div>
              <h3>Cadastrar turma</h3>
              <p>
                Crie uma turma e matricule automaticamente os alunos elegíveis.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="classes-register-toggle"
            onClick={() => {
              setFormularioAberto(!formularioAberto);
              setMensagem("");
              setErro("");
            }}
          >
            {formularioAberto ? (
              <>
                <X size={18} />
                Fechar
              </>
            ) : (
              <>
                <Plus size={18} />
                Nova turma
              </>
            )}
          </button>
        </div>

        {formularioAberto && (
          <form
            className="classes-form"
            onSubmit={cadastrarTurma}
          >

            <div className="classes-form-grid">

              <div className="classes-field">
                <label htmlFor="class-name">Nome da turma *</label>

                <div className="classes-input-wrapper">
                  <School size={18} />

                  <input
                    id="class-name"
                    name="name"
                    type="text"
                    placeholder="Ex.: Desenvolvimento Web - Turma A"
                    value={formulario.name}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
              </div>

              <div className="classes-field">
                <label htmlFor="class-code">Código da turma *</label>

                <div className="classes-input-wrapper">
                  <Hash size={18} />

                  <input
                    id="class-code"
                    name="code"
                    type="text"
                    placeholder="Ex.: DS-WEB-2026-001"
                    value={formulario.code}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
              </div>

              <div className="classes-field">
                <label htmlFor="class-course">Curso *</label>

                <div className="classes-input-wrapper">
                  <GraduationCap size={18} />

                  <select
                    id="class-course"
                    name="courseId"
                    value={formulario.courseId}
                    onChange={atualizarCampo}
                    required
                  >
                    <option value="">Selecione um curso</option>

                    {cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="classes-field">
                <label htmlFor="class-discipline">Disciplina *</label>

                <div className="classes-input-wrapper">
                  <BookOpen size={18} />

                  <select
                    id="class-discipline"
                    name="disciplineId"
                    value={formulario.disciplineId}
                    onChange={atualizarCampo}
                    disabled={
                      !formulario.courseId ||
                      carregandoDisciplinas
                    }
                    required
                  >
                    <option value="">
                      {carregandoDisciplinas
                        ? "Carregando disciplinas..."
                        : "Selecione uma disciplina"}
                    </option>

                    {disciplinas.map((disciplina) => (
                      <option
                        key={disciplina.id}
                        value={disciplina.id}
                      >
                        {disciplina.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="classes-field">
                <label htmlFor="class-professor">Professor *</label>

                <div className="classes-input-wrapper">
                  <UserRound size={18} />

                  <select
                    id="class-professor"
                    name="professorId"
                    value={formulario.professorId}
                    onChange={atualizarCampo}
                    disabled={!formulario.disciplineId}
                    required
                  >
                    <option value="">Selecione um professor</option>

                    {professoresDisponiveis.map((professor) => (
                      <option
                        key={professor.id}
                        value={professor.id}
                      >
                        {professor.user?.name || professor.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formulario.disciplineId &&
                  professoresDisponiveis.length === 0 && (
                    <span className="classes-field-hint">
                      Nenhum professor ativo vinculado a esta disciplina.
                    </span>
                  )}
              </div>

              <div className="classes-field">
                <label htmlFor="class-term">Período letivo *</label>

                <div className="classes-input-wrapper">
                  <CalendarDays size={18} />

                  <select
                    id="class-term"
                    name="academicTermId"
                    value={formulario.academicTermId}
                    onChange={atualizarCampo}
                    required
                  >
                    <option value="">
                      Selecione um período em andamento
                    </option>

                    {periodosEmAndamento.map((periodo) => (
                      <option
                        key={periodo.id}
                        value={periodo.id}
                      >
                        {periodo.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {disciplinaSelecionada && (
              <div className="classes-info-box">
                <Layers size={19} />

                <span>
                  Semestre curricular da disciplina:{" "}
                  <strong>
                    {disciplinaSelecionada.semester}º semestre
                  </strong>
                </span>
              </div>
            )}

            {periodoSelecionado && (
              <div className="classes-info-box">
                <CalendarDays size={19} />

                <span>
                  Período selecionado:{" "}
                  <strong>
                    {periodoSelecionado.name}
                  </strong>
                </span>
              </div>
            )}

            {periodosEmAndamento.length === 0 && (
              <div className="classes-warning">
                <AlertCircle size={18} />
                Não existe período letivo em andamento. Cadastre ou inicie um
                período antes de criar uma turma.
              </div>
            )}

            <div className="classes-form-footer">
              <span>* Campos obrigatórios</span>

              <div className="classes-form-actions">
                <button
                  type="button"
                  className="classes-cancel-button"
                  onClick={() => {
                    limparFormulario();
                    setFormularioAberto(false);
                    setErro("");
                  }}
                >
                  <X size={18} />
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="classes-save-button"
                  disabled={
                    salvando ||
                    carregando ||
                    periodosEmAndamento.length === 0 ||
                    professoresDisponiveis.length === 0
                  }
                >
                  {salvando ? (
                    <>
                      <LoaderCircle
                        size={18}
                        className="classes-spinner"
                      />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Cadastrar turma
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}
      </div>

      <div className="classes-list-card">

        <div className="classes-list-header">
          <div>
            <h3>Turmas cadastradas</h3>
            <p>Consulte as turmas registradas no sistema.</p>
          </div>

          <button
            type="button"
            className="classes-refresh-button"
            onClick={carregarDados}
            disabled={carregando}
            title="Atualizar lista"
          >
            <RefreshCw
              size={18}
              className={carregando ? "classes-spinner" : ""}
            />
          </button>
        </div>

        {carregando ? (
          <div className="classes-empty">
            <LoaderCircle
              size={25}
              className="classes-spinner"
            />
            <span>Carregando turmas...</span>
          </div>
        ) : turmas.length === 0 ? (
          <div className="classes-empty">
            <School size={30} />
            <span>Nenhuma turma cadastrada.</span>
          </div>
        ) : (
          <div className="classes-table-wrapper">
            <table className="classes-table">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Disciplina</th>
                  <th>Professor</th>
                  <th>Semestre</th>
                  <th>Período letivo</th>
                </tr>
              </thead>

              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id}>
                    <td>
                      <strong>{turma.name}</strong>

                      <span className="classes-code">
                        <Hash size={13} />
                        {turma.code}
                      </span>
                    </td>

                    <td>
                      {turma.discipline?.name || "Não informado"}
                    </td>

                    <td>
                      <span className="classes-professor">
                        <UserRound size={15} />
                        {turma.professor?.user?.name || "Não informado"}
                      </span>
                    </td>

                    <td>
                      <span className="classes-semester">
                        {turma.semester}º semestre
                      </span>
                    </td>

                    <td>
                      {turma.academicTerm?.name ||
                        `${turma.academicYear}.${turma.term}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregando && turmas.length > 0 && (
          <div className="classes-list-footer">
            Total de turmas: <strong>{turmas.length}</strong>
          </div>
        )}

      </div>

    </div>
  );
}

export default Turmas;
