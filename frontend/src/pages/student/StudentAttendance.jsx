
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCw
} from "lucide-react";

import api from "../../services/api";

import "./StudentAttendance.css";

function StudentAttendance() {
  const [matriculas, setMatriculas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarFrequencia() {
    try {
      setErro("");
      setCarregando(true);

      const resposta = await api.get("/api/attendance/my");

      setMatriculas(resposta.data.matriculas || []);
    } catch (error) {
      console.error("Erro ao carregar frequência:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar sua frequência."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarFrequencia();
  }, []);

  function formatarData(data) {
    if (!data) return "—";

    const dataISO = String(data).slice(0, 10);
    const [ano, mes, dia] = dataISO.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarTurno(turno) {
    const turnos = {
      MANHA: "Manhã",
      TARDE: "Tarde"
    };

    return turnos[turno] || turno || "—";
  }

  function obterStatusFrequencia(status) {
    const situacoes = {
      PRESENTE: {
        texto: "Presente",
        classe: "presente",
        icone: CheckCircle2
      },
      FALTA: {
        texto: "Falta",
        classe: "falta",
        icone: XCircle
      },
      JUSTIFICADA: {
        texto: "Justificada",
        classe: "justificada",
        icone: FileCheck
      }
    };

    return situacoes[status] || {
      texto: status || "Não informado",
      classe: "desconhecido",
      icone: AlertCircle
    };
  }

  function obterStatusMatricula(status) {
    const situacoes = {
      ATIVA: "Matrícula ativa",
      CONCLUIDA: "Matrícula concluída",
      CANCELADA: "Matrícula cancelada"
    };

    return situacoes[status] || status || "Status não informado";
  }

  const matriculasAtivas = matriculas.filter(
    (item) => item.statusMatricula === "ATIVA"
  );

  const totalFaltasAtivas = matriculasAtivas.reduce(
    (total, item) => total + (item.totalFaltas || 0),
    0
  );

  const totalJustificadasAtivas = matriculasAtivas.reduce(
    (total, item) => {
      const justificadas = (item.frequencias || []).filter(
        (frequencia) => frequencia.status === "JUSTIFICADA"
      ).length;

      return total + justificadas;
    },
    0
  );

  if (carregando) {
    return (
      <div className="student-attendance-loading">
        <RefreshCw
          size={22}
          className="student-attendance-spinner"
        />
        <p>Carregando sua frequência...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-attendance-error">
        <AlertCircle size={22} />
        <p>{erro}</p>

        <button type="button" onClick={carregarFrequencia}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <main className="student-attendance">

      <section className="student-attendance-welcome">
        <div className="student-attendance-welcome-icon">
          <CalendarDays size={30} />
        </div>

        <div>
          <h2>Minha frequência</h2>
          <p>
            Consulte suas presenças, faltas e faltas justificadas
            em cada disciplina.
          </p>
        </div>
      </section>

      <section className="student-attendance-summary">

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon disciplinas">
            <BookOpen size={22} />
          </div>

          <div>
            <span>Disciplinas ativas</span>
            <strong>{matriculasAtivas.length}</strong>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon faltas">
            <XCircle size={22} />
          </div>

          <div>
            <span>Total de faltas</span>
            <strong>{totalFaltasAtivas}</strong>
          </div>
        </article>

        <article className="student-attendance-summary-card">
          <div className="student-attendance-summary-icon justificadas">
            <FileCheck size={22} />
          </div>

          <div>
            <span>Faltas justificadas</span>
            <strong>{totalJustificadasAtivas}</strong>
          </div>
        </article>

      </section>

      <section className="student-attendance-section">

        <div className="student-attendance-heading">
          <div>
            <h2>Frequência por disciplina</h2>
            <p>
              Consulte o histórico de cada aula registrada.
            </p>
          </div>
        </div>

        {matriculas.length === 0 ? (
          <div className="student-attendance-empty">
            <CalendarDays size={36} />
            <h3>Nenhuma frequência encontrada</h3>
            <p>
              Ainda não existem matrículas ou registros de
              frequência para exibir.
            </p>
          </div>
        ) : (
          <div className="student-attendance-list">

            {matriculas.map((item) => {
              const frequencias = item.frequencias || [];

              return (
                <article
                  className="student-attendance-card"
                  key={item.enrollmentId}
                >

                  <div className="student-attendance-card-header">

                    <div className="student-attendance-discipline">
                      <h3>{item.disciplina?.name || "Disciplina"}</h3>

                      <span>
                        {item.disciplina?.code || "Sem código"}
                        {" · "}
                        {item.turma || "Turma não informada"}
                      </span>
                    </div>

                    <span
                      className={`student-attendance-enrollment-status ${String(
                        item.statusMatricula || ""
                      ).toLowerCase()}`}
                    >
                      {obterStatusMatricula(item.statusMatricula)}
                    </span>

                  </div>

                  <div className="student-attendance-card-summary">

                    <div>
                      <span>Total de faltas</span>
                      <strong>{item.totalFaltas ?? 0}</strong>
                    </div>

                    <div>
                      <span>Aulas registradas</span>
                      <strong>{frequencias.length}</strong>
                    </div>

                    <div>
                      <span>Justificadas</span>
                      <strong>
                        {
                          frequencias.filter(
                            (frequencia) =>
                              frequencia.status === "JUSTIFICADA"
                          ).length
                        }
                      </strong>
                    </div>

                  </div>

                  <div className="student-attendance-history">

                    <h4>Histórico de aulas</h4>

                    {frequencias.length === 0 ? (
                      <p className="student-attendance-no-records">
                        Nenhum registro de frequência nesta disciplina.
                      </p>
                    ) : (
                      <div className="student-attendance-table-wrapper">
                        <table className="student-attendance-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Turno</th>
                              <th>Aula</th>
                              <th>Situação</th>
                            </tr>
                          </thead>

                          <tbody>
                            {frequencias.map((frequencia) => {
                              const status = obterStatusFrequencia(
                                frequencia.status
                              );

                              const StatusIcon = status.icone;

                              return (
                                <tr key={frequencia.id}>
                                  <td>
                                    {formatarData(frequencia.date)}
                                  </td>

                                  <td>
                                    {formatarTurno(frequencia.shift)}
                                  </td>

                                  <td>
                                    {frequencia.lessonNumber}ª aula
                                  </td>

                                  <td>
                                    <span
                                      className={`student-attendance-status ${status.classe}`}
                                    >
                                      <StatusIcon size={14} />
                                      {status.texto}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </section>

    </main>
  );
}

export default StudentAttendance;
