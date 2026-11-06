import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Search,
  GraduationCap,
  UserRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Power,
  Pencil
} from "lucide-react";

import api from "../../services/api";

import "./Users.css";

function Users() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("TODOS");

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [salvando, setSalvando] = useState(false);

  const [formulario, setFormulario] = useState({
    name: "",
    email: "",
    password: "",
    registrationNumber: "",
    courseId: "",
    semester: 1
  });

  const [alunoEditando, setAlunoEditando] = useState(null);

  async function buscarUsuarios() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/api/admin/users");

      setUsuarios(resposta.data.usuarios || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os usuários."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function buscarCursos() {
    try {
      const resposta = await api.get("/api/courses");

      setCursos(resposta.data.cursos || []);
    } catch (error) {
      console.error("Erro ao buscar cursos:", error);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os cursos."
      );
    }
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [name]: name === "semester" ? Number(value) : value
    }));
  }

  function iniciarEdicao(usuario) {
    setAlunoEditando(usuario);

    setFormulario({
      name: usuario.name || "",
      email: usuario.email || "",
      password: "",
      registrationNumber: usuario.student?.registrationNumber || "",
      courseId: usuario.student?.courseId || "",
      semester: usuario.student?.semester || 1
    });

    setFormularioAberto(true);
    setErro("");
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    if (!alunoEditando?.student?.id) {
      setErro("Não foi possível identificar o aluno.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const dados = {
        name: formulario.name,
        email: formulario.email,
        registrationNumber: formulario.registrationNumber,
        semester: formulario.semester,
        ...(formulario.password && {
          password: formulario.password
        })
      };

      await api.put(
        `/api/admin/students/${alunoEditando.student.id}`,
        dados
      );

      setFormularioAberto(false);
      setAlunoEditando(null);

      setFormulario({
        name: "",
        email: "",
        password: "",
        registrationNumber: "",
        courseId: "",
        semester: 1
      });

      await buscarUsuarios();

      alert("Cadastro do aluno atualizado com sucesso!");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível atualizar o cadastro do aluno."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function cadastrarAluno(event) {
    event.preventDefault();
    
    try {
      setSalvando(true);
      setErro("");
    
      await api.post("/api/admin/students", formulario);
    
      setFormulario({
        name: "",
        email: "",
        password: "",
        registrationNumber: "",
        courseId: "",
        semester: 1
      });
    
      setFormularioAberto(false);
    
      await buscarUsuarios();
    
      alert("Aluno cadastrado com sucesso!");
    
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
    
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível cadastrar o aluno."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(usuario) {
    const novoStatus = !usuario.isActive;
  
    const acao = novoStatus ? "ativar" : "desativar";
  
    const confirmar = window.confirm(
      `Deseja realmente ${acao} a conta de ${usuario.name}?`
    );
  
    if (!confirmar) return;
  
    try {
      setErro("");
  
      await api.patch(`/api/admin/users/${usuario.id}/status`, {
        isActive: novoStatus
      });
  
      await buscarUsuarios();
  
    } catch (error) {
      console.error("Erro ao alterar status:", error);
  
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível alterar o status do usuário."
      );
    }
  }

  async function alterarSituacaoAcademica(usuario, novoStatus) {
    const nomes = {
      ATIVO: "Ativo",
      TRANCADO: "Trancado",
      CONCLUIDO: "Concluído"
    };

    const confirmado = window.confirm(
      `Deseja alterar a situação acadêmica de ${usuario.name} para ${nomes[novoStatus]}?`
    );

    if (!confirmado) return;

    try {
      setErro("");

      await api.patch(
        `/api/admin/students/${usuario.student.id}/status`,
        { status: novoStatus }
      );

      await buscarUsuarios();

      alert("Situação acadêmica atualizada com sucesso!");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível alterar a situação acadêmica."
      );
    }
  }

  useEffect(() => {
    buscarUsuarios();
    buscarCursos();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const correspondePesquisa =
      usuario.name.toLowerCase().includes(pesquisa.toLowerCase()) ||
      usuario.email.toLowerCase().includes(pesquisa.toLowerCase());

    const correspondePerfil =
      filtroPerfil === "TODOS" || usuario.role === filtroPerfil;

    return correspondePesquisa && correspondePerfil;
  });

  function obterPerfil(role) {
    const perfis = {
      ALUNO: "Aluno",
      PROFESSOR: "Professor",
      ADMIN: "Administrador"
    };

    return perfis[role] || role;
  }

  function obterIcone(role) {
    const icones = {
      ALUNO: GraduationCap,
      PROFESSOR: UserRound,
      ADMIN: ShieldCheck
    };

    return icones[role] || UsersIcon;
  }

  return (
    <div className="users-page">
      <div className="users-heading">
        <div>
          <h2>Gerenciamento de usuários</h2>
          <p>
            Consulte e gerencie as contas cadastradas no Syntesis.
          </p>
        </div>

        <div className="users-heading-actions">
          <button
            className="users-add-button"
            onClick={() => setFormularioAberto(!formularioAberto)}
          >
            {formularioAberto ? "Fechar cadastro" : "+ Cadastrar aluno"}
          </button>

          <button
            className="users-refresh-button"
            onClick={buscarUsuarios}
            disabled={carregando}
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>
      </div>

      {formularioAberto && (
       <form
          className="users-form"
          onSubmit={alunoEditando ? salvarEdicao : cadastrarAluno}
        >
          <div className="users-form-heading">
            <div>
              <h3>
                {alunoEditando ? "Editar cadastro do aluno" : "Cadastrar novo aluno"}
              </h3>

              <p>
                {alunoEditando
                  ? "Atualize os dados cadastrais do aluno."
                  : "Preencha os dados para criar uma conta acadêmica."}
              </p>
            </div>
          </div>
      
          <div className="users-form-grid">
            <div className="users-form-field">
              <label htmlFor="student-name">Nome completo</label>
              <input
                id="student-name"
                name="name"
                type="text"
                value={formulario.name}
                onChange={atualizarCampo}
                placeholder="Nome do aluno"
                required
              />
            </div>
      
            <div className="users-form-field">
              <label htmlFor="student-email">E-mail</label>
              <input
                id="student-email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={atualizarCampo}
                placeholder="aluno@exemplo.com"
                required
              />
            </div>
      
            <div className="users-form-field">
              <label htmlFor="student-password">
                {alunoEditando ? "Nova senha (opcional)" : "Senha inicial"}
              </label>
                            
              <input
                id="student-password"
                name="password"
                type="password"
                value={formulario.password}
                onChange={atualizarCampo}
                placeholder={
                  alunoEditando
                    ? "Deixe vazio para manter a senha atual"
                    : "Mínimo de 8 caracteres"
                }
                minLength={8}
                required={!alunoEditando}
              />
            </div>
      
            <div className="users-form-field">
              <label htmlFor="student-registration">Matrícula</label>
              <input
                id="student-registration"
                name="registrationNumber"
                type="text"
                value={formulario.registrationNumber}
                onChange={atualizarCampo}
                placeholder="Ex.: MAT-2026-001"
                required
              />
            </div>
      
            {!alunoEditando && (
              <div className="users-form-field">
                <label htmlFor="student-course">Curso</label>

                <select
                  id="student-course"
                  name="courseId"
                  value={formulario.courseId}
                  onChange={atualizarCampo}
                  required
                >
                  <option value="">Selecione um curso</option>

                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
              
            <div className="users-form-field">
              <label htmlFor="student-semester">Semestre atual</label>
              <input
                id="student-semester"
                name="semester"
                type="number"
                min="1"
                value={formulario.semester}
                onChange={atualizarCampo}
                required
              />
            </div>
          </div>
              
          <div className="users-form-actions">
            <button
              type="button"
              className="users-cancel-button"
              onClick={() => {
                setFormularioAberto(false);
                setAlunoEditando(null);
              }}
              disabled={salvando}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="users-submit-button"
              disabled={salvando || (!alunoEditando && cursos.length === 0)}
            >
              {salvando
                ? "Salvando..."
                : alunoEditando
                  ? "Salvar alterações"
                  : "Cadastrar aluno"}
            </button>
          </div>
        </form>
      )}

      <div className="users-summary">
        <div className="users-summary-icon">
          <UsersIcon size={25} />
        </div>

        <div>
          <span>Total de usuários</span>
          <strong>{carregando ? "..." : usuarios.length}</strong>
        </div>
      </div>

      <div className="users-toolbar">
        <div className="users-search">
          <Search size={19} />

          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
          />
        </div>

        <select
          value={filtroPerfil}
          onChange={(event) => setFiltroPerfil(event.target.value)}
        >
          <option value="TODOS">Todos os perfis</option>
          <option value="ALUNO">Alunos</option>
          <option value="PROFESSOR">Professores</option>
          <option value="ADMIN">Administradores</option>
        </select>
      </div>

      {erro && (
        <div className="users-error" role="alert">
          {erro}
          <button onClick={buscarUsuarios}>Tentar novamente</button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Informações adicionais</th>
              <th>Status da conta</th>
               <th>Situação acadêmica</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {carregando ? (
              <tr>
                <td colSpan="5" className="users-empty">
                  Carregando usuários...
                </td>
              </tr>
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="users-empty">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => {
                const Icone = obterIcone(usuario.role);

                return (
                  <tr key={usuario.id}>
                    <td>
                      <div className="users-user-cell">
                        <div className="users-avatar">
                          {usuario.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{usuario.name}</strong>
                          <span>{usuario.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`users-role ${usuario.role.toLowerCase()}`}>
                        <Icone size={15} />
                        {obterPerfil(usuario.role)}
                      </span>
                    </td>

                    <td>
                      {usuario.role === "ALUNO" ? (
                        <div className="users-additional">
                          <strong>
                            Matrícula: {usuario.student?.registrationNumber || "Não informada"}
                          </strong>
                          <span>
                            {usuario.student?.course || "Curso não informado"}
                          </span>
                        </div>
                      ) : usuario.role === "PROFESSOR" ? (
                        <div className="users-additional">
                          <strong>
                            Registro: {usuario.professor?.employeeNumber || "Não informado"}
                          </strong>
                          <span>
                            {usuario.professor?.department || "Departamento não informado"}
                          </span>
                        </div>
                      ) : (
                        <span className="users-no-info">Acesso administrativo</span>
                      )}
                    </td>

                    <td>
                      <span className={`users-status ${usuario.isActive ? "active" : "inactive"}`}>
                        {usuario.isActive ? (
                          <CheckCircle2 size={15} />
                        ) : (
                          <XCircle size={15} />
                        )}

                        {usuario.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                       {usuario.role === "ALUNO" ? (
                         <span
                           className={`users-academic-status ${
                             usuario.student?.status?.toLowerCase() || "ativo"
                           }`}
                         >
                           {usuario.student?.status === "TRANCADO"
                             ? "Trancado"
                             : usuario.student?.status === "CONCLUIDO"
                               ? "Concluído"
                               : "Ativo"}
                         </span>
                       ) : (
                         <span className="users-no-info">Não se aplica</span>
                       )}
                      </td>

                    <td>
                      <div className="users-row-actions">
                        {usuario.role === "ALUNO" && (
                          <button
                            className="users-action-button edit"
                            onClick={() => iniciarEdicao(usuario)}
                            title="Editar cadastro do aluno"
                          >
                            <Pencil size={15} />
                            Editar
                          </button>
                        )}

                        {/* NOVO TRECHO INSERIDO AQUI */}
                        {usuario.role === "ALUNO" && usuario.student?.status === "ATIVO" && (
                          <>
                            <button
                              className="users-action-button academic-lock"
                              onClick={() => alterarSituacaoAcademica(usuario, "TRANCADO")}
                              title="Trancar curso"
                            >
                              Trancar
                            </button>

                            <button
                              className="users-action-button academic-complete"
                              onClick={() => alterarSituacaoAcademica(usuario, "CONCLUIDO")}
                              title="Registrar conclusão do curso"
                            >
                              Concluir
                            </button>
                          </>
                        )}

                        {usuario.role === "ALUNO" && usuario.student?.status === "TRANCADO" && (
                          <button
                            className="users-action-button academic-reactivate"
                            onClick={() => alterarSituacaoAcademica(usuario, "ATIVO")}
                            title="Reativar matrícula"
                          >
                            Reativar
                          </button>
                        )}
                        {/* FIM DO NOVO TRECHO */}

                        <button
                          className={`users-action-button ${
                            usuario.isActive ? "deactivate" : "activate"
                          }`}
                          onClick={() => alterarStatus(usuario)}
                          title={usuario.isActive ? "Desativar usuário" : "Ativar usuário"}
                        >
                          <Power size={15} />
                          {usuario.isActive ? "Desativar" : "Ativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="users-footer">
        Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários.
      </div>
    </div>
  );
}

export default Users;