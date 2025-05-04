from sqlalchemy.ext.asyncio import AsyncSession
import google.generativeai as genai
from db import get_session
import requests
import json
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi import FastAPI, UploadFile, File,Form, HTTPException, Depends, Request
from pydantic import BaseModel
from db import engine
from model import Base
from crud import save_fan, get_all_fans, get_fan_by_cpf, salvar_dados_twitter, salvar_dados_twitch, get_data_by_id
import os
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import base64
from collections import defaultdict

app = FastAPI()

global_cpf = ""

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todas as origens (substitua por domínios específicos para maior segurança)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos os cabeçalhos
)

#---------------------AI CONFIGURATION---------------------#

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
# Configure sua API Key
genai.configure(api_key=api_key)

# Inicializar o modelo Gemini Pro
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")
chat = model.start_chat(history=[])


#---------------------BD INIT---------------------#

class FanRequest(BaseModel):
    nome: str
    cpf: str
    data_nascimento: str
    jogos_favoritos: List[str]
    teams_favoritos: str
    eventos_participados: str
    link_perfil: str

def load_image_base64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

#---------------------ROUTES---------------------#

@app.put("/fan/cpf/{cpf}")
async def update_fan(cpf: str, update_data: dict, db: AsyncSession = Depends(get_session)):
    fan = await get_fan_by_cpf(db, cpf)
    if not fan:
        raise HTTPException(status_code=404, detail="Fã não encontrado")

    for key, value in update_data.items():
        setattr(fan, key, value)

    await db.commit()
    return {"message": "Atualizado com sucesso"}
@app.get("/fan/cpf/{cpf}")
async def buscar_fan_por_cpf(cpf: str, db: AsyncSession = Depends(get_session)):
    fan = await get_fan_by_cpf(db, cpf)
    
    if fan:
        fan_data = fan.__dict__.copy()
        fan_data.pop("_sa_instance_state", None)
        fan_data["jogos_favoritos"] = fan_data["jogos_favoritos"].split(",") if fan_data["jogos_favoritos"] else []
        return fan_data

    raise HTTPException(status_code=404, detail="Fã não encontrado.")
@app.post("/fan/validate-image")
async def validar_imagem(cpf: str = Form(...), file: UploadFile = File(...)):
    if not file.filename.endswith((".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Formato inválido.")

    contents = await file.read()

    with open("temp_rg.png", "wb") as f:
        f.write(contents)

    image_path = "temp_rg.png"
    image_base64 = load_image_base64(image_path)


    response = model.generate_content([
    {
        "mime_type": "image/jpeg",
        "data": image_base64
    },
    {
        "text": "Extraia o número do CPF desta imagem, apenas o número, sem texto adicional."
    }
    ])

    text = response.text
    print(response.text)
    

    os.remove("temp_rg.png")

    digits_in_image = "".join(filter(str.isdigit, text))
    cpf_in_image = next((digits_in_image[i:i+11] for i in range(len(digits_in_image)-10) if digits_in_image[i:i+11].isdigit()), "")

    

    if cpf.replace(".", "").replace("-", "") not in cpf_in_image:
        raise HTTPException(status_code=422, detail="CPF da imagem não confere com o digitado.")

    return {"msg": "Imagem validada com sucesso!"}


@app.post("/fan")
async def cadastrar_fan(
    nome: str = Form(...),
    cpf: str = Form(...),
    data_nascimento: str = Form(...),
    jogos_favoritos: str = Form(...),
    teams_favoritos: str = Form(...),
    eventos_participados: str = Form(...),
    link_perfil: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_session),  # injeta o banco
):
    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)
    file_location = os.path.join(upload_folder, file.filename)

    with open(file_location, "wb") as f:
        f.write(await file.read())

    fan_data = {
        "nome": nome,
        "cpf": cpf,
        "data_nascimento": data_nascimento,
        "jogos_favoritos": jogos_favoritos,  # já está como string
        "teams_favoritos": teams_favoritos,
        "eventos_participados": eventos_participados,
        "link_perfil": link_perfil,
        "file": file.filename,
    }

    existing_fan = await get_fan_by_cpf(db, cpf)
    if existing_fan:
        raise HTTPException(status_code=409, detail="CPF já cadastrado.")

    await save_fan(db, fan_data)

    return {"msg": "Fã cadastrado com sucesso!", "file_location": file_location}

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/")
async def root():
    return {"message": "API da FURIA rodando!"}


#----------------------API X---------------------#

CLIENT_ID_X = os.getenv("CLIENT_ID_X")
CLIENT_SECRET_X = os.getenv("CLIENT_SECRET_X")
REDIRECT_URI_X = os.getenv("REDIRECT_URI_X")
SCOPES = "tweet.read users.read like.read follows.read offline.access"

