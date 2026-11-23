
# AttendSafe

AttendSafe is a web-based employee attendance management system that uses face recognition technology to verify employee identity during attendance recording.

The system integrates face recognition, GPS location tracking, and attendance management with a PostgreSQL database.

## Features

- Employee login and authentication
- Employee face registration
- Face recognition for attendance verification
- Check-in and check-out recording
- GPS location recording
- Attendance status monitoring
- PostgreSQL database integration

## Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLAlchemy
- OpenCV
- InsightFace

### Database
- PostgreSQL

## Project Structure

```text
AttendSafe/
├── backend/
├── frontend/
├── .gitignore
├── AttendSafe.bat
└── README.md
```

## Requirements

- Python 3.13
- Node.js and npm
- PostgreSQL
- Git

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/AttendSafe.git
cd AttendSafe
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

Replace the example values with your own PostgreSQL configuration.

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Run Backend

From the `backend` directory:

```bash
python -m uvicorn main:app --reload
```

Backend API documentation:

http://127.0.0.1:8000/docs

Frontend:

http://localhost:5173

## Security Notice

- Never upload `.env` files or database credentials.
- Do not publish employee biometric data or personal information.
- Configure your own database credentials before running the application.

## Project Status

Under development as part of the Capstone Design project.
