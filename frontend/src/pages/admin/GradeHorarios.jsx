
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Trash2,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  School,
  BookOpen,
  UserRound
} from "lucide-react";

import api from "../../services/api";
import "./GradeHorarios.css";

const DIAS = [
  { value: "SEGUNDA", label: "Segunda-feira" },
  { value: "TERCA", label: "Terça-feira" },
  { value: "QUARTA", label: "Quarta-feira" },
  { value: "QUINTA", label: "Quinta-feira" },
  { value: "SEXTA", label: "Sexta-feira" }
];

const TURNOS = {
  MANHA: [
    ["07:30", "08:20"],
    ["08:20", "09:10"],
    ["09:10", "10:00"],
    ["10:00", "10:50"],
    ["10:50", "11:40"],
    ["11:40", "12:30"]
  ],
  TARDE: [
    ["13:30", "14:20"],
    ["14:20", "15:10"],
    ["15:10", "16:00"],
    ["16:00", "16:50"],
    ["16:50", "17:40"],
    ["17:40", "18:30"]
  ]
};

const FORMULARIO_INICIAL = {
  classId: "",
  weekDay: "SEGUNDA",
  shift: "MANHA",
  lessonNumber: "1"
};

function GradeHorarios() {
  const [turmas, setTurmas] = useState([]);
  const [horarios, setHorarios] = useState([]);

  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState("");

  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("MANHA");

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [respostaTurmas, respostaHorarios] = await Promise.all([
        api.get("/api/school-classes"),
        api.get("/api/schedule/all")
      ]);

      setTurmas(respostaTurmas.data.turmas || []);
      setHorarios(respostaHorarios.data.horarios || []);
    } catch (error) {
      console.error("Erro ao carregar quadro de horários:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar o quadro de horários."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const cursos = useMemo(() => {
    const mapa = new Map();

    turmas.forEach((turma) => {
      const curso = turma.discipline?.course;

      if (curso?.id) {
        mapa.set(curso.id, curso.name);
      }
    });

    return Array.from(mapa, ([id, name]) => ({ id, name }));
  }, [turmas]);

  const periodos = useMemo(() => {
    const mapa = new Map();

    turmas.forEach((turma) => {
      const periodo = turma.academicTerm;

      if (periodo?.id) {
        mapa.set(periodo.id, periodo.name);
      }
    });

    return Array.from(mapa, ([id, name]) => ({ id, name }));
  }, [turmas]);

  const turmasFiltradas = useMemo(() => {
    return turmas.filter((turma) => {
      const cursoId = turma.discipline?.course?.id;
      const periodoId = turma.academicTerm?.id;

      return (
        (!filtroCurso || cursoId === filtroCurso) &&
        (!filtroPeriodo || periodoId === filtroPeriodo)
      );
    });
  }, [turmas, filtroCurso, filtroPeriodo]);

  const horariosFiltrados = useMemo(() => {
    return horarios.filter((horario) => {
      const turma = horario.schoolClass;

      return (
        (!filtroCurso ||
          turma?.discipline?.course?.id === filtroCurso) &&
        (!filtroPeriodo ||
          turma?.academicTerm?.id === filtroPeriodo) &&
        (!filtroTurma || horario.classId === filtroTurma) &&
        horario.shift === filtroTurno
      );
    });
  }, [
    horarios,
    filtroCurso,
    filtroPeriodo,
    filtroTurma,
    filtroTurno
  ]);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }));

    setErro("");
    setMensagem("");
  }

  async function cadastrarHorario(event) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!formulario.classId) {
      setErro("Selecione uma turma.");
      return;
    }

    try {
      setSalvando(true);

      const resposta = await api.post("/api/schedule", {
        classId: formulario.classId,
        weekDay: formulario.weekDay,
        shift: formulario.shift,
        lessonNumber: Number(formulario.lessonNumber)
      });

      setMensagem(
        resposta.data.mensagem || "Horário cadastrado com sucesso."
      );

      setFormulario(FORMULARIO_INICIAL);
      setFormularioAberto(false);

      await carregarDados();
    } catch (error) {
      console.error("Erro ao cadastrar horário:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível cadastrar o horário."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirHorario(id) {
    if (!window.confirm("Deseja realmente excluir este horário?")) {
      return;
    }

    try {
      setExcluindo(id);
      setErro("");
      setMensagem("");

      const resposta = await api.delete(`/api/schedule/${id}`);

      setMensagem(
        resposta.data.mensagem || "Horário excluído com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error("Erro ao excluir horário:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível excluir o horário."
      );
    } finally {
      setExcluindo("");
    }
  }

  function obterHorariosSlot(dia, aula) {
    return horariosFiltrados.filter(
      (horario) =>
        horario.weekDay === dia &&
        horario.lessonNumber === aula
    );
  }

  const totalAulas = horariosFiltrados.length;

  return (
    <div className="grade-horarios-page">
      <div className="grade-heading">
        <div>
          <h2>Quadro de horários</h2>
          <p>
            Organize as aulas, turmas e professores durante a semana.
          </p>
        </div>

        <div className="grade-heading-icon">
          <CalendarClock size={26} />
        </div>
      </div>

      {erro && (
        <div className="grade-feedback error" role="alert">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      {mensagem && (
        <div className="grade-feedback success" role="status">
          <CheckCircle2 size={19} />
          <span>{mensagem}</span>
        </div>
      )}

      <section className="grade-toolbar">
        <div className="grade-toolbar-info">
          <strong>Organização semanal</strong>
          <span>{totalAulas} aula(s) no filtro atual</span>
        </div>

        <div className="grade-toolbar-actions">
          <button
            type="button"
            className="grade-refresh-button"
            onClick={carregarDados}
            disabled={carregando}
            title="Atualizar quadro"
          >
            <RefreshCw size={18} />
          </button>

          <button
            type="button"
            className="grade-add-button"
            onClick={() => {
              setFormularioAberto(!formularioAberto);
              setErro("");
              setMensagem("");
            }}
          >
            <Plus size={18} />
            Nova aula
          </button>
        </div>
      </section>

      {formularioAberto && (
        <form className="grade-form" onSubmit={cadastrarHorario}>
          <h3>Cadastrar horário</h3>

          <div className="grade-form-grid">
            <label>
              Turma
              <select
                name="classId"
                value={formulario.classId}
                onChange={atualizarCampo}
                required
              >
                <option value="">Selecione uma turma</option>

                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.name} — {turma.discipline?.name || "Disciplina"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Dia da semana
              <select
                name="weekDay"
                value={formulario.weekDay}
                onChange={atualizarCampo}
              >
                {DIAS.map((dia) => (
                  <option key={dia.value} value={dia.value}>
                    {dia.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Turno
              <select
                name="shift"
                value={formulario.shift}
                onChange={atualizarCampo}
              >
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
              </select>
            </label>

            <label>
              Número da aula
              <select
                name="lessonNumber"
                value={formulario.lessonNumber}
                onChange={atualizarCampo}
              >
                {[1, 2, 3, 4, 5, 6].map((numero) => (
                  <option key={numero} value={numero}>
                    {numero}ª aula
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grade-form-footer">
            <button
              type="button"
              className="grade-cancel-button"
              onClick={() => setFormularioAberto(false)}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="grade-add-button"
              disabled={salvando || turmas.length === 0}
            >
              {salvando ? (
                <LoaderCircle size={18} className="grade-spinner" />
              ) : (
                <Plus size={18} />
              )}
              {salvando ? "Salvando..." : "Cadastrar aula"}
            </button>
          </div>
        </form>
      )}

      <section className="grade-filters">
        <label>
          Curso
          <select
            value={filtroCurso}
            onChange={(event) => {
              setFiltroCurso(event.target.value);
              setFiltroTurma("");
            }}
          >
            <option value="">Todos os cursos</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Período letivo
          <select
            value={filtroPeriodo}
            onChange={(event) => {
              setFiltroPeriodo(event.target.value);
              setFiltroTurma("");
            }}
          >
            <option value="">Todos os períodos</option>
            {periodos.map((periodo) => (
              <option key={periodo.id} value={periodo.id}>
                {periodo.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Turma
          <select
            value={filtroTurma}
            onChange={(event) => setFiltroTurma(event.target.value)}
          >
            <option value="">Todas as turmas</option>
            {turmasFiltradas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Turno
          <select
            value={filtroTurno}
            onChange={(event) => setFiltroTurno(event.target.value)}
          >
            <option value="MANHA">Manhã</option>
            <option value="TARDE">Tarde</option>
          </select>
        </label>
      </section>

      <section className="grade-table-card">
        {carregando ? (
          <div className="grade-loading">
            <LoaderCircle size={27} className="grade-spinner" />
            Carregando quadro de horários...
          </div>
        ) : (
          <div className="grade-table-scroll">
            <table className="grade-table">
              <thead>
                <tr>
                  <th>Aula</th>
                  {DIAS.map((dia) => (
                    <th key={dia.value}>{dia.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[1, 2, 3, 4, 5, 6].map((aula) => {
                  const horario = TURNOS[filtroTurno][aula - 1];

                  return (
                    <tr key={aula}>
                      <th className="grade-time-cell">
                        <strong>{aula}ª aula</strong>
                        <span>{horario[0]} – {horario[1]}</span>
                      </th>

                      {DIAS.map((dia) => {
                        const aulas = obterHorariosSlot(dia.value, aula);

                        return (
                          <td key={dia.value}>
                            <div className="grade-slot">
                              {aulas.length === 0 ? (
                                <span className="grade-empty-slot">—</span>
                              ) : (
                                aulas.map((item) => (
                                  <article
                                    className="grade-class-card"
                                    key={item.id}
                                  >
                                    <strong>
                                      {item.schoolClass?.discipline?.name ||
                                        "Disciplina"}
                                    </strong>

                                    <span>
                                      <School size={13} />
                                      {item.schoolClass?.name}
                                    </span>

                                    <span>
                                      <BookOpen size={13} />
                                      {item.schoolClass?.discipline?.course?.name ||
                                        "Curso"}
                                    </span>

                                    <span>
                                      <UserRound size={13} />
                                      {item.schoolClass?.professor?.user?.name ||
                                        "Professor"}
                                    </span>

                                    <button
                                      type="button"
                                      className="grade-delete-button"
                                      onClick={() => excluirHorario(item.id)}
                                      disabled={excluindo === item.id}
                                      title="Excluir horário"
                                    >
                                      {excluindo === item.id ? (
                                        <LoaderCircle
                                          size={15}
                                          className="grade-spinner"
                                        />
                                      ) : (
                                        <Trash2 size={15} />
                                      )}
                                    </button>
                                  </article>
                                ))
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default GradeHorarios;