@app.get("/authorize_X")
def authorize_twitter(state: str):
    global global_cpf
    global_cpf = state

    url = (
        f"https://twitter.com/i/oauth2/authorize"
        f"?response_type=code"
        f"&client_id={CLIENT_ID_X}"
        f"&redirect_uri={REDIRECT_URI_X}"
        f"&scope=tweet.read%20users.read%20like.read%20follows.read%20offline.access"
        f"&state=state"
        f"&code_challenge=challenge"
        f"&code_challenge_method=plain"
    )
    return RedirectResponse(url)

@app.get("/callback/X")
async def twitter_callback(code: str , db: AsyncSession = Depends(get_session)):
    global global_cpf
    print(global_cpf)
    
    
    token_url = "https://api.twitter.com/2/oauth2/token"
    data = {
        "code": code,
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID_X,
        "redirect_uri": REDIRECT_URI_X,
        "code_verifier": "challenge",
    }
    
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = requests.post(token_url, data=data, headers=headers, auth=(CLIENT_ID_X, CLIENT_SECRET_X))

    if resp.status_code != 200:
        return HTMLResponse(f"Erro ao obter token: {resp.text}", status_code=400)

    
    tokens = resp.json()
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # 🔹 1. Dados do usuário
    user_info = requests.get("https://api.twitter.com/2/users/me", headers=headers).json()
    print("Resposta do Twitter:", user_info)
    if "data" not in user_info:
        
        return RedirectResponse("http://localhost:8000/authorize")

    user_id = user_info["data"]["id"]
    username = user_info["data"]["username"]

    # 🔹 2. Seguidores (até 50)
    following_resp = requests.get(
        f"https://api.twitter.com/2/users/{user_id}/following?max_results=50", headers=headers
    )
    following = [user["username"] for user in following_resp.json().get("data", [])]

    # 🔹 3. Tweets curtidos (até 50)
    likes_resp = requests.get(
        f"https://api.twitter.com/2/users/{user_id}/liked_tweets?max_results=50", headers=headers
    )
    liked_texts = [tweet["text"] for tweet in likes_resp.json().get("data", [])]

    X_data = {
        "username": username,
        "following": json.dumps(following),
        "liked": json.dumps(liked_texts),
    }

    fan = await get_fan_by_cpf(db,global_cpf)

    await salvar_dados_twitter(db,fan,X_data)

    
    return RedirectResponse("http://localhost:8000/authorize")

    

#----------------------twitch API---------------------#
# Você precisa configurar essas variáveis de ambiente
CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
ACCESS_TOKEN = os.getenv("TWITCH_ACCESS_TOKEN")
CLIENT_SECRET = os.getenv("SEU_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPES = "user:read:follows"

@app.get("/authorize")
def authorize():
    url = (
        f"https://id.twitch.tv/oauth2/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={SCOPES}"
    )
    return RedirectResponse(url)
@app.get("/callback")
async def callback(request: Request, code: str,db: AsyncSession = Depends(get_session)):
    token_url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }
    twitch_code = code
    token_resp = requests.post(token_url, params=params)
    token_data = token_resp.json()
    access_token = token_data.get("access_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Erro ao obter token")

    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {access_token}"
    }

    # Obter usuário
    user_resp = requests.get("https://api.twitch.tv/helix/users", headers=headers)
    user_data = user_resp.json()["data"][0]
    user_id = user_data["id"]
    username = user_data["login"]

    # Canais seguidos
    following_resp = requests.get(
        f"https://api.twitch.tv/helix/channels/followed?user_id={user_id}",
        headers=headers
    )
    following_data = following_resp.json().get("data", [])

    game_counter = defaultdict(int)
    for followed in following_data:
        broadcaster_id = followed["broadcaster_id"]
        clips_resp = requests.get(
            f"https://api.twitch.tv/helix/clips?broadcaster_id={broadcaster_id}&first=5",
            headers=headers
        )
        for clip in clips_resp.json().get("data", []):
            game_id = clip.get("game_id")
            game_name = get_game_name(game_id, headers)
            if game_name:
                game_counter[game_name] += 1

    top_games = sorted(game_counter.items(), key=lambda x: x[1], reverse=True)

    twitch_data = {
        "username": username,
        "top_games": top_games
    }

    fan = await get_fan_by_cpf(db,global_cpf)
    await salvar_dados_twitch(db,fan,twitch_data)

    return RedirectResponse("http://localhost:5173/FanInsight")



