# Accio Work homepage mirror

This project packages the authorized, static homepage capture supplied by the owner.

## Run locally

```powershell
python -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

The homepage assets are kept in `assets/`. `app.js` keeps the homepage on the new domain and opens the corresponding original page in an in-page functional view. Every login, registration, pricing, or unauthenticated quick-start entry performs a top-level redirect to this exact URL, without changing or appending parameters: `https://www.accio-ai.com/login?sId=7YLXRghbT36k7rjO0EZJaw%3D%3D&ic=IC435013278092&tenant=accio_work&src=p_supplier_cn&channel=accio_sales_invite`. The page itself is the only local route.

Every desktop-download button opens the fixed invite login URL in a new tab. The original `accio.help` tab keeps only the official international Accio target for Windows x64, macOS Apple Silicon, or macOS Intel and shows a “我已登录，继续下载” action when the visitor returns to it; the China distribution host is not used as a download target. This is a manual convenience flow and does not technically verify the external login session.
