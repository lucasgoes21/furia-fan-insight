import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from 'react-markdown';


function FanInsightPage() {
  const [fanName, setFanName] = useState("");
  const [activeTab, setActiveTab] = useState("ia"); // 'perfil' ou 'ia'
  const navigate = useNavigate();

  const [fan, setFan] = useState(null);
  const cpf = localStorage.getItem("fan_cpf"); // ou de onde você estiver guardando
  

  const [newLink, setNewLink] = useState("");
  const [LinkVer, setLinkVer] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newGame, setNewGame] = useState("");
  const [perfilIA, setPerfilIA] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  


  useEffect(() => {
    const fetchPerfil = async () => {
      if (!cpf) return;

      setIsLoading(true); // inicia o loading

      try {
        const response = await fetch(`http://localhost:8000/ia/perfil/${cpf}`);
        const data = await response.json();
        setPerfilIA(data.perfil);
      } catch (error) {
        console.error("Erro ao gerar perfil IA:", error);
        setPerfilIA("Erro ao gerar perfil com a IA.");
      }

      setIsLoading(false); // finaliza o loading
    };

    fetchPerfil();
  }, [cpf]);

  useEffect(() => {
    const storedName = localStorage.getItem("fan_nome");
    if (!storedName) navigate("/");
    else setFanName(storedName);
  }, []);

  useEffect(() => {
    const fetchFan = async () => {
      try {
        const response = await fetch(`http://localhost:8000/fan/cpf/${cpf}`);
        const data = await response.json();
        setFan(data);
      } catch (err) {
        console.error("Erro ao buscar fã:", err);
      }
    };

    if (cpf) fetchFan();
  }, [cpf]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleTwitterAuth = () => {
    if (!cpf) {
      alert("CPF não encontrado. Faça login novamente.");
      return;
    }
  
    window.location.href = `http://localhost:8000/authorize_X?state=${cpf}`;
  };

  const updateFanField = async (field, values) => {
    try {
      const response = await fetch(`http://localhost:8000/fan/cpf/${cpf}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: values.join(",") }),
      });
  
      if (response.ok) {
        setFan((prev) => ({ ...prev, [field]: values.join(",") }));
      } else {
        console.error("Erro ao atualizar", field);
      }
    } catch (err) {
      console.error("Erro:", err);
    }
  };
  const handleAddItem = (field, current, setter, value) => {
    if (!value.trim()) return; // Verifica se o valor é válido
  
    // Garante que current seja um array
    const items = Array.isArray(current)
      ? current
      : current
      ? current.split(",")
      : [];
  
    // Adiciona o novo valor ao array
    const newList = [...items, value.trim()];
  
    // Atualiza o campo no backend e no estado local
    updateFanField(field, newList);
  
    // Limpa o campo de entrada
    setter("");
  };

  const handleRemoveItem = (field, current, index) => {
    // Garante que current seja um array
    const items = Array.isArray(current)
      ? current
      : current
      ? current.split(",")
      : [];
  
    // Remove o item pelo índice
    items.splice(index, 1);
  
    // Atualiza o campo no backend e no estado local
    updateFanField(field, items);
  };

  const handleverificarLink = async () => {
    setLoading(true);
    setResultado("");
  
    try {
      const response = await fetch("http://localhost:8000/verificar-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cpf: cpf, // Substitua pelo CPF real ou dinâmico
          link: LinkVer,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Erro na resposta da API");
      }
  
      const data = await response.json();

      console.log(data);
      setResultado(data.resultado);
      
    } catch (error) {
      console.error("Erro:", error);
      setResultado("Erro ao analisar o link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-[url('../assets/bg.png')] p-6">
      <div id="header" className="w-full flex justify-start mb-4">
        <table className="table-fixed w-full">
          <tbody>
            <tr>
              <td className="w-1/3 text-left">
                <div
                  id="logo"
                  className="w-[64px] h-[53px] bg-contain bg-center bg-no-repeat bg-[url('../assets/Logo.png')]"
                ></div>
              </td>
              <td className="w-1/3 text-center align-middle bg-contain bg-center bg-no-repeat bg-[url('../assets/LogoString.png')]"></td>
              <td className="w-1/3 h-full ">
                {fanName && (
                  <div className="flex h-full w-full text-white text-sm justify-end items-center gap-4">
                    <span>
                      Olá, <strong>{fanName}</strong>
                    </span>
                    <button
                      onClick={handleLogout}
                      className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1 rounded transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex h-[calc(100vh-118px)] p-4 gap-4">
        {/* Sidebar */}
        <div className="w-1/5 h-full bg-[#2C2C2D]/60 rounded-xl p-4 flex flex-col gap-4">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`text-white text-left px-4 py-2 rounded hover:bg-[#3D3D3E] transition ${
              activeTab === "perfil" ? "bg-[#3D3D3E]" : ""
            }`}
          >
            Perfil do Fã
          </button>
          <button
            onClick={() => setActiveTab("ia")}
            className={`text-white text-left px-4 py-2 rounded hover:bg-[#3D3D3E] transition ${
              activeTab === "ia" ? "bg-[#3D3D3E]" : ""
            }`}
          >
            Análise com IA
          </button>
        </div>

        <div className="text-white flex-1 bg-[#3D3D3E]/40 rounded-xl p-6 overflow-auto">
          {activeTab === "perfil" && (
            <div>
              {fan ? (
                <div className="space-y-6 text-white">
                  <h2 className="text-2xl font-bold border-b border-gray-500 pb-2">
                    Perfil do Fã
                  </h2>
                  {isLoading ? (
                    <div className="bg-[#3D3D3E] rounded-xl p-4 text-center">
                      <p className="animate-pulse">
                        🧠 Gerando perfil com IA... Por favor, aguarde.
                      </p>
                    </div>
                  ) : perfilIA ? (
                    <div className="bg-[#3D3D3E] rounded-xl p-4 whitespace-pre-line">
                      <h2 className="text-xl font-bold mb-2">
                        Perfil Personalizado:
                      </h2>
                      <ReactMarkdown>{perfilIA}</ReactMarkdown>
                    </div>
                  ) : null}
                  <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-3">
                    <p>
                      <strong>Nome:</strong> {fan.nome}
                    </p>
                    <p>
                      <strong>Idade:</strong>{" "}
                      {fan.data_nascimento
                        ? `${
                            new Date().getFullYear() -
                            new Date(fan.data_nascimento).getFullYear()
                          } anos`
                        : "Não informado"}
                    </p>
                    <p>
                      <strong>CPF:</strong> {fan.cpf}
                    </p>
                  </div>

                  <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-3">
                    <strong className="block text-lg">Jogos Favoritos:</strong>
                    <ul className="list-disc ml-5 list-inside">
                      {fan.jogos_favoritos && fan.jogos_favoritos.length > 0 ? (
                        (Array.isArray(fan.jogos_favoritos)
                          ? fan.jogos_favoritos
                          : fan.jogos_favoritos.split(",")
                        ).map((jogo, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{jogo.trim()}</span>
                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  "jogos_favoritos",
                                  Array.isArray(fan.jogos_favoritos)
                                    ? fan.jogos_favoritos
                                    : fan.jogos_favoritos.split(","),
                                  index
                                )
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remover
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>Nenhum jogo favorito cadastrado</li>
                      )}
                    </ul>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Novo jogo"
                        value={newGame}
                        onChange={(e) => setNewGame(e.target.value)}
                        className="flex flex-1 p-2 rounded bg-[#2C2C2D] text-white h-9"
                      />
                      <button
                        onClick={() =>
                          handleAddItem(
                            "jogos_favoritos",
                            Array.isArray(fan.jogos_favoritos)
                              ? fan.jogos_favoritos
                              : fan.jogos_favoritos
                              ? fan.jogos_favoritos.split(",")
                              : [],
                            setNewGame,
                            newGame
                          )
                        }
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded h-9 flex items-center"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-3">
                    <strong className="block text-lg">
                      Times que acompanha:
                    </strong>
                    <ul className="list-disc ml-5">
                      {fan.teams_favoritos ? (
                        fan.teams_favoritos.split(",").map((time, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-2"
                          >
                            <span>{time.trim()}</span>
                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  "teams_favoritos",
                                  fan.teams_favoritos,
                                  index
                                )
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remover
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>Nenhum time cadastrado</li>
                      )}
                    </ul>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Novo time"
                        value={newTeam}
                        onChange={(e) => setNewTeam(e.target.value)}
                        className="flex flex-1 p-2 rounded bg-[#2C2C2D] text-white h-9"
                      />
                      <button
                        onClick={() =>
                          handleAddItem(
                            "teams_favoritos",
                            fan.teams_favoritos,
                            setNewTeam,
                            newTeam
                          )
                        }
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded h-9 flex items-center"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-3">
                    <strong className="block text-lg">
                      Eventos presenciais que já participou:
                    </strong>
                    <ul className="list-disc ml-5">
                      {fan.eventos_participados ? (
                        fan.eventos_participados
                          .split(",")
                          .map((evento, index) => (
                            <li
                              key={index}
                              className="flex items-center justify-between gap-2"
                            >
                              <span>{evento.trim()}</span>
                              <button
                                onClick={() =>
                                  handleRemoveItem(
                                    "eventos_participados",
                                    fan.eventos_participados,
                                    index
                                  )
                                }
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Remover
                              </button>
                            </li>
                          ))
                      ) : (
                        <li>Nenhum evento cadastrado</li>
                      )}
                    </ul>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Novo evento"
                        value={newEvent}
                        onChange={(e) => setNewEvent(e.target.value)}
                        className="flex flex-1 p-2 rounded bg-[#2C2C2D] text-white h-9"
                      />
                      <button
                        onClick={() =>
                          handleAddItem(
                            "eventos_participados",
                            fan.eventos_participados,
                            setNewEvent,
                            newEvent
                          )
                        }
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded h-9 flex items-center"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-3">
                    <strong className="block text-lg">
                      Links das Redes Sociais:
                    </strong>

                    <ul className="space-y-1 ml-5">
                      {fan.link_perfil ? (
                        fan.link_perfil.split(",").map((link, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-2"
                          >
                            <a
                              href={link.trim()}
                              className="text-blue-400 hover:underline break-all"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.trim()}
                            </a>
                            <button
                              onClick={() =>
                                handleRemoveItem(
                                  "link_perfil",
                                  fan.link_perfil,
                                  index
                                )
                              }
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remover
                            </button>
                          </li>
                        ))
                      ) : (
                        <li>Nenhuma rede social cadastrada</li>
                      )}
                    </ul>

                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="text"
                        placeholder="Novo link"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        className="flex flex-1 p-2 rounded bg-[#2C2C2D] text-white h-9"
                      />
                      <button
                        onClick={() =>
                          handleAddItem(
                            "link_perfil",
                            fan.link_perfil,
                            setNewLink,
                            newLink
                          )
                        }
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded h-9 flex items-center"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">Carregando perfil...</p>
              )}
            </div>
          )}

          {activeTab === "ia" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-gray-500 pb-2">
                Análise com IA
              </h2>

              <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-4">
                <p>Cole abaixo o link para iniciar a análise.</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ex: https://twitter.com/..."
                    value={LinkVer}
                    onChange={(e) => setLinkVer(e.target.value)}
                    className="flex flex-1 p-2 rounded bg-[#2C2C2D] text-white h-10"
                  />
                  <button
                    onClick={handleverificarLink}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded h-10 flex items-center"
                  >
                    {loading ? "Analisando..." : "Avaliar"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 bg-[#3D3D3E] rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xl font-semibold mb-2">Resultado:</h3>
                {loading ? (
                  <p className="text-gray-300 italic">
                    Avaliando perfil com IA...
                  </p>
                ) : (
                  <ReactMarkdown>{resultado}</ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FanInsightPage;
