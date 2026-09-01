# Khabo-Koi

Khabo-Koi is a full-stack restaurant discovery and table reservation web platform.

## Shared Development Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router

### Backend
- Python
- Django 6.1
- Django REST Framework

### Database
- PostgreSQL 17

### Development Tools
- Git / GitHub
- pgAdmin 4
- VS Code

---

## Project Structure

```text
Khabo-koi/
├── frontend/
├── backend/
├── .gitignore
└── README.md
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
```

## PostgreSQL Setup

Create a PostgreSQL database named:

```text
khabo_koi
```

Copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

Then configure:

```env
DB_NAME=khabo_koi
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432
```

The `.env` file is private and must not be committed.

## Django Setup

```bash
python manage.py migrate
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000
```

Django Admin:

```text
http://127.0.0.1:8000/admin/
```

## Architecture

```text
React Frontend
      ↓
Django REST API
      ↓
Django ORM
      ↓
PostgreSQL
```

## Team Development

This repository contains the shared project environment used by all team members.

Individual features should be developed and committed separately so Git/GitHub history can show the contribution and changes made by each team member.