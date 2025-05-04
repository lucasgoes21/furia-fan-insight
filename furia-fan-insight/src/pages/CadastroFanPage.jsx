import { useState } from "react";
import { useNavigate } from "react-router-dom";


function CadastroFanPage() {
  const navigate = useNavigate();
  // Inicializa o estado do formulário com valores padrão.
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    jogos_favoritos: [],
    teams_favoritos: "",
    eventos_participados: "",
    link_perfil: "",
    file: null,
  });

  const [cpfError, setCpfError] = useState(""); // Estado para armazenar erros de CPF

  // Atualiza o estado formData com os valores inseridos nos campos de texto, data ou textarea.
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Use "name" aqui
    setFormData({ ...formData, [name]: value });
    // Valida o CPF ao alterar o campo
    if (name === "cpf") {
      validateCPF(value);
    }
  };

  // Função para validar o CPF
  const validateCPF = (cpf) => {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      setCpfError("CPF inválido");
      return false;
    }

    let sum = 0;
    let remainder;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) {
      setCpfError("CPF inválido");
      return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) {
      setCpfError("CPF inválido");
      return false;
    }

    setCpfError(""); // CPF válido
    return true;
  };

  // Gerencia a seleção de checkboxes para o campo sports.
  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      jogos_favoritos: checked
        ? [...prev.jogos_favoritos, value]
        : prev.jogos_favoritos.filter((jogo) => jogo !== value),
    }));
  };

  // Lida com o envio do formulário.
  const handleSubmit = async (e) => {
  e.preventDefault();

  const formDataToSend = new FormData();

  if (cpfError) {
    alert("Corrija o CPF antes de enviar.");
    return;
  }
  
  for (const key in formData) {
    if (key === "jogos_favoritos") {
      formDataToSend.append(key, formData[key].join(","));
    } else {
      formDataToSend.append(key, formData[key]);
    }
  }

  try {
    const validateFormData = new FormData();
    validateFormData.append("cpf", formData.cpf);
    validateFormData.append("file", formData.file);

    const validateRes = await fetch("http://localhost:8000/fan/validate-image", {
      method: "POST",
      body: validateFormData,
    });

    if (!validateRes.ok) {
      const err = await validateRes.json();
      alert(`Erro: ${err.detail}`);
      return;
    }

    const response = await fetch("http://localhost:8000/fan", {
      method: "POST",
      body: formDataToSend,
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("fan_nome", formData.nome);
      localStorage.setItem("fan_cpf", formData.cpf);
      alert("Dados enviados com sucesso!");
      navigate("/"); // Redireciona para a página de insights do fã

    } else {
      alert(`Erro: ${data.detail}`);
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao enviar os dados.");
  }
};
  
  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleLogin = () => {
    localStorage.clear(); // Limpa tudo
    navigate("/"); // Redireciona pro login
  };

  return (
    <div className="App min-h-screen flex flex-col items-center justify-start bg-cover gap-3 p-5 px-5 bg-[url('../assets/bg.png')]">
      <div id="header" className="w-full flex justify-center ">
        <table className="table-fixed w-full">
          <tbody>
            <tr>
              <td className="w-1/3 text-left">
                <div id="logo" className="w-[64px] h-[53px]"></div>
              </td>
              <td className="w-1/3 text-center align-middle bg-contain bg-center bg-no-repeat bg-[url('../assets/LogoString.png')]"></td>
              <td className="w-1/3 h-full">
                <div className="w-full h-full flex justify-end">
                  <button
                    onClick={handleLogin}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1 rounded transition"
                  >
                    Login
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        id="chat"
        className="h-9/10 flex flex-col gap-2 p-[36px] bg-[#3D3D3E]/40 rounded-[24px]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nome" className="block mb-1 text-white">
              Nome:
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Lucas Mateus..."
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="data_nascimento" className="block mb-1 text-white">
              Data de Nascimento:
            </label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleInputChange}
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
              required
            />
          </div>

          <div>
            <label htmlFor="cpf" className="block mb-1 text-white">
              CPF:
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
              pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-white">
              Jogos e esports favoritos:
            </label>
            <div className="flex gap-2 flex-wrap">
              {["CS", "LoL", "Valorant", "Dota 2", "Overwatch", "Fortnite"].map(
                (sport) => (
                  <label
                    key={sport}
                    className="flex items-center gap-1 text-white"
                  >
                    <input
                      type="checkbox"
                      value={sport}
                      onChange={handleCheckboxChange}
                      className="accent-[#2C2C2D]"
                    />
                    {sport}
                  </label>
                )
              )}
            </div>
          </div>

          <div>
            <label htmlFor="teams_favoritos" className="block mb-1 text-white">
              Times que acompanha (Ex: FURIA, MIBR...):
            </label>
            <input
              type="text"
              id="teams_favoritos"
              name="teams_favoritos"
              value={formData.teams_favoritos}
              onChange={handleInputChange}
              placeholder="Ex: FURIA, MIBR..."
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
            />
          </div>

          <div>
            <label
              htmlFor="eventos_participados"
              className="block mb-1 text-white"
            >
              Eventos presenciais que já participou:
            </label>
            <textarea
              id="eventos_participados"
              name="eventos_participados" // Altere para "eventos_participados"
              value={formData.eventos_participados}
              onChange={handleInputChange}
              placeholder="Ex: Major, CBLOL..."
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
            ></textarea>
          </div>

          <div>
            <label htmlFor="link_perfil" className="block mb-1 text-white">
              Links do perfil:
            </label>
            <input
              type="text"
              id="link_perfil"
              name="link_perfil" // Altere para "link_perfil"
              value={formData.link_perfil}
              onChange={handleInputChange}
              placeholder="Ex: https://twitter.com/usuario, https://twitch.tv/usuario"
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
            />
          </div>
          <div>
            <label htmlFor="file" className="block mb-1 text-white">
              Imagem do RG:
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 rounded bg-[#2C2C2D] text-white"
              required
            />
          </div>
          <button
            type="submit"
            className="p-2 bg-[#1F1F20] rounded text-white hover:bg-[#2C2C2D]"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CadastroFanPage;
