# RAC Boardroom Simulator - Backend

Backend service built with FastAPI and SQLModel for the RAC Boardroom Simulator.

---

## Getting Started

### 1. Setup Environment

#### macOS / Linux
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

#### Windows (Command Prompt)
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
```

#### Windows (PowerShell)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

---

### 2. Configure Environment

Edit `backend/.env` with your desired configuration (e.g., adding your `GEMINI_API_KEY`).

---

### 3. Run Tests

Run pytest inside the `backend` directory with the virtual environment activated:

```bash
pytest
```

---

### 4. Start Development Server

Run the server with hot-reload enabled:

```bash
uvicorn app.main:app --reload --port 8000
```

Once running:
- Health check: [http://localhost:8000/health](http://localhost:8000/health)
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
