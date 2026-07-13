# Accio Work homepage mirror

This project packages the authorized, static homepage capture supplied by the owner.

## Run locally

```powershell
python -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

The homepage assets are kept in `assets/`. `app.js` keeps the homepage on the new domain and opens the corresponding original page in an in-page functional view. Any homepage button or link labeled `登录` or `注册` uses the supplied `accio-ai.com` login URL. The login view shows the custom invitation copy `免费组建你的 Agent 团队，每日赠送免费额度` above the cross-origin login page. The page itself is the only local route.
