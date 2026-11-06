
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./AcademicTerms.css";

function AcademicTerms() {
  const [periodos, setPeriodos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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
      [name]: name === "year" || name === "termNumber"
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AcademicTerms;
