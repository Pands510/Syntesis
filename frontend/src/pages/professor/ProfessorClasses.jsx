import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  GraduationCap,
  CalendarDays,
  Clock,
  AlertCircle
} from "lucide-react";

import api from "../../services/api";
import "./ProfessorClasses.css";

function ProfessorClasses() {
  const [turmas, setTurmas] = useState([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

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

  const turmasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return turmas;

    return turmas.filter((turma) =>
      [
        turma.name,
        turma.code,
        turma.discipline?.name,
        turma.discipline?.code
      ]
        .filter(Boolean)
        .some((valor) => valor.toLowerCase().includes(termo))
    );
  }, [turmas, busca]);

  return (
    <div className="professor-classes">
      <div className="professor-classes-heading">
        <div>
          <h2>Minhas turmas</h2>
          <p>Consulte as turmas e disciplinas vinculadas ao seu perfil.</p>
        </div>

        <div className="professor-classes-total">
          <BookOpen size={20} />
          <span>
            {carregando ? "..." : `${turmas.length} turma(s)`}
          </span>
        </div>
      </div>

      <div className="professor-classes-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="Buscar por turma, código ou disciplina..."
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>

      {erro && (
        <div className="professor-classes-error">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      {carregando ? (
        <div className="professor-classes-message">
          Carregando suas turmas...
        </div>
      ) : !erro && turmasFiltradas.length === 0 ? (
        <div className="professor-classes-message">
          {busca
            ? "Nenhuma turma corresponde à sua pesquisa."
            : "Nenhuma turma foi vinculada ao seu perfil."}
        </div>
      ) : (
        <div className="professor-classes-grid">
          {turmasFiltradas.map((turma) => (
            <article className="professor-class-card" key={turma.id}>
              <div className="professor-class-card-header">
                <div className="professor-class-card-icon">
                  <BookOpen size={23} />
                </div>

                <span className="professor-class-card-status">
                  {turma.isActive ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div className="professor-class-card-content">
                <span className="professor-class-discipline-code">
                  {turma.discipline?.code || "Sem código"}
                </span>

                <h3>{turma.name}</h3>

                <p>
                  {turma.discipline?.name || "Disciplina não informada"}
                </p>
              </div>

              <div className="professor-class-card-details">
                <div>
                  <GraduationCap size={17} />
                  <span>Código: {turma.code}</span>
                </div>

                <div>
                  <CalendarDays size={17} />
                  <span>Ano letivo: {turma.academicYear}</span>
                </div>

                <div>
                  <Clock size={17} />
                  <span>Período: {turma.term}º</span>
                </div>

                {turma.semester != null && (
                  <div>
                    <BookOpen size={17} />
                    <span>Semestre: {turma.semester}º</span>
                  </div>
                )}
              </div>

              <div className="professor-class-card-footer">
                <span>
                  Carga horária:{" "}
                  {turma.discipline?.workloadHours ?? "Não informada"}
                  {turma.discipline?.workloadHours != null ? "h" : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfessorClasses;

