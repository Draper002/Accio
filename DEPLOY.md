# Accio 网站部署说明

## 上传部署

1. 将本目录中的 `index.html`、`app.js`、`assets`、`CNAME` 和本说明文件上传到服务器站点根目录，保持目录结构不变。
2. 将域名 `www.accio.help` 的 DNS 解析到服务器，并为域名配置 HTTPS。
3. 将站点根目录设置为静态文件目录，默认首页指向 `index.html`。
4. 确认服务器允许页面访问 `https://www.accio.com` 与 `https://www.accio-ai.com`，因为功能页通过远程 iframe 加载原站内容。

## 本地验收

在本目录执行：

```powershell
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173/`。

## 注意事项

- 部署时不要单独移动 `assets` 目录，否则首页样式和图片会丢失。
- 如果服务器配置了 CSP，需要允许 `frame-src https://www.accio.com https://www.accio-ai.com`。
- `CNAME` 适用于 GitHub Pages；使用普通服务器时以服务器绑定的域名配置为准。
