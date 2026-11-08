import "./StudentEnrollmentProof.css";
import { useState } from "react";
import {
  FileCheck,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  ShieldCheck
} from "lucide-react";

import api from "../../services/api";

function StudentEnrollmentProof() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function emitirComprovante() {
    let novaAba = null;

    try {
      setCarregando(true);
      setErro("");

      // Abrir a aba durante o clique para evitar bloqueio do navegador.
      novaAba = window.open("", "_blank");

      const resposta = await api.get("/api/enrollment-proofs/my", {
        responseType: "blob"
      });

      const arquivo = new Blob([resposta.data], {
        type: "application/pdf"
      });

      const url = window.URL.createObjectURL(arquivo);

      if (novaAba) {
        novaAba.location.href = url;
      } else {
        // Alternativa caso o navegador bloqueie a nova aba.
        const link = document.createElement("a");
        link.href = url;
        link.download = "comprovante-de-matricula.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Liberar a URL temporária depois que o navegador tiver iniciado a abertura.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);

    } catch (error) {
      if (novaAba && !novaAba.closed) {
        novaAba.close();
      }

      let mensagem = "Não foi possível emitir seu comprovante.";

      if (error.response?.data instanceof Blob) {
        try {
          const texto = await error.response.data.text();
          const dados = JSON.parse(texto);

          mensagem = dados.mensagem || mensagem;
        } catch {
          // Mantém a mensagem padrão.
        }
      } else {
        mensagem = error.response?.data?.mensagem || mensagem;
      }

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="student-proof">
      <header className="student-proof-header">
        <div>
          <span className="student-proof-eyebrow">
            DOCUMENTAÇÃO ACADÊMICA
          </span>

          <h2>Comprovante de matrícula</h2>

          <p>
            Emita seu comprovante de matrícula atualizado em formato PDF.
          </p>
        </div>

        <div className="student-proof-header-icon">
          <FileCheck size={28} />
        </div>
      </header>

      <div className="student-proof-card">
        <div className="student-proof-icon">
          <FileText size={34} />
        </div>

        <h3>Comprovante de matrícula</h3>

        <p>
          Gere um documento oficial com suas informações acadêmicas,
          curso, período letivo e disciplinas em que possui matrícula ativa.
        </p>

        <div className="student-proof-information">
          <ShieldCheck size={19} />

          <span>
            Documento gerado diretamente pelo sistema acadêmico.
          </span>
        </div>

        {erro && (
          <div className="student-proof-error">
            <AlertCircle size={18} />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="button"
          className="student-proof-button"
          onClick={emitirComprovante}
          disabled={carregando}
        >
          {carregando ? (
            <>
              <RefreshCw size={18} className="student-proof-spin" />
              Emitindo comprovante...
            </>
          ) : (
            <>
              <Download size={18} />
              Emitir comprovante em PDF
            </>
          )}
        </button>
      </div>
    </section>
  );
}

export default StudentEnrollmentProof;
