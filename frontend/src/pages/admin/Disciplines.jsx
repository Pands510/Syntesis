import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Clock,
  Hash,
  Layers,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Save,
  CheckCircle2,
  X,
  Pencil,
  Trash2
} from "lucide-react";

import api from "../../services/api";
import "./Disciplines.css";

function Disciplines() {
  const [cursos, setCursos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);

  const [cursoSelecionado, setCursoSelecionado] = useState("");
  const [semestreSelecionado, setSemestreSelecionado] = useState("");

  const [carregandoCursos, setCarregandoCursos] = useState(true);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false);
  const [erro, setErro] = useState("");

  // Novos estados para o formulário de cadastro
  const [formulario, setFormulario] = useState({
    name: "",
    code: "",
    workloadHours: "",
    semester: "1"
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [disciplinaEditando, setDisciplinaEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  

  async function carregarCursos() {
    try {
      setCarregandoCursos(true);
      setErro("");

      const resposta = await api.get("/api/courses");
      const lista = resposta.data.cursos || [];

      setCursos(lista);

      if (lista.length > 0) {
        setCursoSelecionado(lista[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os cursos."
      );
    } finally {
      setCarregandoCursos(false);
    }
  }

  async function carregarDisciplinas() {
    if (!cursoSelecionado) {
      setDisciplinas([]);
      return;
    }

    try {
      setCarregandoDisciplinas(true);
      setErro("");

      const parametros = {
        courseId: cursoSelecionado
      };

      if (semestreSelecionado) {
        parametros.semester = semestreSelecionado;
      }

      const resposta = await api.get("/api/disciplinas", {
        params: parametros
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

  function iniciarEdicao(disciplina) {
    setDisciplinaEditando(disciplina.id);
  
    setFormulario({
      name: disciplina.name || "",
      code: disciplina.code || "",
      workloadHours: String(disciplina.workloadHours || ""),
      semester: String(disciplina.semester || "1")
    });
  
    setCursoSelecionado(disciplina.courseId);
    setFormularioAberto(true);
  
    setMensagem("");
    setErroFormulario("");
  
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // Funções do formulário
  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function cadastrarDisciplina(event) {
    event.preventDefault();

  setMensagem("");
  setErroFormulario("");

  if (!cursoSelecionado) {
    setErroFormulario("Selecione um curso antes de continuar.");
    return;
  }

  try {
    setSalvando(true);

    const dadosDisciplina = {
      name: formulario.name.trim(),
      code: formulario.code.trim(),
      workloadHours: Number(formulario.workloadHours),
      courseId: cursoSelecionado,
      semester: Number(formulario.semester)
    };

    let resposta;

    if (disciplinaEditando) {
      resposta = await api.put(
        `/api/disciplinas/${disciplinaEditando}`,
        dadosDisciplina
      );

      setMensagem(
        resposta.data.mensagem || "Disciplina atualizada com sucesso!"
      );

      setDisciplinaEditando(null);
    } else {
      resposta = await api.post(
        "/api/disciplinas",
        dadosDisciplina
      );

      setMensagem(
        resposta.data.mensagem || "Disciplina cadastrada com sucesso!"
      );
    }

    setFormulario({
      name: "",
      code: "",
      workloadHours: "",
      semester: "1"
      });
  
      setFormularioAberto(false);
  
      await carregarDisciplinas();
  
    } catch (error) {
      console.error("Erro ao salvar disciplina:", error);
  
      setErroFormulario(
        error.response?.data?.mensagem ||
        "Não foi possível salvar a disciplina."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirDisciplina(disciplina) {
    const confirmar = window.confirm(
      `Tem certeza de que deseja excluir a disciplina "${disciplina.name}"?\n\nEssa ação não poderá ser desfeita.`
    );
  
    if (!confirmar) return;
  
    try {
      setExcluindo(disciplina.id);
      setMensagem("");
      setErroFormulario("");
  
      const resposta = await api.delete(
        `/api/disciplinas/${disciplina.id}`
      );
  
      setMensagem(
        resposta.data.mensagem || "Disciplina excluída com sucesso!"
      );
  
      if (disciplinaEditando === disciplina.id) {
        setDisciplinaEditando(null);
  
        setFormulario({
          name: "",
          code: "",
          workloadHours: "",
          semester: "1"
        });
  
        setFormularioAberto(false);
      }
  
      await carregarDisciplinas();
  
    } catch (error) {
      console.error("Erro ao excluir disciplina:", error);
  
      setErroFormulario(
        error.response?.data?.mensagem ||
        "Não foi possível excluir a disciplina."
      );
    } finally {
      setExcluindo(null);
    }
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  useEffect(() => {
    carregarDisciplinas();
  }, [cursoSelecionado, semestreSelecionado]);

  const cursoAtual = cursos.find(
    (curso) => curso.id === cursoSelecionado
  );

  return (
    <div className="disciplines-page">
      <div className="disciplines-heading">
        <div>
          <h2>Gerenciamento de disciplinas</h2>
          <p>
            Organize as matérias oferecidas em cada curso e semestre.
          </p>
        </div>

        <div className="disciplines-heading-icon">
          <BookOpen size={25} />
        </div>
      </div>

      {erro && (
        <div className="disciplines-feedback error" role="alert">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      <div className="disciplines-filters-card">
        <div className="disciplines-section-heading">
          <div className="disciplines-section-icon">
            <Layers size={21} />
          </div>

          <div>
            <h3>Filtrar disciplinas</h3>
            <p>Selecione o curso e o semestre desejados.</p>
          </div>
        </div>

        <div className="disciplines-filters-grid">
          <div className="disciplines-field">
            <label htmlFor="discipline-course">Curso</label>

            <div className="disciplines-input-wrapper">
              <GraduationCap size={18} />

              <select
                id="discipline-course"
                value={cursoSelecionado}
                onChange={(event) =>
                  setCursoSelecionado(event.target.value)
                }
                disabled={carregandoCursos}
              >
                <option value="">
                  {carregandoCursos
                    ? "Carregando cursos..."
                    : "Selecione um curso"}
                </option>

                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="disciplines-field">
            <label htmlFor="discipline-semester">Semestre</label>

            <div className="disciplines-input-wrapper">
              <Layers size={18} />

              <select
                id="discipline-semester"
                value={semestreSelecionado}
                onChange={(event) =>
                  setSemestreSelecionado(event.target.value)
                }
              >
                <option value="">Todos os semestres</option>

                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((semestre) => (
                  <option key={semestre} value={semestre}>
                    {semestre}º semestre
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Novo Bloco: Card de Cadastro de Disciplina */}
      <div className="disciplines-register-card">
        <div className="disciplines-register-header">
          <div className="disciplines-section-heading">
            <div className="disciplines-section-icon">
              <Plus size={21} />
            </div>

            <div>
              <h3>
                {disciplinaEditando ? "Editar disciplina" : "Cadastrar disciplina"}
              </h3>
              <p>
                {disciplinaEditando
                  ? "Altere os dados da disciplina selecionada."
                  : "Adicione uma nova matéria ao curso selecionado."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="disciplines-register-toggle"
            onClick={() => {
              setFormularioAberto(!formularioAberto);
              setErroFormulario("");
              setMensagem("");
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
                Nova disciplina
              </>
            )}
          </button>
        </div>

        {mensagem && (
          <div className="disciplines-feedback success" role="status">
            <CheckCircle2 size={19} />
            <span>{mensagem}</span>
          </div>
        )}

        {erroFormulario && (
          <div className="disciplines-feedback error" role="alert">
            <AlertCircle size={19} />
            <span>{erroFormulario}</span>
          </div>
        )}

        {formularioAberto && (
          <form
            className="disciplines-form"
            onSubmit={cadastrarDisciplina}
          >
            <div className="disciplines-form-course">
              <GraduationCap size={18} />
              <span>
                Curso selecionado: <strong>{cursoAtual?.name || "Nenhum curso"}</strong>
              </span>
            </div>

            <div className="disciplines-form-grid">
              <div className="disciplines-field">
                <label htmlFor="discipline-name">Nome da disciplina *</label>
                <div className="disciplines-input-wrapper">
                  <BookOpen size={18} />
                  <input
                    id="discipline-name"
                    name="name"
                    type="text"
                    placeholder="Ex.: Banco de Dados"
                    value={formulario.name}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
              </div>

              <div className="disciplines-field">
                <label htmlFor="discipline-code">Código *</label>
                <div className="disciplines-input-wrapper">
                  <Hash size={18} />
                  <input
                    id="discipline-code"
                    name="code"
                    type="text"
                    placeholder="Ex.: DS-DB-001"
                    value={formulario.code}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
              </div>

              <div className="disciplines-field">
                <label htmlFor="discipline-workload">Carga horária (horas) *</label>
                <div className="disciplines-input-wrapper">
                  <Clock size={18} />
                  <input
                    id="discipline-workload"
                    name="workloadHours"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex.: 80"
                    value={formulario.workloadHours}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
              </div>

              <div className="disciplines-field">
                <label htmlFor="discipline-new-semester">Semestre *</label>
                <div className="disciplines-input-wrapper">
                  <Layers size={18} />
                  <select
                    id="discipline-new-semester"
                    name="semester"
                    value={formulario.semester}
                    onChange={atualizarCampo}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((semestre) => (
                      <option key={semestre} value={semestre}>
                        {semestre}º semestre
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="disciplines-form-footer">
              <span>* Campos obrigatórios</span>

              {disciplinaEditando ? (
                <>
                  <CheckCircle2 size={18} />
                  Salvar alterações
                </>
              ) : (
                <>
                  <Save size={18} />
                  Cadastrar disciplina
                </>
              )}
            </div>

<div className="disciplines-form-actions">
  {disciplinaEditando && (
    <button
      type="button"
      className="disciplines-cancel-button"
      onClick={() => {
        setDisciplinaEditando(null);

        setFormulario({
          name: "",
          code: "",
          workloadHours: "",
          semester: "1"
        });

        setFormularioAberto(false);
        setMensagem("");
        setErroFormulario("");
      }}
    >
      <X size={18} />
      Cancelar edição
    </button>
  )}

  <button
    type="submit"
    className="disciplines-save-button"
    disabled={salvando || !cursoSelecionado}
          >
            {salvando ? (
              <>
                <LoaderCircle size={18} className="disciplines-spinner" />
                Salvando...
              </>
            ) : (
              <>
                {disciplinaEditando ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Save size={18} />
                )}
        
                {disciplinaEditando
                  ? "Salvar alterações"
                  : "Cadastrar disciplina"}
              </>
            )}
          </button>
        </div>
          </form>
        )}
      </div>

      <div className="disciplines-list-card">
        <div className="disciplines-list-header">
          <div>
            <h3>Disciplinas cadastradas</h3>
            <p>
              {cursoAtual
                ? `Curso: ${cursoAtual.name}`
                : "Selecione um curso para consultar as disciplinas."}
            </p>
          </div>

          <button
            type="button"
            className="disciplines-refresh-button"
            onClick={carregarDisciplinas}
            disabled={carregandoDisciplinas || !cursoSelecionado}
            title="Atualizar lista"
          >
            <RefreshCw
              size={18}
              className={carregandoDisciplinas ? "disciplines-spinner" : ""}
            />
          </button>
        </div>

        {carregandoCursos || carregandoDisciplinas ? (
          <div className="disciplines-empty">
            <LoaderCircle
              size={25}
              className="disciplines-spinner"
            />
            <span>Carregando disciplinas...</span>
          </div>
        ) : !cursoSelecionado ? (
          <div className="disciplines-empty">
            <GraduationCap size={30} />
            <span>Cadastre um curso para começar.</span>
          </div>
        ) : disciplinas.length === 0 ? (
          <div className="disciplines-empty">
            <BookOpen size={30} />
            <span>Nenhuma disciplina encontrada para este filtro.</span>
          </div>
        ) : (
          <div className="disciplines-table-wrapper">
            <table className="disciplines-table">
              <thead>
                <tr>
                  <th>Disciplina</th>
                  <th>Código</th>
                  <th>Carga horária</th>
                  <th>Semestre</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {disciplinas.map((disciplina) => (
                  <tr key={disciplina.id}>
                    <td>
                      <strong>{disciplina.name}</strong>
                    </td>

                    <td>
                      <span className="disciplines-code">
                        <Hash size={14} />
                        {disciplina.code}
                      </span>
                    </td>

                    <td>
                      <span className="disciplines-workload">
                        <Clock size={15} />
                        {disciplina.workloadHours}h
                      </span>
                    </td>

                    <td>
                      <span className="disciplines-semester">
                        {disciplina.semester}º semestre
                      </span>
                    </td>
                        <td>
                          <div className="disciplines-actions">
                            <button
                              type="button"
                              className="disciplines-edit-button"
                              onClick={() => iniciarEdicao(disciplina)}
                              title="Editar disciplina"
                            >
                              <Pencil size={17} />
                            </button>
                                        
                            <button
                              type="button"
                              className="disciplines-delete-button"
                              onClick={() => excluirDisciplina(disciplina)}
                              title="Excluir disciplina"
                              disabled={excluindo === disciplina.id}
                            >
                              {excluindo === disciplina.id ? (
                                <LoaderCircle size={17} className="disciplines-spinner" />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!carregandoDisciplinas && disciplinas.length > 0 && (
          <div className="disciplines-list-footer">
            Total de disciplinas: <strong>{disciplinas.length}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default Disciplines;