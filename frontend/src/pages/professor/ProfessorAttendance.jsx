import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  Search,
  AlertCircle,
  BookOpen
} from "lucide-react";

import api from "../../services/api";
import "./ProfessorAttendance.css";

function ProfessorAttendance() {
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const hoje = new Date();

  const [mesAtual, setMesAtual] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );

  const [datasComAula, setDatasComAula] = useState([]);
  const [carregandoCalendario, setCarregandoCalendario] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState("");

  const [dadosFrequencia, setDadosFrequencia] = useState(null);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [frequenciasEditadas, setFrequenciasEditadas] = useState({});

  const [salvandoFrequencia, setSalvandoFrequencia] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    async function carregarTurmas() {
      try {
        const resposta = await api.get("/api/school-classes");
        setTurmas(resposta.data.turmas || []);
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar suas turmas."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarTurmas();
  }, []);

  useEffect(() => {
    if (!turmaSelecionada) {
      setDatasComAula([]);
      setDataSelecionada("");
      return;
    }

    async function carregarCalendario() {
      setCarregandoCalendario(true);
      setErro("");

      try {
        const ano = mesAtual.getFullYear();
        const mes = mesAtual.getMonth();

        const inicio = new Date(ano, mes, 1);
        const fim = new Date(ano, mes + 1, 0);

        const formatarData = (data) => {
          const anoData = data.getFullYear();
          const mesData = String(data.getMonth() + 1).padStart(2, "0");
          const diaData = String(data.getDate()).padStart(2, "0");
          return `${anoData}-${mesData}-${diaData}`;
        };

        const resposta = await api.get(
          `/api/attendance/${turmaSelecionada}/dates`,
          {
            params: {
              startDate: formatarData(inicio),
              endDate: formatarData(fim)
            }
          }
        );

        setDatasComAula(resposta.data.datas || []);
        setDataSelecionada("");
      } catch (error) {
        console.error("Erro ao carregar calendário:", error);
        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar o calendário de frequência."
        );
        setDatasComAula([]);
      } finally {
        setCarregandoCalendario(false);
      }
    }

    carregarCalendario();
  }, [turmaSelecionada, mesAtual]);

  useEffect(() => {
    if (!turmaSelecionada || !dataSelecionada) {
      setDadosFrequencia(null);
      return;
    }

    async function carregarFrequencia() {
      setCarregandoAlunos(true);
      setErro("");

      try {
        const resposta = await api.get(
          `/api/attendance/${turmaSelecionada}/date`,
          {
            params: {
              date: dataSelecionada
            }
          }
        );

        setDadosFrequencia(resposta.data);
      } catch (error) {
        console.error("Erro ao carregar frequência:", error);
        setDadosFrequencia(null);
        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar os alunos desta data."
        );
      } finally {
        setCarregandoAlunos(false);
      }
    }

    carregarFrequencia();
  }, [turmaSelecionada, dataSelecionada]);

  useEffect(() => {
    if (!dadosFrequencia) {
      setFrequenciasEditadas({});
      return;
    }

    const registros = {};

    dadosFrequencia.alunos.forEach((aluno) => {
      dadosFrequencia.aulas.forEach((aula) => {
        const registro = aluno.attendances.find(
          (item) =>
            item.shift === aula.shift &&
            item.lessonNumber === aula.lessonNumber
        );

        const chave = `${aluno.id}-${aula.shift}-${aula.lessonNumber}`;

        registros[chave] = registro?.status || "";
      });
    });

    setFrequenciasEditadas(registros);
  }, [dadosFrequencia]);

function alterarFrequencia(alunoId, aula, status) {
  const chave = `${alunoId}-${aula.shift}-${aula.lessonNumber}`;

  setFrequenciasEditadas((anterior) => ({
    ...anterior,
    [chave]: status
  }));
}

