
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  BookOpen,
  GraduationCap,
  AlertCircle,
  LoaderCircle
} from "lucide-react";

import api from "../../services/api";
import "./ProfessorAgenda.css";

const DIAS = [
  { valor: "SEGUNDA", nome: "Segunda-feira", abreviado: "SEG" },
  { valor: "TERCA", nome: "Terça-feira", abreviado: "TER" },
  { valor: "QUARTA", nome: "Quarta-feira", abreviado: "QUA" },
  { valor: "QUINTA", nome: "Quinta-feira", abreviado: "QUI" },
  { valor: "SEXTA", nome: "Sexta-feira", abreviado: "SEX" }
];

const TURNOS = [
  { valor: "MANHA", nome: "Manhã" },
  { valor: "TARDE", nome: "Tarde" }
];

function ProfessorAgenda() {
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarAgenda() {
      try {
        setCarregando(true);
        setErro("");

        const response = await api.get("/api/schedule/professor/my");

        setHorarios(response.data.horarios || []);
      } catch (error) {
        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar sua agenda."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarAgenda();
  }, []);

  function obterAulas(dia, turno) {
    return horarios
      .filter(
        (horario) =>
          horario.weekDay === dia &&
          horario.shift === turno
      )
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  function obterNomeTurma(turma) {
    if (!turma) return "Turma não identificada";

    return turma.name || turma.code || "Turma";
  }

  function obterNomePeriodo(periodo) {
    if (!periodo) return "";

    return periodo.name || periodo.description || "";
  }

  if (carregando) {
    return (
      <div className="professor-agenda-loading">
        <LoaderCircle size={30} className="professor-agenda-spinner" />
        <p>Carregando sua agenda...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="professor-agenda-error">
        <AlertCircle size={22} />
        <span>{erro}</span>
      </div>
    );
  }

  return (
    <div className="professor-agenda">
      <div className="professor-agenda-header">
        <div>
          <span className="professor-agenda-eyebrow">
            ORGANIZAÇÃO SEMANAL
          </span>

          <h2>Minha agenda</h2>

          <p>
            Consulte suas aulas, disciplinas e turmas durante a semana.
          </p>
        </div>

        <div className="professor-agenda-total">
          <CalendarDays size={22} />

          <div>
            <strong>{horarios.length}</strong>
            <span>
              {horarios.length === 1 ? "aula cadastrada" : "aulas cadastradas"}
            </span>
          </div>
        </div>
      </div>

      {horarios.length === 0 ? (
        <div className="professor-agenda-empty">
          <div className="professor-agenda-empty-icon">
            <CalendarDays size={36} />
          </div>

          <h3>Nenhuma aula cadastrada</h3>

          <p>
            Sua agenda ainda não possui horários registrados.
            Quando o administrador organizar seu quadro de horários,
            suas aulas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="professor-agenda-grid">
          {DIAS.map((dia) => (
            <section
              className="professor-agenda-day"
              key={dia.valor}
            >
              <div className="professor-agenda-day-header">
                <span>{dia.abreviado}</span>
                <h3>{dia.nome}</h3>
              </div>

              {TURNOS.map((turno) => {
                const aulas = obterAulas(dia.valor, turno.valor);

                return (
                  <div
                    className="professor-agenda-shift"
                    key={turno.valor}
                  >
                    <h4>{turno.nome}</h4>

                    {aulas.length === 0 ? (
                      <div className="professor-agenda-no-class">
                        Sem aulas
                      </div>
                    ) : (
                      <div className="professor-agenda-lessons">
                        {aulas.map((aula) => {
                          const turma = aula.schoolClass;
                          const disciplina = turma?.discipline;
                          const periodo = obterNomePeriodo(
                            turma?.academicTerm
                          );

                          return (
                            <article
                              className="professor-agenda-lesson"
                              key={aula.id}
                            >
                              <div className="professor-agenda-lesson-time">
                                <Clock3 size={14} />

                                <span>
                                  {aula.startTime} – {aula.endTime}
                                </span>
                              </div>

                              <strong className="professor-agenda-discipline">
                                {disciplina?.name || "Disciplina não identificada"}
                              </strong>

                              <div className="professor-agenda-lesson-info">
                                <BookOpen size={14} />

                                <span>
                                  {obterNomeTurma(turma)}
                                </span>
                              </div>

                              {periodo && (
                                <div className="professor-agenda-lesson-info">
                                  <GraduationCap size={14} />

                                  <span>{periodo}</span>
                                </div>
                              )}

                              <span className="professor-agenda-lesson-number">
                                {aula.lessonNumber}ª aula
                              </span>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfessorAgenda;
