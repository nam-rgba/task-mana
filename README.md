<div align="center">

<img src="public/logo.png" alt="Taskee Logo" width="80" height="80" />

**A modern, AI-powered project & task management platform**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

<br/>

> Manage your team, projects, and tasks smarter — with AI assistance built right in.

<br/>

[Live Demo](#taskee.codes) · [Docs](#) · [Report Bug](../../issues) · [Request Feature](../../issues)

</div>

---

## Overview

Taskee is a full-stack project and task management platform with AI-powered assistance. It consists of three components:

- **Frontend** — React 19 SPA with drag-and-drop boards, team/project management, and an admin panel
- **Backend** — Node.js / Express REST API with TypeORM and PostgreSQL
- **AI Service** — Python FastAPI microservice for story point estimation, task generation, assignee suggestion, and chat

---

# Frontend

## Getting Started

### Prerequisites

- Node.js >= 18
- npm / yarn / pnpm

### Installation

```bash
git clone https://github.com/your-username/taskee.git
cd taskee

npm install
```

### Run in Development

```bash
npm run dev
```

The app will be running at **http://localhost:5173**

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

# Backend (API Server)

The backend is a **Node.js / Express** REST API written in **TypeScript**, using **TypeORM** with **PostgreSQL**.

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL (local or Docker)
- npm / yarn / pnpm

### Installation

```bash
git clone https://github.com/your-username/raise.git
cd raise

npm install
```

### Environment Variables

Create a `.env` file at the project root:

```env
# Database
DATABASE_URL=postgresql://root:passed@localhost:5432/taskmanager

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Notification / Email
FRONTEND_URL=http://localhost:5173
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@your-domain.com

# Cloudinary (file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run in Development

```bash
npm run dev
```

The server starts at **http://localhost:3000**.  
Changes to `src/` and `.env` are hot-reloaded via nodemon + tsx.

### Seed the Database

```bash
# Seed base data (plans, roles, etc.)
npm run seed

# Seed AI feedback sample data
npm run seed:ai-feedback
```

### Build for Production

```bash
npm run build
npm start
```

### Run with Docker Compose

```bash
# Make sure .env.production exists at the project root, then:
docker compose up -d --build
```

This spins up:

- `raise_backend` — the API server on port **3000**
- `postgres_raise_db` — PostgreSQL with a persistent volume

```bash
# Stop and remove containers
docker compose down
```

## Realtime Notifications + Email

Tài liệu tích hợp cho FE được tách riêng tại:

- `docs/notification-api.md`

---

# AI Service (Python)

The AI service is a standalone **FastAPI** microservice for story point estimation, task generation, assignee suggestion, and chat. It communicates with the backend over HTTP.

## Getting Started

### Environment Variables

Create a `.env` file inside the `ai_service/` directory:

```env
# LLM — Get your key at https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# Model name — see supported list at https://console.groq.com/docs/models
GROQ_MODEL_NAME=llama3-8b-8192

# LangSmith — request tracing (optional but recommended)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key

# Upstash — chat message history (https://console.upstash.com)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
```

### Run with Docker (Recommended)

```bash
cd ai_service
docker compose up --build -d
```

> **First build note:** Installing `requirements.txt` and loading the embedding model on first startup will take a few minutes since the service runs on CPU by default.

```bash
# Stop the service
docker compose down
```

### Disable Hot Reload (Production)

Remove the `--reload` flag from `docker-compose.yml`, then restart:

```bash
docker compose restart
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

Made with love by [doanngocnam](https://github.com/doanngocnam)
