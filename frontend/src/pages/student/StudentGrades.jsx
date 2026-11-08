
import { useEffect, useState } from "react";
import {
  BookOpen,
  AlertCircle,
  ClipboardCheck,
  Clock,
  RefreshCw
} from "lucide-react";

import api from "../../services/api";

import "./StudentGrades.css";

function StudentGrades() {
  const [boletim, setBoletim] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarBoletim() {
    try {
      setErro("");
      setCarregando(true);

      const resposta = await api.get("/api/grades/student/report");

      setBoletim(resposta.data.boletim || []);
    } catch (error) {
      console.error("Erro ao carregar boletim:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar seu boletim."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarBoletim();
  }, []);

  function formatarNota(nota) {
    if (nota === null || nota === undefined) {
      return "—";
    }

    return Number(nota).toFixed(2).replace(".", ",");
  }

  function obterSituacao(situacao) {
    const situacoes = {
      APROVADO: {
        texto: "Aprovado",
        classe: "aprovado"
      },
      APTO_FINAL: {
        texto: "Apto para prova final",
        classe: "apto-final"
      },
      APROVADO_FINAL: {
        texto: "Aprovado após prova final",
        classe: "aprovado-final"
      },
      REPROVADO: {
        texto: "Reprovado",
        classe: "reprovado"
      },
      REPROVADO_FINAL: {
        texto: "Reprovado após prova final",
        classe: "reprovado-final"
      },
      EM_ANDAMENTO: {
        texto: "Em andamento",
        classe: "em-andamento"
      }
    };

    return situacoes[situacao] || {
      texto: "Em andamento",
      classe: "em-andamento"
    };
  }

  if (carregando) {
    return (
      <div className="student-grades-loading">
        <RefreshCw size={22} className="student-grades-spinner" />
        <p>Carregando seu boletim...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-grades-error">
        <AlertCircle size={22} />
        <p>{erro}</p>

        <button type="button" onClick={carregarBoletim}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <main className="student-grades">

      <section className="student-grades-welcome">
        <div className="student-grades-welcome-icon">
          <BookOpen size={30} />
        </div>

        <div>
          <h2>Meu boletim</h2>
          <p>
            Acompanhe suas avaliações, médias e resultados
            em cada disciplina.
          </p>
        </div>
      </section>

      <section className="student-grades-section">

        <div className="student-grades-heading">
          <div>
            <h2>Desempenho por disciplina</h2>
            <p>
              {boletim.length} disciplina(s) com matrícula ativa.
            </p>
          </div>
        </div>

        {boletim.length === 0 ? (
          <div className="student-grades-empty">
            <BookOpen size={35} />
            <h3>Nenhuma disciplina encontrada</h3>
            <p>
              Não existem disciplinas com matrícula ativa
              para exibir no momento.
            </p>
          </div>
        ) : (
          <div className="student-report-grid">

            {boletim.map((item) => {
              const situacao = obterSituacao(item.situacao);

              return (
                <article
                  className="student-report-card"
                  key={item.enrollmentId}
                >

                  <div className="student-report-header">
                    <div>
                      <h3>{item.disciplina}</h3>

                      <span>
                        {item.codigo} · {item.turma}
                      </span>
                    </div>

                    <span
                      className={`student-report-status ${situacao.classe}`}
                    >
                      {situacao.texto}
                    </span>
                  </div>

                  <div className="student-report-grades">

                    <div>
                      <span>AV1</span>
                      <strong>
                        {formatarNota(item.notas?.U1)}
                      </strong>
                    </div>

                    <div>
                      <span>AV2</span>
                      <strong>
                        {formatarNota(item.notas?.U2)}
                      </strong>
                    </div>

                    <div>
                      <span>AV3</span>
                      <strong>
                        {formatarNota(item.notas?.U3)}
                      </strong>
                    </div>

                  </div>

                  <div className="student-report-summary">

                    <div>
                      <span>Média parcial</span>
                      <strong>
                        {formatarNota(item.mediaParcial)}
                      </strong>
                    </div>

                    <div>
                      <span>Faltas</span>
                      <strong>
                        {item.faltas ?? 0}
                      </strong>
                    </div>

                  </div>

                  <div className="student-report-details">
                    <div>
                      <Clock size={16} />
                      <span>
                        Carga horária: {item.cargaHoraria ?? "—"} horas
                      </span>
                    </div>

                    <div>
                      <ClipboardCheck size={16} />
                      <span>
                        Prova final: {formatarNota(item.notaFinal)}
                      </span>
                    </div>

                    {item.mediaFinal !== null &&
                      item.mediaFinal !== undefined && (
                        <div className="student-report-final">
                          <strong>
                            Média final: {formatarNota(item.mediaFinal)}
                          </strong>
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

export default StudentGrades;
