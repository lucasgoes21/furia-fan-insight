import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, "");
    return cpf.length === 11;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateCPF(cpf)) {
      setError("CPF inválido.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/fan/cpf/${cpf}`);
      const data = await response.json();

      if (response.ok && data) {
        localStorage.setItem("fan_nome", data.nome);
        localStorage.setItem("fan_cpf", data.cpf);
        alert(`Bem-vindo, ${data.nome}!`);
        await handleTwitterAuth();
        navigate("/FanInsight");
      } else {
        setError("Fã não encontrado. Cadastre-se primeiro.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao tentar logar.");
    }
  };

  const handleTwitterAuth = () => {
    if (!validateCPF(cpf)) {
      alert("CPF inválido.");
      return;
    }
    if (!cpf) {
      alert("CPF não encontrado. Faça login novamente.");
      return;
    }

    window.location.href = `http://localhost:8000/authorize_X?state=${cpf}`;
  };

  return (
    <div className="min-h-screen bg-cover flex flex-col items-center justify-start p-6 bg-[url('../assets/bg.png')]">
      {/* Header com logo no estilo da tela de cadastro */}
      <div id="header" className="w-full flex justify-center mb-8">
        <table className="table-fixed w-full">
          <tbody>
            <tr>
              <td className="w-1/3 text-left">
                <div
                  id="logo"
                  className="w-[64px] h-[53px] bg-contain bg-center bg-no-repeat"
                ></div>
              </td>
              <td className="w-1/3 text-center bg-contain bg-center bg-no-repeat bg-[url('../assets/LogoString.png')]"></td>
              <td className="w-1/3"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Caixa de login */}
      <div className="w-full max-w-md bg-[#3D3D3E]/40 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white mb-6">
          Login FURIA Fan Insight
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="cpf" className="block text-white mb-1">
              Digite seu CPF:
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="00000000000"
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-[#1F1F20] hover:bg-[#2C2C2D] text-white p-2 rounded transition"
          >
            Entrar
          </button>
        </form>

        {/* Botão para ir para a tela de cadastro */}
        <div className="text-center mt-4">
          <p className="text-white text-sm mt-4 text-center">
            Ainda não tem cadastro?{" "}
            <span
              onClick={() => navigate("/cadastro")}
              className="text-purple-400 hover:underline cursor-pointer"
            >
              Cadastre-se aqui
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