async function salvarFrequencias() {
  if (!dadosFrequencia || !turmaSelecionada || !dataSelecionada) {
    return;
  }

  setSalvandoFrequencia(true);
  setErro("");
  setMensagemSucesso("");

  try {
    let totalRegistros = 0;

    for (const aula of dadosFrequencia.aulas) {
      const attendances = dadosFrequencia.alunos
        .map((aluno) => {
          const chave = `${aluno.id}-${aula.shift}-${aula.lessonNumber}`;

          return {
            enrollmentId: aluno.id,
            status: frequenciasEditadas[chave] || ""
          };
        })
        .filter((item) => item.status !== "");

      if (attendances.length === 0) {
        continue;
      }

      await api.post("/api/attendance/batch", {
        classId: turmaSelecionada,
        date: dataSelecionada,
        shift: aula.shift,
        lessonNumber: aula.lessonNumber,
        attendances
      });

      totalRegistros += attendances.length;
    }

    const resposta = await api.get(
      `/api/attendance/${turmaSelecionada}/date`,
      {
        params: {
          date: dataSelecionada
        }
      }
    );

    setDadosFrequencia(resposta.data);
    setMensagemSucesso(
      `${totalRegistros} registro(s) de frequência salvo(s) com sucesso.`
    );
  } catch (error) {
    console.error("Erro ao salvar frequências:", error);

    setErro(
      error.response?.data?.mensagem ||
      "Não foi possível salvar as frequências."
    );
  } finally {
    setSalvandoFrequencia(false);
  }
}

  const turmaAtual = turmas.find(
    (turma) => turma.id === turmaSelecionada
  );

  return (
    <div className="professor-attendance">
      <div className="professor-attendance-heading">
        <div>
          <h2>Controle de frequência</h2>
          <p>
            Selecione uma turma para consultar as aulas e registrar
            a frequência dos alunos.
          </p>
        </div>

        <div className="professor-attendance-heading-icon">
          <CalendarDays size={25} />
        </div>
      </div>

      {erro && (
        <div className="professor-attendance-error">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      <section className="professor-attendance-selection">
        <div className="professor-attendance-section-title">
          <BookOpen size={20} />
          <h3>Selecionar turma</h3>
        </div>

        {carregando ? (
          <p className="professor-attendance-message">
            Carregando suas turmas...
          </p>
        ) : (
          <>
            <label htmlFor="attendance-class">
              Turma e disciplina
            </label>

            <select
              id="attendance-class"
              value={turmaSelecionada}
              onChange={(event) =>
                setTurmaSelecionada(event.target.value)
              }
            >
              <option value="">Selecione uma turma</option>

              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.name} — {turma.discipline?.name || "Disciplina"}
                </option>
              ))}
            </select>

            {!turmas.length && !erro && (
              <p className="professor-attendance-message">
                Nenhuma turma foi vinculada ao seu perfil.
              </p>
            )}
          </>
        )}
      </section>

      {turmaAtual && (
        <section className="professor-attendance-class-info">
          <div className="professor-attendance-class-icon">
            <Users size={24} />
          </div>

          <div>
            <span>Turma selecionada</span>
            <h3>{turmaAtual.name}</h3>
            <p>
              {turmaAtual.discipline?.name || "Disciplina não informada"}
            </p>
          </div>
        </section>
      )}

      {/* BLOCO CORRIGIDO: Mensagem de estado vazio isolada */}
      {!turmaSelecionada && !carregando && turmas.length > 0 && (
        <div className="professor-attendance-empty">
          <Search size={32} />
          <h3>Nenhuma turma selecionada</h3>
          <p>
            Escolha uma turma acima para visualizar o calendário
            de aulas e realizar o controle de frequência.
          </p>
        </div>
      )}

      {/* BLOCO CORRIGIDO: Calendário agora está fora do bloco de estado vazio */}
      {turmaSelecionada && (
        <section className="professor-attendance-calendar">
          <div className="professor-attendance-calendar-header">
            <div>
              <h3>Calendário de aulas</h3>
              <p>Selecione uma data para consultar a frequência.</p>
            </div>

            <div className="professor-attendance-month-navigation">
              <button
                type="button"
                onClick={() =>
                  setMesAtual(
                    new Date(
                      mesAtual.getFullYear(),
                      mesAtual.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                Anterior
              </button>

              <strong>
                {mesAtual.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric"
                })}
              </strong>

              <button
                type="button"
                onClick={() =>
                  setMesAtual(
                    new Date(
                      mesAtual.getFullYear(),
                      mesAtual.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                Próximo
              </button>
            </div>
          </div>

          {carregandoCalendario ? (
            <div className="professor-attendance-message">
              Carregando calendário...
            </div>
          ) : (
            <>
              <div className="professor-attendance-calendar-grid">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (dia) => (
                    <div
                      className="professor-attendance-weekday"
                      key={dia}
                    >
                      {dia}
                    </div>
                  )
                )}

                {Array.from(
                  {
                    length: new Date(
                      mesAtual.getFullYear(),
                      mesAtual.getMonth(),
                      1
                    ).getDay()
                  },
                  (_, index) => (
                    <div
                      className="professor-attendance-calendar-blank"
                      key={`blank-${index}`}
                    />
                  )
                )}

                {Array.from(
                  {
                    length: new Date(
                      mesAtual.getFullYear(),
                      mesAtual.getMonth() + 1,
                      0
                    ).getDate()
                  },
                  (_, index) => {
                    const dia = index + 1;
                    const data = [
                      mesAtual.getFullYear(),
                      String(mesAtual.getMonth() + 1).padStart(2, "0"),
                      String(dia).padStart(2, "0")
                    ].join("-");

                    const registro = datasComAula.find(
                      (item) => item.date === data
                    );
                    const selecionado = dataSelecionada === data;

                    return (
                      <button
                        type="button"
                        key={data}
                        disabled={!registro}
                        className={[
                          "professor-attendance-calendar-day",
                          registro ? "has-class" : "",
                          selecionado ? "selected" : ""
                        ].join(" ")}
                        onClick={() => setDataSelecionada(data)}
                        title={
                          registro
                            ? `${registro.totalAulas} aula(s) prevista(s)`
                            : "Não há aula prevista"
                        }
                      >
                        <span>{dia}</span>
                        {registro && (
                          <small>
                            {registro.totalAulas} aula(s)
                          </small>
                        )}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="professor-attendance-calendar-legend">
                <span className="professor-attendance-legend-dot" />
                Dias com aulas cadastradas
              </div>

              {datasComAula.length === 0 && (
                <p className="professor-attendance-message">
                  Não existem aulas cadastradas para esta turma neste mês.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* BLOCO CORRIGIDO: Lista de alunos agora está independente */}
      {dataSelecionada && (
        <section className="professor-attendance-students">
          <div className="professor-attendance-students-header">
            <div>
              <h3>Lista de alunos</h3>
              <p>
                {new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString(
                  "pt-BR",
                  {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  }
                )}
              </p>
            </div>

            {dadosFrequencia && (
              <span className="professor-attendance-student-count">
                {dadosFrequencia.totalAlunos} aluno(s)
              </span>
            )}
          </div>

          {carregandoAlunos ? (
            <div className="professor-attendance-message">
              Carregando alunos e aulas...
            </div>
          ) : dadosFrequencia ? (
            <>
              <div className="professor-attendance-lessons">
                {dadosFrequencia.aulas.map((aula) => (
                  <div
                    className="professor-attendance-lesson"
                    key={`${aula.shift}-${aula.lessonNumber}`}
                  >
                    <strong>{aula.lessonNumber}ª aula</strong>
                    <span>
                      {aula.shift === "MANHA" ? "Manhã" : "Tarde"}
                    </span>
                  </div>
                ))}
              </div>

              {dadosFrequencia.alunos.length === 0 ? (
                <div className="professor-attendance-message">
                  Não existem alunos com matrícula ativa nesta turma.
                </div>
              ) : (
                <div className="professor-attendance-table-wrapper">
                  <table className="professor-attendance-table">
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Matrícula</th>
                        {dadosFrequencia.aulas.map((aula) => (
                          <th key={`${aula.shift}-${aula.lessonNumber}`}>
                            {aula.lessonNumber}ª aula
                            <small>
                              {aula.shift === "MANHA" ? "Manhã" : "Tarde"}
                            </small>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dadosFrequencia.alunos.map((aluno) => (
                        <tr key={aluno.id}>
                          <td>{aluno.student.user.name}</td>
                          <td>
                            {aluno.student.registrationNumber || "—"}
                          </td>
                          {dadosFrequencia.aulas.map((aula) => {
                            const registro = aluno.attendances.find(
                              (item) =>
                                item.shift === aula.shift &&
                                item.lessonNumber === aula.lessonNumber
                            );
                            return (
                              <td
                                key={`${aula.shift}-${aula.lessonNumber}`}
                              >
                                <select
                                    className={`professor-attendance-status ${
                                        frequenciasEditadas[
                                        `${aluno.id}-${aula.shift}-${aula.lessonNumber}`
                                        ] || "NAO_REGISTRADA"
                                    }`}
                                    value={
                                        frequenciasEditadas[
                                        `${aluno.id}-${aula.shift}-${aula.lessonNumber}`
                                        ] || ""
                                    }
                                    onChange={(event) =>
                                        alterarFrequencia(aluno.id, aula, event.target.value)
                                    }
                                    >
                                    <option value="">Pendente</option>
                                    <option value="PRESENTE">Presente</option>
                                    <option value="FALTA">Falta</option>
                                    <option value="JUSTIFICADA">Justificada</option>
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </section>
      )}
        <div className="professor-attendance-save">
        <button
            type="button"
            onClick={salvarFrequencias}
            disabled={salvandoFrequencia || carregandoAlunos}
        >
            {salvandoFrequencia
            ? "Salvando..."
            : "Salvar frequências"}
        </button>
        </div>
    </div>
  );
}

export default ProfessorAttendance;