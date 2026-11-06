
import { useEffect, useState } from "react";
import {
  FileText,
  Save,
  AlertCircle,
  CheckCircle2,
  GraduationCap
} from "lucide-react";

import api from "../../services/api";
import "./ProfessorGrades.css";

const UNIDADES = ["U1", "U2", "U3"];

function converterNota(valor) {
  if (valor === "" || valor === null || valor === undefined) {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function ProfessorGrades() {
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);

  const [notasUnidades, setNotasUnidades] = useState({});
  const [notasFinais, setNotasFinais] = useState({});

  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [salvando, setSalvando] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [tipoMensagem, setTipoMensagem] = useState("");

  // Carregar turmas do professor
  useEffect(() => {
    async function carregarTurmas() {
      try {
        const resposta = await api.get("/api/school-classes");
        setTurmas(resposta.data.turmas || []);
      } catch (error) {
        setMensagem(
          error.response?.data?.mensagem ||
          "Não foi possível carregar as turmas."
        );
        setTipoMensagem("erro");
      } finally {
        setCarregandoTurmas(false);
      }
    }

    carregarTurmas();
  }, []);

  // Carregar avaliações e notas da turma selecionada
  useEffect(() => {
    if (!turmaSelecionada) {
      setAvaliacoes([]);
      setAlunos([]);
      setNotasUnidades({});
      setNotasFinais({});
      return;
    }

    let ativo = true;

    async function carregarDados() {
      setCarregandoDados(true);
      setMensagem("");
      setTipoMensagem("");

      try {
        const [respostaAvaliacoes, respostaNotas] = await Promise.all([
          api.get(`/api/assessments/${turmaSelecionada}`),
          api.get(`/api/grades/${turmaSelecionada}`)
        ]);

        if (!ativo) return;

        const listaAvaliacoes = respostaAvaliacoes.data.avaliacoes || [];
        console.log("AVALIAÇÕES DA TURMA:", listaAvaliacoes);
        const listaAlunos = respostaNotas.data.notas || [];

        setAvaliacoes(listaAvaliacoes);
        setAlunos(listaAlunos);

        const unidades = {};
        const finais = {};

        listaAlunos.forEach((aluno) => {
          UNIDADES.forEach((unidade) => {
            const nota = aluno.grades?.find(
              (item) => item.assessment?.unit === unidade
            );

            unidades[`${aluno.id}-${unidade}`] =
              nota?.score !== undefined && nota?.score !== null
                ? String(nota.score)
                : "";
          });

          finais[aluno.id] =
            aluno.finalExamGrade?.score !== undefined &&
            aluno.finalExamGrade?.score !== null
              ? String(aluno.finalExamGrade.score)
              : "";
        });

        setNotasUnidades(unidades);
        setNotasFinais(finais);
      } catch (error) {
        if (!ativo) return;

        setMensagem(
          error.response?.data?.mensagem ||
          "Não foi possível carregar as notas da turma."
        );
        setTipoMensagem("erro");
      } finally {
        if (ativo) setCarregandoDados(false);
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [turmaSelecionada]);

  function atualizarNotaUnidade(enrollmentId, unidade, valor) {
    setNotasUnidades((estadoAtual) => ({
      ...estadoAtual,
      [`${enrollmentId}-${unidade}`]: valor
    }));
  }

  function atualizarNotaFinal(enrollmentId, valor) {
    setNotasFinais((estadoAtual) => ({
      ...estadoAtual,
      [enrollmentId]: valor
    }));
  }

  function calcularMediaParcial(aluno) {
    const notas = UNIDADES.map((unidade) =>
      converterNota(notasUnidades[`${aluno.id}-${unidade}`])
    );

    if (notas.some((nota) => nota === null)) {
      return null;
    }

    return arredondar(
      notas.reduce((total, nota) => total + nota, 0) / 3
    );
  }

  function calcularMediaFinal(aluno) {
    const mediaParcial = calcularMediaParcial(aluno);
    const notaFinal = converterNota(notasFinais[aluno.id]);

    if (
      mediaParcial === null ||
      mediaParcial < 3 ||
      mediaParcial >= 7 ||
      notaFinal === null
    ) {
      return null;
    }

    return arredondar((mediaParcial + notaFinal) / 2);
  }

  function obterSituacao(aluno) {
    const mediaParcial = calcularMediaParcial(aluno);

    if (mediaParcial === null) {
      return {
        texto: "Notas pendentes",
        classe: "pendente"
      };
    }

    if (mediaParcial >= 7) {
      return {
        texto: "Aprovado",
        classe: "aprovado"
      };
    }

    if (mediaParcial < 3) {
      return {
        texto: "Reprovado",
        classe: "reprovado"
      };
    }

    const mediaFinal = calcularMediaFinal(aluno);

    if (mediaFinal === null) {
      return {
        texto: "Prova final",
        classe: "final"
      };
    }

    if (mediaFinal >= 5) {
      return {
        texto: "Aprovado na final",
        classe: "aprovado"
      };
    }

    return {
      texto: "Reprovado na final",
      classe: "reprovado"
    };
  }

  function validarValorNota(valor) {
    if (valor === "") return true;

    const nota = Number(valor);

    return (
      Number.isFinite(nota) &&
      nota >= 0 &&
      nota <= 10 &&
      /^\d{1,2}([.,]\d{0,2})?$/.test(valor)
    );
  }

  async function salvarNotasUnidade(unidade) {
    const avaliacao = avaliacoes.find(
      (item) => item.unit === unidade
    );

    if (!avaliacao) {
      setMensagem(`Não existe avaliação cadastrada para ${unidade}.`);
      setTipoMensagem("erro");
      return;
    }

    const grades = alunos
      .map((aluno) => {
        const valor = notasUnidades[`${aluno.id}-${unidade}`];

        if (valor === undefined || valor === "") return null;

        if (!validarValorNota(valor)) {
          return { invalida: true };
        }

        return {
          enrollmentId: aluno.id,
          score: Number(valor.replace(",", "."))
        };
      })
      .filter(Boolean);

    if (grades.some((item) => item.invalida)) {
      setMensagem("Verifique as notas. Utilize valores de 0 a 10, com até duas casas decimais.");
      setTipoMensagem("erro");
      return;
    }

    if (grades.length === 0) {
      setMensagem(`Nenhuma nota preenchida para ${unidade}.`);
      setTipoMensagem("erro");
      return;
    }

    setSalvando(unidade);
    setMensagem("");

    try {
      await api.post("/api/grades/batch", {
        assessmentId: avaliacao.id,
        grades
      });

      setMensagem(`Notas de ${unidade} salvas com sucesso.`);
      setTipoMensagem("sucesso");
    } catch (error) {
      setMensagem(
        error.response?.data?.mensagem ||
        `Não foi possível salvar as notas de ${unidade}.`
      );
      setTipoMensagem("erro");
    } finally {
      setSalvando("");
    }
  }

  async function salvarNotasFinais() {
    const grades = alunos
      .filter((aluno) => {
        const media = calcularMediaParcial(aluno);
        return media !== null && media >= 3 && media < 7;
      })
      .map((aluno) => {
        const valor = notasFinais[aluno.id];

        if (valor === undefined || valor === "") return null;

        if (!validarValorNota(valor)) {
          return { invalida: true };
        }

        return {
          enrollmentId: aluno.id,
          score: Number(valor.replace(",", "."))
        };
      })
      .filter(Boolean);

    if (grades.some((item) => item.invalida)) {
      setMensagem("Verifique as notas finais. Utilize valores de 0 a 10, com até duas casas decimais.");
      setTipoMensagem("erro");
      return;
    }

    if (grades.length === 0) {
      setMensagem("Nenhuma nota final válida preenchida para salvar.");
      setTipoMensagem("erro");
      return;
    }

    setSalvando("FINAL");
    setMensagem("");

    try {
      await api.post("/api/grades/final", {
        classId: turmaSelecionada,
        grades
      });

      setMensagem("Notas da prova final salvas com sucesso.");
      setTipoMensagem("sucesso");
    } catch (error) {
      setMensagem(
        error.response?.data?.mensagem ||
        "Não foi possível salvar as notas finais."
      );
      setTipoMensagem("erro");
    } finally {
      setSalvando("");
    }
  }

  const unidadesAusentes = UNIDADES.filter(
    (unidade) => !avaliacoes.some((item) => item.unit === unidade)
  );

  if (carregandoTurmas) {
    return (
      <div className="grades-loading">
        Carregando turmas...
      </div>
    );
  }

  return (
    <div className="professor-grades">
      <header className="grades-header">
        <div>
          <span className="grades-subtitle">ÁREA DO PROFESSOR</span>
          <h1>
            <FileText size={27} />
            Lançamento de notas
          </h1>
          <p>
            Gerencie as avaliações, médias e resultados dos alunos.
          </p>
        </div>
      </header>

      <section className="grades-filter">
        <label htmlFor="select-turma">
          Selecionar turma
        </label>

        <select
          id="select-turma"
          value={turmaSelecionada}
          onChange={(event) => setTurmaSelecionada(event.target.value)}
        >
          <option value="">Selecione uma turma</option>

          {turmas.map((turma) => (
            <option key={turma.id} value={turma.id}>
              {turma.name} — {turma.code}
            </option>
          ))}
        </select>
      </section>

      {mensagem && (
        <div className={`grades-message ${tipoMensagem}`}>
          {tipoMensagem === "sucesso" ? (
            <CheckCircle2 size={19} />
          ) : (
            <AlertCircle size={19} />
          )}
          {mensagem}
        </div>
      )}

      {!turmaSelecionada && (
        <div className="grades-empty">
          <GraduationCap size={42} />
          <h2>Selecione uma turma</h2>
          <p>
            Escolha uma turma para visualizar e lançar as notas dos alunos.
          </p>
        </div>
      )}

      {turmaSelecionada && carregandoDados && (
        <div className="grades-loading">
          Carregando avaliações e notas...
        </div>
      )}

      {turmaSelecionada && !carregandoDados && (
        <>
          {unidadesAusentes.length > 0 && (
            <div className="grades-message aviso">
              <AlertCircle size={19} />
              Avaliações não cadastradas: {unidadesAusentes.join(", ")}.
              Cadastre essas avaliações antes de lançar as respectivas notas.
            </div>
          )}

          <section className="grades-summary">
            <div>
              <span>Alunos matriculados</span>
              <strong>{alunos.length}</strong>
            </div>

            <div>
              <span>Avaliações cadastradas</span>
              <strong>{avaliacoes.length} / 3</strong>
            </div>

            <div>
              <span>Unidades disponíveis</span>
              <strong>
                {UNIDADES.filter((unidade) =>
                  avaliacoes.some((item) => item.unit === unidade)
                ).join(", ") || "Nenhuma"}
              </strong>
            </div>
          </section>

          <section className="grades-section">
            <div className="grades-section-header">
              <div>
                <h2>Notas dos alunos</h2>
                <p>
                  Preencha as notas e salve cada unidade separadamente.
                </p>
              </div>
            </div>

            <div className="grades-actions">
              {UNIDADES.map((unidade) => (
                <button
                  key={unidade}
                  type="button"
                  onClick={() => salvarNotasUnidade(unidade)}
                  disabled={
                    !avaliacoes.some((item) => item.unit === unidade) ||
                    salvando !== ""
                  }
                >
                  <Save size={16} />
                  {salvando === unidade
                    ? "Salvando..."
                    : `Salvar ${unidade}`}
                </button>
              ))}

              <button
                type="button"
                className="final-save-button"
                onClick={salvarNotasFinais}
                disabled={salvando !== ""}
              >
                <Save size={16} />
                {salvando === "FINAL"
                  ? "Salvando..."
                  : "Salvar notas finais"}
              </button>
            </div>

            <div className="grades-table-wrapper">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Matrícula</th>
                    <th>U1</th>
                    <th>U2</th>
                    <th>U3</th>
                    <th>Média parcial</th>
                    <th>Prova final</th>
                    <th>Média final</th>
                    <th>Situação</th>
                  </tr>
                </thead>

                <tbody>
                  {alunos.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="grades-no-students">
                        Nenhum aluno com matrícula ativa nesta turma.
                      </td>
                    </tr>
                  ) : (
                    alunos.map((aluno) => {
                      const mediaParcial = calcularMediaParcial(aluno);
                      const mediaFinal = calcularMediaFinal(aluno);
                      const situacao = obterSituacao(aluno);
                      const elegivelFinal =
                        mediaParcial !== null &&
                        mediaParcial >= 3 &&
                        mediaParcial < 7;

                      return (
                        <tr key={aluno.id}>
                          <td className="grades-student-name">
                            {aluno.student?.user?.name || "Aluno sem nome"}
                          </td>

                          <td>
                            {aluno.student?.registrationNumber || "—"}
                          </td>

                          {UNIDADES.map((unidade) => (
                            <td key={unidade}>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.01"
                                placeholder="—"
                                value={
                                  notasUnidades[`${aluno.id}-${unidade}`] ?? ""
                                }
                                onChange={(event) =>
                                  atualizarNotaUnidade(
                                    aluno.id,
                                    unidade,
                                    event.target.value
                                  )
                                }
                                aria-label={`${unidade} - ${aluno.student?.user?.name || "Aluno"}`}
                              />
                            </td>
                          ))}

                          <td className="grades-average">
                            {mediaParcial !== null
                              ? mediaParcial.toFixed(2)
                              : "—"}
                          </td>

                          <td>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.01"
                              placeholder="—"
                              value={notasFinais[aluno.id] ?? ""}
                              disabled={!elegivelFinal}
                              onChange={(event) =>
                                atualizarNotaFinal(
                                  aluno.id,
                                  event.target.value
                                )
                              }
                              aria-label={`Prova final - ${aluno.student?.user?.name || "Aluno"}`}
                            />
                          </td>

                          <td className="grades-average">
                            {mediaFinal !== null
                              ? mediaFinal.toFixed(2)
                              : "—"}
                          </td>

                          <td>
                            <span className={`grades-status ${situacao.classe}`}>
                              {situacao.texto}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="grades-footnote">
              A média parcial exige as três notas. Alunos com média entre
              3,00 e 6,99 podem realizar a prova final. A aprovação na final
              exige média final igual ou superior a 5,00.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

export default ProfessorGrades;
