
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  GraduationCap,
  BookOpen,
  Hash,
  CalendarDays,
  LogOut,
  AlertCircle,
  FileText,
  Download
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "./StudentDashboard.css";

function StudentDashboard() {
  const { encerrarSessao } = useAuth();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [emitindoComprovante, setEmitindoComprovante] = useState(false);
  const [erroComprovante, setErroComprovante] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const resposta = await api.get("/api/users/me");
        setAluno(resposta.data.aluno);
      } catch (error) {
        console.error("Erro ao carregar perfil acadêmico:", error);

        setErro(
          error.response?.data?.mensagem ||
          "Não foi possível carregar seus dados acadêmicos."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  function sair() {
    encerrarSessao();
    navigate("/login", { replace: true });
  }

  async function emitirComprovante() {
    if (emitindoComprovante) return;

    setErroComprovante("");

    // Abre a aba imediatamente para evitar bloqueio de pop-up.
    const novaAba = window.open("", "_blank");

    if (!novaAba) {
      setErroComprovante(
        "O navegador bloqueou a abertura do comprovante. Permita pop-ups para este site e tente novamente."
      );
      return;
    }

    try {
      setEmitindoComprovante(true);

      novaAba.document.title = "Emitindo comprovante...";
      novaAba.document.body.innerHTML =
        "<p style='font-family: Arial; padding: 24px;'>Gerando seu comprovante de matrícula...</p>";

      const resposta = await api.get("/api/enrollment-proofs/my", {
        responseType: "blob"
      });

      const arquivoPdf = new Blob([resposta.data], {
        type: "application/pdf"
      });

      const urlPdf = URL.createObjectURL(arquivoPdf);

      novaAba.location.href = urlPdf;

      // Libera a memória utilizada pelo arquivo após o carregamento.
      window.setTimeout(() => {
        URL.revokeObjectURL(urlPdf);
      }, 60000);

    } catch (error) {
      console.error("Erro ao emitir comprovante:", error);

      novaAba.close();

      let mensagem =
        "Não foi possível emitir seu comprovante de matrícula.";

      const respostaErro = error.response?.data;

      if (respostaErro instanceof Blob) {
        try {
          const texto = await respostaErro.text();
          const dados = JSON.parse(texto);

          mensagem = dados.mensagem || mensagem;
        } catch {
          // Mantém a mensagem padrão caso a resposta não seja JSON.
        }
      } else if (respostaErro?.mensagem) {
        mensagem = respostaErro.mensagem;
      }

      setErroComprovante(mensagem);

    } finally {
      setEmitindoComprovante(false);
    }
  }

  if (carregando) {
    return (
      <div className="student-loading">
        Carregando seus dados acadêmicos...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="student-error">
        <AlertCircle size={22} />
        <p>{erro}</p>
        <button onClick={sair}>Voltar ao login</button>
      </div>
    );
  }

  const dadosUsuario = aluno?.user;

  return (
    <main className="student-dashboard">

      <section className="student-welcome">
        <div>
          <span className="student-welcome-label">
            PAINEL DO ALUNO
          </span>

          <h2>
            Olá, {dadosUsuario?.name?.split(" ")[0]}!
          </h2>

          <p>
            Bem-vindo ao seu ambiente acadêmico.
            Aqui você poderá acompanhar suas informações.
          </p>
        </div>

        <div className="student-welcome-icon">
          <GraduationCap size={58} />
        </div>
      </section>

      <section className="student-section">
        <div className="student-section-heading">
          <div>
            <h2>Meu perfil acadêmico</h2>
            <p>Confira suas informações cadastrais.</p>
          </div>
        </div>

        <div className="student-info-grid">

          <article className="student-info-card">
            <div className="student-info-icon">
              <UserRound size={21} />
            </div>

            <div>
              <span>Nome completo</span>
              <strong>
                {dadosUsuario?.name || "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <Mail size={21} />
            </div>

            <div>
              <span>E-mail</span>
              <strong>
                {dadosUsuario?.email || "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <Hash size={21} />
            </div>

            <div>
              <span>Matrícula</span>
              <strong>
                {aluno?.registrationNumber || "Não informada"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <BookOpen size={21} />
            </div>

            <div>
              <span>Curso</span>
              <strong>
                {aluno?.course || "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <span>Semestre</span>
              <strong>
                {aluno?.semester
                  ? `${aluno.semester}º semestre`
                  : "Não informado"}
              </strong>
            </div>
          </article>

          <article className="student-info-card">
            <div className="student-info-icon">
              <GraduationCap size={21} />
            </div>

            <div>
              <span>Perfil de acesso</span>
              <strong>Aluno</strong>
            </div>
          </article>

        </div>
      </section>

      <section className="student-section student-documents-section">
        <div className="student-section-heading">
          <div>
            <h2>Documentos acadêmicos</h2>
            <p>
              Emita documentos relacionados à sua vida acadêmica.
            </p>
          </div>
        </div>

        <article className="student-document-card">
          <div className="student-document-icon">
            <FileText size={28} />
          </div>

          <div className="student-document-info">
            <h3>Comprovante de matrícula</h3>

            <p>
              Documento com seus dados acadêmicos, período letivo
              e disciplinas com matrícula ativa.
            </p>
          </div>

          <button
            type="button"
            className="student-document-button"
            onClick={emitirComprovante}
            disabled={emitindoComprovante}
          >
            {emitindoComprovante ? (
              <>
                <span className="student-button-spinner" />
                Emitindo...
              </>
            ) : (
              <>
                <Download size={18} />
                Emitir comprovante
              </>
            )}
          </button>
        </article>

        {erroComprovante && (
          <div className="student-document-error">
            <AlertCircle size={18} />
            <span>{erroComprovante}</span>
          </div>
        )}
      </section>

      <footer className="student-footer">
        Syntesis — Sistema de Educação
      </footer>

    </main>
  );
}

export default StudentDashboard;
