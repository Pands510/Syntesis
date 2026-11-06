
import { useEffect, useState } from "react";
import { AlertCircle, BookOpen } from "lucide-react";

import api from "../../services/api";
import "./StudentReport.css";

function StudentReport() {
  const [boletim, setBoletim] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarBoletim() {
      try {
        const resposta = await api.get("/api/grades/student/report");
        setBoletim(resposta.data.boletim);
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

    carregarBoletim();
  }, []);

  if (carregando) {
    return (
      <div className="student-report-page">
        <div className="student-loading">
          Carregando boletim...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-report-page">
        <div className="student-error">
          <AlertCircle size={20} />
          <p>{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="student-report-page">
      <section className="student-section">
        <div className="student-section-heading">
          <div>
            <h2>Meu boletim</h2>
            <p>
              Acompanhe suas notas, médias e frequência por disciplina.
            </p>
          </div>
          <BookOpen size={28} />
        </div>

        {boletim.length === 0 ? (
          <div className="student-empty">
            Você ainda não possui disciplinas com matrícula ativa.
          </div>
        ) : (
          <div className="student-report-grid">
            {boletim.map((item) => (
              <article
                className="student-report-card"
                key={item.enrollmentId}
              >
                <div className="student-report-header">
                  <div>
                    <h3>{item.disciplina}</h3>
                    <span>
                      {item.codigo} · {item.cargaHoraria}h
                    </span>
                  </div>

                  <span
                    className={`student-report-status ${item.situacao.toLowerCase()}`}
                  >
                    {item.situacao.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="student-report-grades">
                  {["U1", "U2", "U3"].map((unidade) => (
                    <div key={unidade}>
                      <span>{unidade}</span>
                      <strong>
                        {item.notas[unidade] !== null
                          ? item.notas[unidade].toFixed(2)
                          : "—"}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="student-report-summary">
                  <div>
                    <span>Média parcial</span>
                    <strong>
                      {item.mediaParcial !== null
                        ? item.mediaParcial.toFixed(2)
                        : "Pendente"}
                    </strong>
                  </div>

                  <div>
                    <span>Prova final</span>
                    <strong>
                      {item.notaFinal !== null
                        ? item.notaFinal.toFixed(2)
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Média final</span>
                    <strong>
                      {item.mediaFinal !== null
                        ? item.mediaFinal.toFixed(2)
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Faltas</span>
                    <strong>{item.faltas}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default StudentReport;
