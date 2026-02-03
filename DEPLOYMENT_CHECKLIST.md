# Deployment Checklist

Use this checklist to ensure a smooth deployment to Render and Netlify.

---

## Pre-Deployment

### 1. API Keys Ready ✓
- [ ] Supabase URL
- [ ] Supabase Service Role Key
- [ ] Supabase Anon Key (for frontend)
- [ ] OpenAI API Key
- [ ] Resend API Key
- [ ] Hunter API Key (optional)

### 2. Code Ready ✓
- [ ] All code committed to Git
- [ ] Repository pushed to GitHub/GitLab
- [ ] No sensitive data in code (check .gitignore)
- [ ] Test locally one more time

---

## Deploy to Render (Backend + Scraper)

### Option A: Blueprint (Easiest) ✓

1. [ ] Go to [Render Dashboard](https://dashboard.render.com/)
2. [ ] Click **New** → **Blueprint**
3. [ ] Connect your repository
4. [ ] Render detects `render.yaml`
5. [ ] Click **Apply**
6. [ ] Add environment variables to **BOTH services**:

**Backend Variables:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
HUNTER_API_KEY=
NODE_ENV=production
```

**Scraper Variables:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

7. [ ] Wait for deployment to complete (~3-5 minutes)
8. [ ] Copy backend URL (e.g., `https://pr-outreach-backend.onrender.com`)
9. [ ] Copy scraper URL (e.g., `https://pr-outreach-scraper.onrender.com`)

### Add Cross-Service Communication ✓

10. [ ] Go to Backend service → Environment
11. [ ] Add variable:
```
SCRAPER_SERVICE_URL=https://pr-outreach-scraper.onrender.com
```
12. [ ] Service auto-redeploys

---

## Deploy to Netlify (Frontend)

1. [ ] Go to [Netlify Dashboard](https://app.netlify.com/)
2. [ ] Click **Add new site** → **Import existing project**
3. [ ] Connect your repository
4. [ ] Build settings should auto-detect from `netlify.toml`:
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `frontend/dist`
5. [ ] Click **Deploy site**
6. [ ] Go to **Site settings** → **Environment variables**
7. [ ] Add these variables:

```
VITE_BACKEND_API_URL=https://pr-outreach-backend.onrender.com
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

8. [ ] Click **Trigger deploy** to rebuild with new env vars

---

## Post-Deployment Testing

### Backend Health Check ✓
1. [ ] Visit `https://YOUR-BACKEND.onrender.com/health`
2. [ ] Should see: `{"status":"ok"}`

### Scraper Health Check ✓
1. [ ] Visit `https://YOUR-SCRAPER.onrender.com/docs`
2. [ ] Should see FastAPI Swagger docs

### Frontend Check ✓
1. [ ] Visit your Netlify URL
2. [ ] Open browser console (F12)
3. [ ] Check for errors
4. [ ] Test creating a campaign

### Full Flow Test ✓
1. [ ] Create a new campaign
2. [ ] Wait for scraper to run (~30-60 seconds)
3. [ ] Check journalists list populates
4. [ ] Verify email generation works
5. [ ] Test sending an email (optional)
6. [ ] Check email tracking (open tracking pixel)

---

## Common Issues

### ❌ "Failed to fetch journalists from scraper service"
- Check `SCRAPER_SERVICE_URL` is set in backend environment
- Verify scraper service is running (not crashed)
- Check scraper logs in Render

### ❌ "OPENAI_API_KEY not set"
- Add `OPENAI_API_KEY` to backend environment variables
- Redeploy backend service

### ❌ CORS errors in browser console
- Verify `VITE_BACKEND_API_URL` matches your actual backend URL
- Check no trailing slash in URL
- Backend already allows all origins in production

### ❌ First request takes 30+ seconds
- Render free tier sleeps after 15 minutes inactivity
- First request wakes up the service
- Consider upgrading to paid tier for instant responses

### ❌ Build fails on Netlify
- Check build logs
- Verify all dependencies in `frontend/package.json`
- Ensure Node version compatible (uses Node 18)

### ❌ Supabase connection errors
- Verify Supabase credentials are correct
- Check Supabase project isn't paused
- Ensure RLS policies allow service role access

---

## URLs to Save

After deployment, save these URLs:

```
Frontend: https://YOUR-APP.netlify.app
Backend:  https://YOUR-BACKEND.onrender.com
Scraper:  https://YOUR-SCRAPER.onrender.com
Database: https://YOUR-PROJECT.supabase.co
```

---

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure email sender domain in Resend
- [ ] Set up monitoring/alerts in Render
- [ ] Consider upgrading to paid tiers for production
- [ ] Enable CI/CD auto-deploys on git push

---

## Support

If you run into issues:
1. Check service logs in Render/Netlify dashboards
2. Verify all environment variables are set correctly
3. Test API endpoints directly (use Postman or curl)
4. Check Supabase logs for database errors

Deployment complete! 🚀
