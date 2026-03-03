# Photfolio Deploy Checklist (Frontend + Backend)

Use this checklist every time before deployment.

## 1) Pre-check (Local)
- [ ] Backend compiles: `cd backend && mvn -DskipTests compile`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Login works locally with DB user
- [ ] Gallery/About APIs return data

## 2) Backend (Render)
- [ ] Service type: Web Service
- [ ] Runtime: Java/Spring Boot (or Docker if already configured)
- [ ] Health verified in logs: app started + Mongo connected

### Required Environment Variables
- [ ] `SPRING_DATA_MONGODB_URI` = Atlas URI with **photfolioDb**
- [ ] `JWT_SECRET` = 64+ characters (HS512 requirement)

### Optional Environment Variables
- [ ] `APP_ADMIN_EMAIL` (only if you want seed admin)
- [ ] `APP_ADMIN_PASSWORD` (only if you want seed admin)
- [ ] `MAIL_USERNAME`, `MAIL_APP_PASSWORD` (mail features)
- [ ] `APP_BASE_URL` (if absolute media URL generation needed)

### Supabase Storage (Recommended for media)
- [ ] `APP_STORAGE_PROVIDER=supabase`
- [ ] `APP_STORAGE_SUPABASE_URL=https://<project-ref>.supabase.co`
- [ ] `APP_STORAGE_SUPABASE_SERVICE_KEY=<service_role_key>`
- [ ] `APP_STORAGE_SUPABASE_BUCKET=<public_bucket_name>`
- [ ] `APP_STORAGE_SUPABASE_FOLDER=gallery` (optional)

### Backend Smoke Test
- [ ] `GET /api/gallery` => 200 and non-zero count
- [ ] `GET /api/content/about` => 200
- [ ] `POST /api/auth/login` (valid credentials) => token returned

## 3) Frontend (Vercel)
### Required Environment Variables
- [ ] `VITE_API_URL=https://<backend-domain>/api`

### Frontend Smoke Test
- [ ] Home/About/Gallery load data
- [ ] Login works
- [ ] No `4xx/5xx` errors in browser network tab

## 4) Media/File Note (Important)
- Free hosts can have ephemeral disk.
- If uploads disappear after restart/redeploy, use Supabase Storage and keep only media URL in MongoDB.

## 5) Fast Troubleshooting
- JWT key size error => `JWT_SECRET` too short (<64 chars)
- Login 400 invalid credentials => using wrong DB/user or seed mismatch
- Data missing => wrong DB name in URI (must be `photfolioDb`)
- Images missing => files not present on server disk or media URL path issue
