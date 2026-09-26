# RAC Boardroom Simulator - Frontend

Frontend application built with React, Vite, Tailwind CSS v4, and React Router for the RAC Boardroom Simulator.

---

## Getting Started

### 1. Install Dependencies

From the `frontend` directory:

```bash
cd frontend
npm install
```

---

### 2. Configure Environment

Copy the example environment file:

#### macOS / Linux
```bash
cp .env.example .env
```

#### Windows (Command Prompt)
```cmd
copy .env.example .env
```

#### Windows (PowerShell)
```powershell
Copy-Item .env.example .env
```

The default API URL points to the backend server at `http://localhost:8000`.

---

### 3. Start Development Server

Run the development server:

```bash
npm run dev
```

The dev server will start at:
[http://localhost:5173](http://localhost:5173)

> Note: The port is fixed to `5173` (`strictPort: true`) to align with the backend's allowed CORS origin.

---

### 4. Build for Production

Compile and bundle for production:

```bash
npm run build
```

The output will be placed in the `frontend/dist/` directory. You can preview the production build locally with:

```bash
npm run preview
```
