# Furia Fan Insight

**Furia Fan Insight** é uma plataforma que utiliza inteligência artificial para analisar o comportamento de fãs da FURIA Esports. O sistema permite que os usuários insiram links de perfis sociais (como Twitter) e, com base em um perfil gerado previamente, avalia a compatibilidade do conteúdo com o perfil do fã.

## 🔍 Funcionalidades

- **Análise com IA**: Avalia links fornecidos pelos usuários e verifica a compatibilidade com o perfil do fã.
- **Geração de Perfil**: Cria um perfil personalizado para cada fã com base em dados fornecidos.
- **Interface Intuitiva**: Interface amigável que facilita a interação do usuário com o sistema.

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - React.js
  - Vite
  - Tailwind CSS
  - React Markdown

- **Backend**:
  - FastAPI
  - SQLAlchemy
  - SQLite
  - Integração com modelo de IA (especificar qual modelo, se possível)

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js e npm instalados
- Python 3.8 ou superior
- Ambiente virtual (opcional, mas recomendado)

### Backend

1. Navegue até a pasta `api`:

   ```bash
   cd api
   ```

2. Crie e ative um ambiente virtual:

   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

3. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

4. Execute o servidor:

   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Navegue até a pasta `furia-fan-insight`:

   ```bash
   cd furia-fan-insight
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

O frontend estará disponível em `http://localhost:5173` e o backend em `http://localhost:8000`.

## 📁 Estrutura do Projeto

```
furia-fan-insight/
├── api/
│   ├── main.py
│   ├── model.py
│   ├── crud.py
│   ├── db.py
│   ├── requirements.txt
│   └── uploads/
├── furia-fan-insight/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── pages/
│   ├── public/
│   ├── index.html
│   └── package.json
└── README.md
```
## 🔧 Arquivo ./api/.env
```bash
  voce vai precisar configurar as APIs (twitter, twitch)

  GEMINI_API_KEY=""
  TWITTER_BEARER=""
  TWITCH_CLIENT_ID=""
  TWITCH_ACCESS_TOKEN=""
  SEU_CLIENT_SECRET=""
  REDIRECT_URI=

  CLIENT_ID_X=""
  CLIENT_SECRET_X=""
  REDIRECT_URI_X=
```
## 🌐 Acesso ao Projeto

Você pode acessar a aplicação hospedada neste link:
🔗 [https://furia-fan-insight-on.vercel.app/](https://furia-fan-insight-on.vercel.app/) (API do twitter nao ta funcionando no site, eu Atingi o maximo de requisiçoes gratuitas mensais)

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

