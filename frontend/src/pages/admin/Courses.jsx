import { useEffect, useState } from "react";

import {
  BookOpen,
  Plus,
  GraduationCap,
  Clock,
  Hash,
  FileText,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  RefreshCw,
  Pencil,
  Trash2,
  X
} from "lucide-react";

import api from "../../services/api";
import "./Courses.css";

function Courses() {
  const [cursos, setCursos] = useState([]);

  const [formulario, setFormulario] = useState({
    name: "",
    code: "",
    description: "",
    mainShift: ""
  });

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [cursoEditando, setCursoEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  async function carregarCursos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/api/courses");

      setCursos(resposta.data.cursos || []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os cursos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  function iniciarEdicao(curso) {
    setCursoEditando(curso.id);
  
    setFormulario({
      name: curso.name || "",
      code: curso.code || "",
      description: curso.description || "",
      mainShift: curso.mainShift || ""
    });
  
    setMensagem("");
    setErro("");
  
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

      async function excluirCurso(curso) {
      const confirmar = window.confirm(
        `Tem certeza de que deseja excluir o curso "${curso.name}"?\n\nEssa ação não poderá ser desfeita.`
      );    

      if (!confirmar) return;   

      try {
        setExcluindo(curso.id);
        setMensagem("");
        setErro("");    

        const resposta = await api.delete(
          `/api/courses/${curso.id}`
        );  

        setMensagem(
          resposta.data.mensagem || "Curso excluído com sucesso!"
        );  

        // Se o curso excluído estava sendo editado,
        // limpar o formulário.
        if (cursoEditando === curso.id) {
          setCursoEditando(null);   

          setFormulario({
            name: "",
            code: "",
            description: "",
            mainShift: ""
          });
        }   

        await carregarCursos(); 

      } catch (error) {
        console.error("Erro ao excluir curso:", error); 

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível excluir o curso."
        );  

      } finally {
        setExcluindo(null);
      }
    }

  async function cadastrarCurso(event) {
    event.preventDefault();
  
    setMensagem("");
    setErro("");
  
    try {
      setSalvando(true);
  
      let resposta;
  
      const dadosCurso = {
        ...formulario,
        mainShift: formulario.mainShift || null
      };
  
      if (cursoEditando) {
        resposta = await api.put(
          `/api/courses/${cursoEditando}`,
          dadosCurso
        );
  
        setMensagem(
          resposta.data.mensagem || "Curso atualizado com sucesso!"
        );
  
        setCursoEditando(null);
      } else {
        resposta = await api.post("/api/courses", dadosCurso);
  
        setMensagem(
          resposta.data.mensagem || "Curso cadastrado com sucesso!"
        );
      }
  
      setFormulario({
        name: "",
        code: "",
        description: "",
        mainShift: ""
      });
  
      await carregarCursos();
  
    } catch (error) {
      console.error("Erro ao salvar curso:", error);
  
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível salvar o curso."
      );
  
    } finally {
      setSalvando(false);
    }
  }

  function nomeTurno(turno) {
    if (turno === "MANHA") return "Manhã";
    if (turno === "TARDE") return "Tarde";
    return "Não definido";
  }

  return (
    <div className="courses-page">
      <div className="courses-heading">
        <div>
          <h2>Gerenciamento de cursos</h2>
          <p>
            Cadastre e consulte os cursos oferecidos pela instituição.
          </p>
        </div>

        <div className="courses-heading-icon">
          <GraduationCap size={25} />
        </div>
      </div>

      <div className="courses-stats">
        <div className="courses-stat-card">
          <div className="courses-stat-icon">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Total de cursos</span>
            <strong>{cursos.length}</strong>
          </div>
        </div>
      </div>

      <div className="courses-form-card">
        <div className="courses-form-header">
          <div className="courses-form-icon">
            <Plus size={23} />
          </div>

          <div>
            
            <h3>
                {cursoEditando ? "Editar curso" : "Cadastrar novo curso"}
            </h3>

            <p>
              {cursoEditando
                ? "Altere as informações do curso selecionado."
                : "Preencha as informações do curso."}
            </p>
          </div>
        </div>

        {mensagem && (
          <div className="courses-feedback success" role="status">
            <CheckCircle2 size={19} />
            <span>{mensagem}</span>
          </div>
        )}

        {erro && (
          <div className="courses-feedback error" role="alert">
            <AlertCircle size={19} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={cadastrarCurso}>
          <div className="courses-form-grid">
            <div className="courses-field full">
              <label htmlFor="course-name">Nome do curso *</label>

              <div className="courses-input-wrapper">
                <GraduationCap size={18} />

                <input
                  id="course-name"
                  name="name"
                  type="text"
                  placeholder="Ex.: Desenvolvimento de Sistemas"
                  value={formulario.name}
                  onChange={atualizarCampo}
                  required
                />
              </div>
            </div>

            <div className="courses-field">
              <label htmlFor="course-code">Código do curso</label>

              <div className="courses-input-wrapper">
                <Hash size={18} />

                <input
                  id="course-code"
                  name="code"
                  type="text"
                  placeholder="Ex.: DS"
                  value={formulario.code}
                  onChange={atualizarCampo}
                />
              </div>
            </div>

            <div className="courses-field">
              <label htmlFor="course-shift">Turno principal</label>

              <div className="courses-input-wrapper">
                <Clock size={18} />

                <select
                  id="course-shift"
                  name="mainShift"
                  value={formulario.mainShift}
                  onChange={atualizarCampo}
                >
                  <option value="">Selecione o turno</option>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                </select>
              </div>
            </div>

            <div className="courses-field full">
              <label htmlFor="course-description">Descrição</label>

              <div className="courses-input-wrapper courses-textarea-wrapper">
                <FileText size={18} />

                <textarea
                  id="course-description"
                  name="description"
                  placeholder="Descreva o curso..."
                  value={formulario.description}
                  onChange={atualizarCampo}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="courses-form-footer">
            <span>* Campo obrigatório</span>

            <button
              type="submit"
              className="courses-submit-button"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <LoaderCircle size={18} className="courses-spinner" />
                  Salvando...
                </>
              ) : (
                <>
                  {cursoEditando ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                  {cursoEditando ? "Salvar alterações" : "Cadastrar curso"}
                </>
              )}
            </button>
                {cursoEditando && (
                  <button
                    type="button"
                    className="courses-cancel-button"
                    onClick={() => {
                      setCursoEditando(null);
                      setFormulario({
                        name: "",
                        code: "",
                        description: "",
                        mainShift: ""
                      });
                      setMensagem("");
                      setErro("");
                    }}
                  >
                    <X size={18} />
                    Cancelar edição
                  </button>
                )}
          </div>
        </form>
      </div>

      <div className="courses-list-card">
        <div className="courses-list-header">
          <div>
            <h3>Cursos cadastrados</h3>
            <p>Consulte os cursos registrados no sistema.</p>
          </div>

          <button
            type="button"
            className="courses-refresh-button"
            onClick={carregarCursos}
            disabled={carregando}
            title="Atualizar lista"
          >
            <RefreshCw
              size={18}
              className={carregando ? "courses-spinner" : ""}
            />
          </button>
        </div>

        {carregando ? (
          <div className="courses-empty">
            <LoaderCircle size={24} className="courses-spinner" />
            <span>Carregando cursos...</span>
          </div>
        ) : cursos.length === 0 ? (
          <div className="courses-empty">
            <BookOpen size={30} />
            <span>Nenhum curso cadastrado.</span>
          </div>
        ) : (
          <div className="courses-table-wrapper">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Curso</th>
                  <th>Código</th>
                  <th>Turno principal</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {cursos.map((curso) => (
                  <tr key={curso.id}>
                    <td>
                      <strong>{curso.name}</strong>
                      {curso.description && (
                        <small>{curso.description}</small>
                      )}
                    </td>

                    <td>{curso.code || "—"}</td>

                    <td>
                      <span className="courses-shift">
                        {nomeTurno(curso.mainShift)}
                      </span>
                    </td>
                    <td>
                      <div className="courses-actions">
                        <button
                          type="button"
                          className="courses-edit-button"
                          onClick={() => iniciarEdicao(curso)}
                          title="Editar curso"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="courses-delete-button"
                          onClick={() => excluirCurso(curso)}
                          title="Excluir curso"
                          disabled={excluindo === curso.id}
                        >
                          {excluindo === curso.id ? (
                            <LoaderCircle size={17} className="courses-spinner" />
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
      </div>
    </div>
  );
}

export default Courses;
