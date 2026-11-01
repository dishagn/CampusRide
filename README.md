
## Deployment Guide

### Hosting Platform Recommendation
For a frontend‑only React + Vite app that talks directly to Supabase, a static hosting service is sufficient. **Vercel** is the simplest choice:
- Automatic detection of Vite/React.
- Free tier supports preview & production builds.
- Environment variables can be configured securely.
- Handles SPA routing with fallback to `index.html`.

### Prerequisites
1. A Git repository (e.g., on GitHub, GitLab, or Bitbucket) with the project code.
2. A Vercel account (sign up at https://vercel.com).
3. A Supabase project with the required tables and RLS policies. Ensure you have:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. The `.env` file locally should contain those values (do **not** commit it).

### Step‑by‑Step Deployment

1. **Push the code to a Git remote**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin <your‑repo‑url>
   git push -u origin main
   ```

2. **Import the repository into Vercel**
   - In Vercel Dashboard click **New Project** → **Import Git Repository**.  
   - Select the repo you just pushed. Vercel will automatically detect the **Vite** framework.

3. **Configure Build Settings** (usually auto‑filled)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Add Environment Variables**
   Go to **Project Settings → Environment Variables** and add the variables from your `.env` (use the same `VITE_` prefixes). Set them for **Production** (and optionally **Preview**). Example:

   | Name                     | Value (from .env) |
   |--------------------------|-------------------|
   | VITE_SUPABASE_URL        | https://xxxx.supabase.co |
   | VITE_SUPABASE_ANON_KEY   | your-anon-key |
   | VITE_CAMPUS_LATITUDE     | 12.9716 |
   | VITE_CAMPUS_LONGITUDE    | 77.5946 |
   | VITE_CAMPUS_GEOFENCE_RADIUS_METERS | 200 |
   | VITE_OSRM_ROUTING_URL    | https://router.project-osrm.org |

5. **Deploy**
   - Click **Deploy**. Vercel will run `npm install` and `npm run build`.  
   - On success you’ll get a URL like `https://<project>.vercel.app`.

6. **Verify the Deployment**
   - Open the URL and navigate through the app (login, dashboards).  
   - Confirm that data loads from Supabase and maps display correctly.

### Public Access & Restriction
- The Vercel URL is public by default.
- To restrict access you can:
  * Enable **Password Protection** (Project Settings → Access).  
  * Deploy under a **Vercel Team** and invite only teammates.  
  * Rely on Supabase authentication – unauthenticated users will see only the public landing page.

### Important Checklist
- ✅ `.env` is listed in `.gitignore` (do not commit secrets).  
- ✅ All required environment variables are defined in Vercel.  
- ✅ `package.json` scripts: `dev`, `build`, `preview` (Vercel uses `build`).  
- ✅ The `dist/` folder is listed in `.gitignore` (Vercel builds it).  
- ✅ Optional: create a `.vercelignore` to exclude `driver_mobile_app/` if you don’t want the Flutter code uploaded.

### Optional: `.vercelignore`
Create a file named `.vercelignore` at the project root with:
```
driver_mobile_app/
```
This keeps the mobile source out of the Vercel deploy bundle.

---

You can now share the generated Vercel URL with your teammates. They will need a Supabase account only if they need to view protected data; otherwise the public landing page is accessible to anyone.
