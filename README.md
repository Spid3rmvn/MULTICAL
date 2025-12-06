# MULTICAL

An offline desktop application built with **Electron.js** (frontend) and **FastAPI** (backend), using **SQLite** for local data persistence.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Electron Desktop App               │
├─────────────────────────────────────────────────┤
│  Main Process  │       Renderer Process         │
│  (Node.js)     │       (HTML/CSS/JS)            │
└────────────────┴────────────────────────────────┘
                         │
                    HTTP/IPC
                         │
              ┌──────────▼──────────┐
              │    FastAPI Backend   │
              │  (Python REST API)   │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │       SQLite         │
              │   (Local Database)   │
              └─────────────────────┘
```

## Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **npm** or **yarn**

## Project Structure

```
MULTICAL/
├── frontend/          # Electron application
│   ├── main/          # Main process (app lifecycle, IPC)
│   ├── renderer/      # UI (HTML/CSS/JS)
│   └── shared/        # Shared constants
│
├── backend/           # FastAPI backend
│   └── app/
│       ├── api/       # API endpoints
│       ├── core/      # Configuration
│       ├── db/        # Database layer
│       ├── schemas/   # Pydantic schemas
│       └── services/  # Business logic
│
├── database/          # SQLite database files
├── scripts/           # Utility scripts
└── docs/              # Documentation
```

## Quick Start

### 1. Setup

```bash
# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Development

```bash
# Start both frontend and backend
./scripts/start_dev.sh
```

Or manually:

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2: Start frontend
cd frontend
npm start
```

### 3. Build for Production

```bash
./scripts/build.sh
```

## Development

### Backend (FastAPI)

The backend runs on `http://localhost:8000` with:
- API documentation: `http://localhost:8000/docs`
- Alternative docs: `http://localhost:8000/redoc`

### Frontend (Electron)

The Electron app loads the renderer content and communicates with the FastAPI backend via HTTP requests.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop Shell | Electron.js |
| Frontend UI | HTML, CSS, JavaScript |
| Backend API | FastAPI (Python) |
| Database | SQLite |
| ORM | SQLAlchemy |
| Validation | Pydantic |

## License

MIT License
