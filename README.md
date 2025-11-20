# WayChat Frontend (Vite + React)

## Setup (local)
1. Copy file contents into a new repo.
2. `npm install`
3. Create a `.env` file with:
4. `npm run dev` to start.

## Deploy to Vercel
1. Push to GitHub.
2. Create a new project on Vercel, connect the GitHub repo.
3. In Vercel project settings -> Environment Variables, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_WS_URL` = e.g. `wss://waychat-backend.onrender.com/ws`
4. Deploy (Vercel will build with `npm install && npm run build`).