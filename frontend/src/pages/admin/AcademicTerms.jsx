import { useEffect, useState } from "react";
import api from "../../services/api";
import "./AcademicTerms.css";

function AcademicTerms() {
  const [periodos, setPeriodos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [resultadoProgressao, setResultadoProgressao] = useState(null);
  const [tipoResultado, setTipoResultado] = useState("");
  const [periodoSelecionado, setPeriodoSelecionado] = useState(null);

  const [formulario, setFormulario] = useState({
    name: "",
    year: new Date().getFullYear(),
    termNumber: 1,
    startDate: "",
    endDate: ""
  });

  async function carregarPeriodos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/api/academic-terms");
      setPeriodos(resposta.data.periodos || []);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os períodos letivos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPeriodos();
  }, []);

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]:
        name === "year" || name === "termNumber"
          ? Number(value)
          : value
    }));
  }

  async function cadastrarPeriodo(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const dados = {
        ...formulario,
        startDate: `${formulario.startDate}T00:00:00.000Z`,
        endDate: `${formulario.endDate}T23:59:59.000Z`
      };

      const resposta = await api.post(
        "/api/academic-terms",
        dados
      );

      setMensagem(
        resposta.data.mensagem || "Período cadastrado com sucesso."
      );

      setFormulario({
        name: "",
        year: new Date().getFullYear(),
        termNumber: 1,
        startDate: "",
        endDate: ""
      });

      setMostrarFormulario(false);
      await carregarPeriodos();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível cadastrar o período letivo."
      );
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR", {
      timeZone: "UTC"
    });
  }

  function fecharResultado() {
    setResultadoProgressao(null);
    setTipoResultado("");
    setPeriodoSelecionado(null);
    setMostrarConfirmacao(false);
  }

  async function visualizarProgressao(periodo) {
    try {
      setCarregandoPrevia(true);
      setErro("");
      setMensagem("");
      setMostrarConfirmacao(false);

      setResultadoProgressao(null);
      setTipoResultado("");
      setPeriodoSelecionado(periodo);

      const resposta = await api.get(
        `/api/academic-terms/${periodo.id}/progressao/previa`
      );

      setResultadoProgressao(resposta.data);
      setTipoResultado("previa");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível gerar a prévia da progressão curricular."
      );

      setPeriodoSelecionado(null);
    } finally {
      setCarregandoPrevia(false);
    }
  }

  async function confirmarEncerramento() {
    if (!periodoSelecionado || tipoResultado !== "previa") {
      return;
    }

    try {
      setEncerrando(true);
      setErro("");
      setMensagem("");

      const resposta = await api.patch(
        `/api/academic-terms/${periodoSelecionado.id}/encerrar`
      );

      setResultadoProgressao(resposta.data);
      setTipoResultado("encerramento");
      setMostrarConfirmacao(false);

      setMensagem(
        resposta.data.mensagem ||
        "Período letivo encerrado com sucesso."
      );

      await carregarPeriodos();
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível encerrar o período letivo."
      );
    } finally {
      setEncerrando(false);
    }
  }

  function renderizarAlunos(alunos, tipo) {
    if (!alunos || alunos.length === 0) {
      return (
        <p className="academic-terms-empty">
          Nenhum aluno nesta categoria.
        </p>
      );
    }

    return (
      <div className="academic-terms-report-list">
        {alunos.map((aluno) => (
          <div
            className="academic-terms-report-student"
            key={aluno.studentId}
          >
            <div>
              <strong>{aluno.nome}</strong>
              <span>
                Matrícula: {aluno.matricula || "Não informada"}
              </span>
              <span>
                Curso: {aluno.curso || "Não vinculado"}
              </span>
            </div>

            {tipo === "progressao" && (
              <span className="academic-terms-progression">
                {aluno.semestreAnterior}º → {aluno.novoSemestre}º semestre
              </span>
            )}

            {tipo === "atual" && (
              <span className="academic-terms-progression">
                {aluno.semestreAtual}º semestre
              </span>
            )}

            {tipo === "inconsistente" && (
              <span className="academic-terms-warning-text">
                {aluno.motivo}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  function renderizarResultado() {
    if (!resultadoProgressao) return null;

    const relatorio = resultadoProgressao.relatorio;

    if (!relatorio) return null;

    const foiEncerrado = tipoResultado === "encerramento";

    return (
      <section className="academic-terms-report">
        <div className="academic-terms-report-header">
          <div>
            <h3>
              {foiEncerrado
                ? "Relatório do encerramento"
                : "Prévia da progressão curricular"}
            </h3>

            <p>
              {resultadoProgressao.periodo?.name ||
                periodoSelecionado?.name}
            </p>
          </div>

          <button
            type="button"
            className="academic-terms-close-button"
            onClick={fecharResultado}
          >
            Fechar relatório
          </button>
        </div>

        <div className="academic-terms-report-notice">
          {foiEncerrado
            ? "O período foi encerrado e as progressões foram processadas."
            : "Esta é uma simulação. Nenhum semestre ou histórico acadêmico foi alterado."}
        </div>

        <div className="academic-terms-summary">
          <div className="academic-terms-summary-card">
            <strong>{relatorio.totalAlunos}</strong>
            <span>Alunos analisados</span>
          </div>

          <div className="academic-terms-summary-card">
            <strong>{relatorio.totalElegiveis}</strong>
            <span>Elegíveis para progressão</span>
          </div>

          <div className="academic-terms-summary-card">
            <strong>{relatorio.trancados?.length || 0}</strong>
            <span>Trancados</span>
          </div>

          <div className="academic-terms-summary-card">
            <strong>{relatorio.concluidos?.length || 0}</strong>
            <span>Concluídos</span>
          </div>

          <div className="academic-terms-summary-card">
            <strong>{relatorio.dadosInconsistentes?.length || 0}</strong>
            <span>Dados inconsistentes</span>
          </div>
        </div>

        <div className="academic-terms-report-section">
          <h4>
            {foiEncerrado
              ? "Progressões realizadas"
              : "Progressões previstas"}
          </h4>

          {renderizarAlunos(
            foiEncerrado
              ? relatorio.progressõesRealizadas
              : relatorio.progressõesPrevistas,
            "progressao"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Alunos que chegaram ao último semestre</h4>

          {renderizarAlunos(
            relatorio.chegaramAoUltimoSemestre,
            "progressao"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Alunos que já estavam no último semestre</h4>

          {renderizarAlunos(
            relatorio.ultimoSemestre,
            "atual"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Alunos com matrícula trancada</h4>

          {renderizarAlunos(
            relatorio.trancados,
            "atual"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Alunos com situação acadêmica concluída</h4>

          {renderizarAlunos(
            relatorio.concluidos,
            "atual"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Dados inconsistentes</h4>

          {renderizarAlunos(
            relatorio.dadosInconsistentes,
            "inconsistente"
          )}
        </div>

        <div className="academic-terms-report-section">
          <h4>Progressões já registradas neste período</h4>

          {renderizarAlunos(
            relatorio.progressõesJaRegistradas,
            "atual"
          )}
        </div>

        {tipoResultado === "previa" && (
          <div className="academic-terms-confirm-area">
            {!mostrarConfirmacao ? (
              <button
                type="button"
                className="academic-terms-finish-button"
                onClick={() => setMostrarConfirmacao(true)}
              >
                Encerrar período letivo
              </button>
            ) : (
              <div className="academic-terms-confirm-box">
                <h4>Confirmar encerramento?</h4>

                <p>
                  Esta operação encerrará o período letivo,
                  avançará os alunos elegíveis e registrará
                  as progressões no histórico acadêmico.
                  Essa ação não deve ser realizada sem revisar
                  o relatório.
                </p>

                <div className="academic-terms-form-actions">
                  <button
                    type="button"
                    className="academic-terms-cancel-button"
                    onClick={() => setMostrarConfirmacao(false)}
                    disabled={encerrando}
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    className="academic-terms-finish-button"
                    onClick={confirmarEncerramento}
                    disabled={encerrando}
                  >
                    {encerrando
                      ? "Encerrando..."
                      : "Confirmar encerramento"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="academic-terms-page">
      <div className="academic-terms-header">
        <div>
          <h2>Períodos letivos</h2>
          <p>Gerencie os semestres e calendários acadêmicos.</p>
        </div>

        <button
          type="button"
          className="academic-terms-primary-button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setErro("");
            setMensagem("");
          }}
        >
          {mostrarFormulario ? "Cancelar" : "Novo período"}
        </button>
      </div>

      {mensagem && (
        <p className="academic-terms-success">{mensagem}</p>
      )}

      {erro && (
        <p className="academic-terms-error">{erro}</p>
      )}

      {mostrarFormulario && (
        <form
          className="academic-terms-form"
          onSubmit={cadastrarPeriodo}
        >
          <h3>Novo período letivo</h3>

          <div className="academic-terms-form-grid">
            <div className="academic-terms-field">
              <label htmlFor="name">Nome do período</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Ex.: 2º Semestre de 2026"
                value={formulario.name}
                onChange={atualizarCampo}
                required
              />
            </div>

            <div className="academic-terms-field">
              <label htmlFor="year">Ano</label>
              <input
                id="year"
                name="year"
                type="number"
                min="2000"
                value={formulario.year}
                onChange={atualizarCampo}
                required
              />
            </div>

            <div className="academic-terms-field">
              <label htmlFor="termNumber">Número do período</label>
              <select
                id="termNumber"
                name="termNumber"
                value={formulario.termNumber}
                onChange={atualizarCampo}
                required
              >
                <option value={1}>1º Semestre</option>
                <option value={2}>2º Semestre</option>
              </select>
            </div>

            <div className="academic-terms-field">
              <label htmlFor="startDate">Data de início</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formulario.startDate}
                onChange={atualizarCampo}
                required
              />
            </div>

            <div className="academic-terms-field">
              <label htmlFor="endDate">Data de término</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                min={formulario.startDate || undefined}
                value={formulario.endDate}
                onChange={atualizarCampo}
                required
              />
            </div>
          </div>

          <div className="academic-terms-form-actions">
            <button
              type="button"
              className="academic-terms-cancel-button"
              onClick={() => setMostrarFormulario(false)}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="academic-terms-primary-button"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Cadastrar período"}
            </button>
          </div>
        </form>
      )}

      {carregando ? (
        <p>Carregando períodos...</p>
      ) : periodos.length === 0 ? (
        <p>Nenhum período letivo cadastrado.</p>
      ) : (
        <div className="academic-terms-table-container">
          <table className="academic-terms-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Ano</th>
                <th>Início</th>
                <th>Término</th>
                <th>Turmas</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {periodos.map((periodo) => (
                <tr key={periodo.id}>
                  <td>{periodo.name}</td>
                  <td>{periodo.year}</td>
                  <td>{formatarData(periodo.startDate)}</td>
                  <td>{formatarData(periodo.endDate)}</td>
                  <td>{periodo._count?.schoolClasses ?? 0}</td>

                  <td>
                    <span
                      className={`academic-terms-status ${periodo.status.toLowerCase()}`}
                    >
                      {periodo.status.replace("_", " ")}
                    </span>
                  </td>

                  <td>
                    {periodo.status === "EM_ANDAMENTO" ? (
                      <button
                        type="button"
                        className="academic-terms-preview-button"
                        onClick={() => visualizarProgressao(periodo)}
                        disabled={carregandoPrevia || encerrando}
                      >
                        {carregandoPrevia &&
                        periodoSelecionado?.id === periodo.id
                          ? "Gerando..."
                          : "Visualizar progressão"}
                      </button>
                    ) : (
                      <span className="academic-terms-no-action">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderizarResultado()}
    </div>
  );
}

export default AcademicTerms;