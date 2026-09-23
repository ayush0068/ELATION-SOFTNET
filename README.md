# Elation Softnet

Full-stack product catalog app — user auth (register/login with JWT) + product CRUD with image upload, search, category and status filters.

Two folders: `backend` (Node/Express + MongoDB) and `frontend` (React + Vite + Tailwind).

## Stack

- Backend: Node.js, Express 5, MongoDB (Mongoose), JWT auth, bcrypt for password hashing, Multer for image uploads
- Frontend: React 19, Vite, React Router, Tailwind CSS v4, Axios

## Prerequisites

- Node.js 18+
- A MongoDB connection string (local install or a free Atlas cluster works fine)

## Getting the project running

### 1. Backend

```
cd backend
npm install
```

Create a `.env` file in `backend/`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
```

Start it:

```
npm run dev
```

This runs on `http://localhost:5000` via nodemon. Use `npm start` if you don't want auto-restart on file changes.

Uploaded product images are saved to `backend/uploads/products` and served at `/uploads/...`, so make sure that folder exists (it's already in the repo, just don't delete it).

### 2. Frontend

In a separate terminal:

```
cd frontend
npm install
```

Add a `.env` in `frontend/`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Then:

```
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`). Open that, register a new account, then log in.

## Notes

- Login accepts either email or mobile number in the same field, matched against whichever one exists in the DB.
- Delete on the product listing is a soft delete (`isDeleted` flag) — the record stays in Mongo, it's just filtered out of the listing query.
- Passwords are hashed with bcrypt before saving, never stored in plain text.
- The JWT token is stored on the frontend and attached to requests via an axios interceptor (see `frontend/src/api/axios.js`); expired/invalid tokens redirect back to `/login`.

## Known limitations / things to improve later

- No email verification or password reset flow yet
- No pagination controls on the UI beyond page size — works fine for a small catalog but would need proper pagination for a large one
- No automated tests