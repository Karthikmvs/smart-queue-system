# Smart Queue Management System (MVP Version)

QFlow is a virtual queue management system that replaces physical waiting lines with a digital queue. Customers join queues by scanning a QR code or visiting a URL, and track their position in real-time, while staff members manage the queue from a live dashboard.

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Vite, Socket.IO Client, Lucide Icons
- **Backend**: Node.js, Express, TypeScript, Mongoose, Socket.IO, JWT Auth, bcryptjs
- **Database**: MongoDB (Local Connection)

---

## Folder Structure
- `/backend`: Node.js Express server running on port `5000`
- `/frontend`: React client running on port `5173` via Vite

---

## Features & Roles

### 1. Customers (No Login Required)
- **Join Queue**: Enter name via `/join/:queueCode` to retrieve ticket.
- **Track Status**: Follow ticket progress dynamically via `/track/:token` (e.g., waiting counters, currently serving token, and estimated wait times).
- **TTS Announcements & Desktop Alerts**: Receives browser notification and text-to-speech audio updates when their ticket is called.

### 2. Staff (Login Required)
- **Login Portal**: Authenticate securely using JWT token.
- **Seeded Admin Account**: Preloaded with testing credentials:
  - **Email**: `staff@queue.com`
  - **Password**: `password123`
- **Dashboard (/dashboard)**:
  - Create active queues (Name, Code, Est. service time).
  - Print/Copy join links and view custom SVG QR codes.
  - Trigger **Call Next** to atomically call the next waiting customer, update serving tokens, and broadcast socket events.
  - Mark entries **Served** or **Skipped** to manage throughput.

---

## Setup & Running Locally

### Environment Configuration

Both the frontend and backend require configuration via environment variables to run. Example template files are provided as `.env.example` in both directories.

#### Backend Environment Variables (`backend/.env`)
- `PORT`: The port the backend server runs on (default: `5000`).
- `MONGODB_URI`: MongoDB connection URI (default: `mongodb://localhost:27017/smart-queue`).
- `JWT_SECRET`: Secret key used to sign and verify auth tokens. **(Required; application will fail to start if not set)**.
- `FRONTEND_URL`: The URL of the React client (used for CORS, default: `http://localhost:5173`).
- `API_URL`: The backend server's public URL (default: `http://localhost:5000`).

#### Frontend Environment Variables (`frontend/.env`)
- `VITE_API_BASE_URL`: Base URL for the Express API endpoint (default: `http://localhost:5000/api`).
- `VITE_SOCKET_URL`: Connection URL for Socket.IO updates (default: `http://localhost:5000`).

### Prerequisites
- Node.js (v18+) and NPM
- MongoDB running locally on default port `27017`

### Running the App

1. Ensure MongoDB service is running locally on port `27017` (e.g. `mongodb://localhost:27017/smart-queue`).
2. Go to the project root directory:
   ```bash
   cd C:\Users\tanoo\.gemini\antigravity-ide\scratch\smart-queue-system
   ```
3. Run the concurrent developer server command:
   ```bash
   npm run dev
   ```
   *Note: This starts the Express API server on `http://localhost:5000` and the Vite React app on `http://localhost:5173` simultaneously.*

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a staff account
- `POST /api/auth/login` - Login to retrieve token
- `GET /api/auth/me` - Profile checks

### Queues
- `POST /api/queues/` - Create a queue (Staff only)
- `GET /api/queues/` - List all queues with stats (Staff only)
- `GET /api/queues/public/:code` - Retrieve details of a queue (Public)

### Entries
- `POST /api/entries/join/:code` - Register customer (Public)
- `GET /api/entries/track/:token` - Track ticket position (Public)
- `GET /api/entries/queue/:queueId` - List queue tickets (Staff only)
- `PATCH /api/entries/:id/status` - Manually update ticket status (Staff only)
- `POST /api/entries/queue/:queueId/call-next` - Atomically serve next customer (Staff only)
