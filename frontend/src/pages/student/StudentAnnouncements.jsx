
import { useEffect, useState } from "react";
import {
  Megaphone,
  RefreshCw,
  CalendarDays,
  UserRound,
  ChevronDown,
  ChevronUp,
  Inbox
} from "lucide-react";

import api from "../../services/api";
import "./StudentAnnouncements.css";

function StudentAnnouncements() {
  const [categoria, setCategoria] = useState("GERAL");
  const [comunicados, setComunicados] = useState([]);
  const [abertoId, setAbertoId] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarComunicados();
  }, [categoria]);

  async function carregarComunicados() {
    setCarregando(true);
    setErro("");
    setAbertoId(null);

    try {
      const resposta = await api.get("/api/announcements/received", {
        params: { category: categoria }
      });

      const lista = Array.isArray(resposta.data)
        ? resposta.data
        : resposta.data.comunicados || [];

      setComunicados(lista);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os comunicados."
      );
    } finally {
      setCarregando(false);
    }
  }

  function obterDataLeitura(comunicado) {
    return (
      comunicado.recipient?.readAt ||
      comunicado.recipients?.[0]?.readAt ||
      comunicado.readAt ||
      null
    );
  }

  function estaLido(comunicado) {
    return Boolean(obterDataLeitura(comunicado));
  }

  async function abrirComunicado(comunicado) {
    const estaAberto = abertoId === comunicado.id;

    if (estaAberto) {
      setAbertoId(null);
      return;
    }

    setAbertoId(comunicado.id);

    if (estaLido(comunicado)) {
      return;
    }

    try {
      await api.patch(
        `/api/announcements/${comunicado.id}/read`
      );

      const dataLeitura = new Date().toISOString();

      setComunicados((atuais) =>
        atuais.map((item) => {
          if (item.id !== comunicado.id) return item;

          return {
            ...item,
            readAt: dataLeitura,
            recipient: {
              ...item.recipient,
              readAt: dataLeitura
            },
            recipients: item.recipients?.map((recipient) => ({
              ...recipient,
              readAt: dataLeitura
            }))
          };
        })
      );
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível registrar a leitura do comunicado."
      );
    }
  }

  function formatarData(data) {
    if (!data) return "Data não disponível";

    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return "Data não disponível";
    }

    return dataFormatada.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  }

  function obterNomeAutor(comunicado) {
    return comunicado.author?.name || "Autor não identificado";
  }

  function obterTipoAutor(comunicado) {
    if (comunicado.author?.role === "ADMIN") {
      return "Administração";
    }

    return "Professor";
  }

  const totalNaoLidos = comunicados.filter(
    (comunicado) => !estaLido(comunicado)
  ).length;

  return (
    <div className="student-announcements">

      <div className="student-announcements-header">
        <div>
          <h2>
            <Megaphone size={25} />
            Comunicados
          </h2>

          <p>
            Acompanhe os avisos e informações importantes da instituição
            e dos seus professores.
          </p>
        </div>

        <button
          type="button"
          className="student-announcements-refresh"
          onClick={carregarComunicados}
          disabled={carregando}
        >
          <RefreshCw
            size={17}
            className={carregando ? "girando" : ""}
          />
          Atualizar
        </button>
      </div>

      <div className="student-announcements-tabs">

        <button
          type="button"
          className={`student-announcements-tab ${
            categoria === "GERAL" ? "ativo" : ""
          }`}
          onClick={() => setCategoria("GERAL")}
        >
          <Megaphone size={17} />
          Geral
          {categoria === "GERAL" && (
            <span>{totalNaoLidos}</span>
          )}
        </button>

        <button
          type="button"
          className={`student-announcements-tab ${
            categoria === "INDIVIDUAL" ? "ativo" : ""
          }`}
          onClick={() => setCategoria("INDIVIDUAL")}
        >
          <UserRound size={17} />
          Individual
          {categoria === "INDIVIDUAL" && (
            <span>{totalNaoLidos}</span>
          )}
        </button>

      </div>

      {erro && (
        <div className="student-announcements-feedback">
          {erro}
        </div>
      )}

      <div className="student-announcements-list-card">

        {carregando ? (
          <div className="student-announcements-loading">
            Carregando comunicados...
          </div>
        ) : comunicados.length === 0 ? (
          <div className="student-announcements-empty">
            <Inbox size={42} />

            <strong>
              Nenhum comunicado encontrado
            </strong>

            <p>
              {categoria === "GERAL"
                ? "Não existem comunicados gerais disponíveis para você no momento."
                : "Você ainda não recebeu comunicados individuais."}
            </p>
          </div>
        ) : (
          <div className="student-announcements-list">

            {comunicados.map((comunicado) => {
              const lido = estaLido(comunicado);
              const aberto = abertoId === comunicado.id;

              return (
                <article
                  key={comunicado.id}
                  className={`student-announcement-item ${
                    !lido ? "naolido" : ""
                  }`}
                >

                  <button
                    type="button"
                    className="student-announcement-top"
                    onClick={() => abrirComunicado(comunicado)}
                    aria-expanded={aberto}
                  >
                    <div className="student-announcement-title">
                      <h3>{comunicado.title}</h3>

                      {!lido ? (
                        <span className="student-announcement-unread">
                          Não lido
                        </span>
                      ) : (
                        <span className="student-announcement-read">
                          Lido
                        </span>
                      )}
                    </div>

                    {aberto ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {aberto && (
                    <>
                      <div className="student-announcement-content">
                        {comunicado.content}
                      </div>

                      <div className="student-announcement-info">

                        <span>
                          <UserRound size={15} />
                          {obterNomeAutor(comunicado)}
                          {" · "}
                          {obterTipoAutor(comunicado)}
                        </span>

                        <span>
                          <CalendarDays size={15} />
                          {formatarData(comunicado.publishedAt)}
                        </span>

                      </div>
                    </>
                  )}

                  {!aberto && (
                    <p className="student-announcement-content">
                      {comunicado.content?.length > 140
                        ? `${comunicado.content.slice(0, 140)}...`
                        : comunicado.content}
                    </p>
                  )}

                </article>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}

export default StudentAnnouncements;