headers = {
    "Client-ID": CLIENT_ID,
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

def get_user_id(username):
    url = "https://api.twitch.tv/helix/users"
    resp = requests.get(url, headers=headers, params={"login": username})
    data = resp.json()
    return data["data"][0]["id"]

def get_following(user_id, limit=50):
    url = "https://api.twitch.tv/helix/channels/followed"
    params = {"user_id": user_id, "first": limit}
    
    try:
        resp = requests.get(url, headers=headers, params=params)
        resp.raise_for_status()  # Lança HTTPError para status >= 400
        data = resp.json().get("data", [])
        return [follow["broadcaster_id"] for follow in data]
    
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err} - Status code: {resp.status_code}")
        try:
            print("Response content:", resp.json())
        except Exception:
            print("Failed to parse JSON response.")
    
    except Exception as err:
        print(f"Other error occurred: {err}")
    
    return []

def get_top_clips(user_id, limit=10):
    url = "https://api.twitch.tv/helix/clips"
    params = {
        "broadcaster_id": user_id,
        "first": limit
    }
    resp = requests.get(url, headers=headers, params=params)
    return resp.json().get("data", [])

def get_game_name(game_id, headers):
    if not game_id:
        return None
    url = "https://api.twitch.tv/helix/games"
    params = {"id": game_id}
    resp = requests.get(url, headers=headers, params=params)
    data = resp.json().get("data", [])
    return data[0]["name"] if data else None

def analisar_jogos_dos_seguidos(username):
    user_id = get_user_id(username)
    print(f"ID do usuário: {user_id}")
    following_ids = get_following(user_id, limit=50)
    print(f"IDs dos canais seguidos: {following_ids}")

    game_counter = defaultdict(int)

    print(f"\n🔍 Analisando clipes dos canais seguidos por {username}...\n")

    for followed_id in following_ids:
        clips = get_top_clips(followed_id, limit=10)
        for clip in clips:
            game_id = clip.get("game_id")
            print(f"ID do jogo: {game_id}")
            game_name = get_game_name(game_id)
            if game_name:
                game_counter[game_name] += 1

    print("📊 Jogos mais recorrentes nos clipes:")
    for game, count in sorted(game_counter.items(), key=lambda x: x[1], reverse=True):
        print(f"• {game}: {count}")

#--------------------------- IA Inshtight ---------------------------
async def gerar_perfil_ia(cpf: str, db: AsyncSession = Depends(get_session)):
    fan = await get_fan_by_cpf(db,cpf)

    if not fan:
        raise HTTPException(status_code=404, detail="Fã não encontrado")
    
    

    data = await get_data_by_id(db,fan.id)




    # Montar prompt com os dados disponíveis
    prompt = f"""
    Informações do fã:
    - Nome: {fan.nome}
    - Data de nascimento: {fan.data_nascimento}
    - Jogos favoritos: {fan.jogos_favoritos}
    - Times favoritos: {fan.teams_favoritos}
    - Eventos presenciais: {fan.eventos_participados}

    Dados do Twitter:
    {data.twitter_data if data.twitter_data else "Sem dados disponíveis"}

    Dados da Twitch:
    {data.twitch_data if data.twitch_data else "Sem dados disponíveis"}

    Com base nessas informações, escreva um perfil detalhado e personalizado sobre esse fã, destacando suas preferências, estilo de torcedor [escreva como se estivesse falando com o fã][essa menssagem sera mostrada em uuma tela perfil].
    """

    response = model.generate_content([
    {
        "text": prompt
    }
    ])

    perfil_gerado = response.text
    return {"perfil": perfil_gerado}


@app.get("/ia/perfil/{cpf}")
async def gerar_perfil(cpf: str, db: AsyncSession = Depends(get_session)):
    
    return await gerar_perfil_ia(cpf, db)

class VerificarLinkRequest(BaseModel):
    cpf: str
    link: str

@app.post("/verificar-link")
async def verificar_link_compatibilidade(data: VerificarLinkRequest, db: AsyncSession = Depends(get_session)):
    print(data.cpf, data.link)
    
    try:
        # 1. Gera o perfil do fã
        perfil = await gerar_perfil_ia(data.cpf, db)

        if not perfil:
            raise HTTPException(status_code=404, detail="Perfil IA não encontrado")

        # 2. Compara perfil com o link usando IA
        prompt = f"""
                    
                    Informações do fã:
                    - Perfil IA: {perfil}

                    Informações do link:
                    - Link: {data.link}

                    Com base nessas informações, avalie se o link se encaixa no perfil do fã, retorne o quao compativel o link com o perfil	tambem [escreva como se estivesse falando com o fã][essa menssagem sera mostrada em uma tela perfil].
                    """

        response = model.generate_content([
        {
            "text": prompt
        }
        ])

        print(response.text)
        resultado = response.text
        return {"resultado": resultado}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
