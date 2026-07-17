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
- 所有登录、注册、定价及未登录的快速开始入口，都会直接跳转到固定邀请链接 `https://www.accio-ai.com/login?sId=7YLXRghbT36k7rjO0EZJaw%3D%3D&ic=IC435013278092&tenant=accio_work&src=p_supplier_cn&channel=accio_sales_invite`；请勿替换、删减或追加其中的参数。
- 首页的桌面版下载会在新标签页打开上述固定登录链接；原页面会显示“我已登录，继续下载”按钮。该按钮仅提供人工确认后的继续下载，不读取或验证外站登录状态。下载目标只保留国际站 `https://www.accio.com/work/fixed/download` 的 Windows、macOS Apple Silicon、macOS Intel 安装包，不会使用 `work-download.accio-ai.com`。
- `CNAME` 适用于 GitHub Pages；使用普通服务器时以服务器绑定的域名配置为准。
