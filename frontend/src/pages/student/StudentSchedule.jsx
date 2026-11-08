
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  RefreshCw,
  UserRound
} from "lucide-react";

import api from "../../services/api";

import "./StudentSchedule.css";

const DIAS = [
  { valor: "SEGUNDA", nome: "Segunda-feira" },
  { valor: "TERCA", nome: "Terça-feira" },
  { valor: "QUARTA", nome: "Quarta-feira" },
  { valor: "QUINTA", nome: "Quinta-feira" },
  { valor: "SEXTA", nome: "Sexta-feira" }
];

const TURNOS = [
  {
    valor: "MANHA",
    nome: "Manhã",
    aulas: [
      ["07:30", "08:20"],
      ["08:20", "09:10"],
      ["09:10", "10:00"],
      ["10:00", "10:50"],
      ["10:50", "11:40"],
      ["11:40", "12:30"]
    ]
  },
  {
    valor: "TARDE",
    nome: "Tarde",
    aulas: [
      ["13:30", "14:20"],
      ["14:20", "15:10"],
      ["15:10", "16:00"],
      ["16:00", "16:50"],
      ["16:50", "17:40"],
      ["17:40", "18:30"]
    ]
  }
];

function StudentSchedule() {
  const [horarios, setHorarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarHorarios() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/api/schedule/my");

      setHorarios(resposta.data.horarios || []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar seu horário."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarHorarios();
  }, []);

  function obterAulas(dia, turno, numeroAula) {
    return horarios.filter(
      (horario) =>
        horario.weekDay === dia &&
        horario.shift === turno &&
        horario.lessonNumber === numeroAula
    );
  }

  if (carregando) {
    return (
      <section className="student-schedule">
        <div className="student-schedule-loading">
          <RefreshCw className="loading-icon" size={24} />
          <p>Carregando seu horário...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="student-schedule">
      <header className="student-schedule-header">
        <div>
          <span className="student-schedule-eyebrow">
            ORGANIZAÇÃO ACADÊMICA
          </span>

          <h2>Meu horário</h2>

          <p>
            Consulte os dias e horários das aulas das suas disciplinas.
          </p>
        </div>

        <div className="student-schedule-header-icon">
          <CalendarDays size={28} />
        </div>
      </header>

      {erro && (
        <div className="student-schedule-error">
          <p>{erro}</p>

          <button onClick={carregarHorarios}>
            <RefreshCw size={16} />
            Tentar novamente
          </button>
        </div>
      )}

      {!erro && horarios.length === 0 && (
        <div className="student-schedule-empty">
          <CalendarDays size={42} />

          <h3>Nenhum horário disponível</h3>

          <p>
            Não encontramos aulas vinculadas às suas matrículas ativas.
            Quando houver horários cadastrados para sua turma, eles
            aparecerão nesta página.
          </p>
        </div>
      )}

      {!erro && horarios.length > 0 && (
        <>
          <div className="student-schedule-summary">
            <div>
              <CalendarDays size={20} />

              <span>
                {horarios.length}{" "}
                {horarios.length === 1 ? "horário cadastrado" : "horários cadastrados"}
              </span>
            </div>

            <div>
              <Clock size={20} />
              <span>Segunda a sexta-feira</span>
            </div>
          </div>

          {TURNOS.map((turno) => {
            const horariosTurno = horarios.filter(
              (horario) => horario.shift === turno.valor
            );

            if (horariosTurno.length === 0) {
              return null;
            }

            return (
              <div className="student-schedule-shift" key={turno.valor}>
                <div className="student-schedule-shift-title">
                  <Clock size={20} />
                  <h3>Turno da {turno.nome.toLowerCase()}</h3>
                </div>

                <div className="student-schedule-table-wrapper">
                  <table className="student-schedule-table">
                    <thead>
                      <tr>
                        <th className="schedule-time-column">Horário</th>

                        {DIAS.map((dia) => (
                          <th key={dia.valor}>{dia.nome}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {turno.aulas.map((aula, index) => {
                        const numeroAula = index + 1;

                        const possuiHorario = horariosTurno.some(
                          (horario) =>
                            horario.lessonNumber === numeroAula
                        );

                        if (!possuiHorario) {
                          return null;
                        }

                        return (
                          <tr key={numeroAula}>
                            <td className="schedule-time">
                              <strong>{aula[0]}</strong>
                              <span>{aula[1]}</span>
                              <small>{numeroAula}ª aula</small>
                            </td>

                            {DIAS.map((dia) => {
                              const aulas = obterAulas(
                                dia.valor,
                                turno.valor,
                                numeroAula
                              );

                              return (
                                <td
                                  key={dia.valor}
                                  className="schedule-cell"
                                >
                                  {aulas.map((horario) => (
                                    <div
                                      className="schedule-class"
                                      key={horario.id}
                                    >
                                      <strong>
                                        {horario.schoolClass?.discipline?.name ||
                                          "Disciplina"}
                                      </strong>

                                      <span className="schedule-class-code">
                                        {horario.schoolClass?.discipline?.code ||
                                          "Código não informado"}
                                      </span>

                                      <span className="schedule-class-professor">
                                        <UserRound size={13} />

                                        {horario.schoolClass?.professor?.user?.name ||
                                          "Professor não informado"}
                                      </span>

                                      <span className="schedule-class-period">
                                        <GraduationCap size={13} />
                                        {horario.startTime} – {horario.endTime}
                                      </span>
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}
    </section>
  );
}

export default StudentSchedule;
