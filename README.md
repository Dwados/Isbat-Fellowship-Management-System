# Fellowship Attendance System

QR-code check-in for a fellowship. React + Vite + Tailwind + Supabase (no backend server).

## Setup

1. Create a Supabase project.
2. SQL Editor: run supabase/schema.sql, then supabase/seed.sql.
3. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   (Supabase Dashboard, Project Settings, API).
4. npm install
5. npm run dev  ->  http://localhost:5173

## Pages

- /            QR kiosk (display at the entrance)
- /check-in    member check-in + registration flow
- /dashboard   today's stats + recent check-ins
- /members     search + profiles + attendance history
- /attendance  records filtered by date
- /analytics   bar + line charts
