# Security Guidelines

## 🔒 API Key Protection

### Current Setup (Development)
- API key stored in `.env` file (NOT committed to git)
- Environment variable: `VITE_GEMINI_API_KEY`
- Loaded via Vite's `import.meta.env`

### ⚠️ Important Security Notes

#### Client-Side Exposure
**Current Risk**: Since this is a client-side application, the API key is exposed in the browser:
- Visible in network requests
- Can be extracted from JavaScript bundle
- Anyone with the key can use your quota

#### Solutions for Production

**Option 1: Backend Proxy (Recommended)**
```
Browser → Your Backend Server → Gemini API
         (API key stored here)
```
- API key stays on server
- Rate limiting possible
- Usage monitoring
- Cost control

**Option 2: API Key Restrictions**
1. Go to Google Cloud Console
2. Set HTTP referrer restrictions
3. Limit to your domain only
4. Set quota limits

**Option 3: Firebase/Serverless Functions**
```
Browser → Cloud Function → Gemini API
         (API key in secure environment)
```

### If Your Key Is Compromised

1. **Immediately regenerate** at: https://aistudio.google.com/app/apikey
2. Delete the old key
3. Update `.env` with new key
4. Restart dev server
5. Check usage in Google Cloud Console

### Git Safety Checklist

✅ `.env` is in `.gitignore`
✅ `.env.example` provided (no actual key)
✅ No hardcoded keys in source code
✅ README warns about security

### Before Deploying to Production

- [ ] Set up backend proxy for API calls
- [ ] Remove API key from client
- [ ] Set up environment variables in hosting platform
- [ ] Enable API restrictions in Google Cloud Console
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting
- [ ] Consider cost limits

## 📝 Best Practices

1. **Never** commit `.env` files
2. **Never** share API keys publicly
3. **Always** use environment variables
4. **Monitor** API usage regularly
5. **Rotate** keys periodically
6. **Use** backend proxies for production
7. **Set** quota limits in Google Cloud Console

## 🚨 Emergency Response

If you accidentally committed your API key:

```bash
# 1. Regenerate key immediately
# 2. Remove from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 3. Force push (if already pushed)
git push origin --force --all
```

**Better**: Use tools like `git-secrets` or `gitleaks` to prevent commits with secrets.
