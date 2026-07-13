(() => {
  'use strict';

  const ORIGINAL_ORIGIN = 'https://www.accio.com';
  const ORIGINAL_WORK = `${ORIGINAL_ORIGIN}/work`;
  const ACCIO_LOGIN_URL = 'https://www.accio-ai.com/login?sId=7YLXRghbT36k7rjO0EZJaw%3D%3D&ic=IC435013278092&tenant=accio_work&src=p_supplier_cn&channel=accio_sales_invite';
  const AUTH_ROUTE_PATTERN = /(?:^|\/)(?:login|register|signup|sign-in|sign-up)(?:\/|$)/i;
  let remoteView = null;

  const addBridgeStyles = () => {
    if (document.getElementById('accio-bridge-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'accio-bridge-styles';
    style.textContent = `
      .accio-remote-view {
        position: fixed;
        inset: 0;
        z-index: 2147483000;
        display: grid;
        grid-template-rows: 56px minmax(0, 1fr);
        background: #ffffff;
        color: #1d1d1f;
      }
      .accio-remote-view--login {
        grid-template-rows: 56px 54px minmax(0, 1fr);
      }
      .accio-remote-toolbar {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 0;
        padding: 0 18px;
        border-bottom: 1px solid #e5e7eb;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .accio-remote-back,
      .accio-remote-open {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        min-height: 34px;
        border-radius: 999px;
        padding: 0 14px;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
      }
      .accio-remote-back {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #374151;
      }
      .accio-remote-back:hover { background: #f9fafb; }
      .accio-remote-open {
        border: 1px solid #d1fae5;
        background: #ecfdf5;
        color: #047857;
      }
      .accio-remote-open:hover { background: #d1fae5; }
      .accio-remote-title {
        min-width: 0;
        overflow: hidden;
        color: #4b5563;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .accio-login-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 0;
        padding: 0 18px;
        border-bottom: 1px solid #d1fae5;
        background: #ecfdf5;
        color: #047857;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
        font-size: 15px;
        font-weight: 700;
        text-align: center;
      }
      .accio-remote-spacer { flex: 1; }
      .accio-remote-frame {
        width: 100%;
        height: 100%;
        border: 0;
        background: #ffffff;
      }
      .accio-remote-loading {
        position: absolute;
        inset: 56px 0 0;
        display: grid;
        place-items: center;
        pointer-events: none;
        color: #6b7280;
        font: 13px system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .accio-remote-view--login .accio-remote-loading {
        inset: 110px 0 0;
      }
      @media (max-width: 640px) {
        .accio-remote-toolbar { gap: 8px; padding: 0 10px; }
        .accio-remote-back,
        .accio-remote-open { padding: 0 10px; font-size: 12px; }
        .accio-remote-title { display: none; }
      }
    `;
    document.head.appendChild(style);
  };

  const isAuthLabel = (value) => /登录|注册/.test((value || '').replace(/\s+/g, ''));

  const isAuthRoute = (rawHref) => {
    if (!rawHref) {
      return false;
    }

    try {
      const parsed = new URL(rawHref, window.location.href);
      return AUTH_ROUTE_PATTERN.test(parsed.pathname);
    } catch {
      return false;
    }
  };

  const toOriginalUrl = (rawHref) => {
    if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
      return null;
    }

    if (isAuthRoute(rawHref)) {
      return ACCIO_LOGIN_URL;
    }

    if (rawHref.startsWith('#')) {
      return `${ORIGINAL_WORK}${rawHref}`;
    }

    if (rawHref.startsWith('/')) {
      return `${ORIGINAL_ORIGIN}${rawHref}`;
    }

    return rawHref;
  };

  const buttonTarget = (button) => {
    const label = (button.getAttribute('aria-label') || '').toLowerCase();
    const text = (button.textContent || '').replace(/\s+/g, ' ').trim();

    if (text.includes('定价')) {
      return `${ORIGINAL_ORIGIN}/pricing?pricingScene=manager&region=accio_work&language=zh`;
    }
    if (isAuthLabel(text)) {
      return ACCIO_LOGIN_URL;
    }
    if (text.includes('快速开始')) {
      return `${ORIGINAL_ORIGIN}/work/app?language=zh_CN&langRedirect=1`;
    }
    if (text.includes('帮助中心')) {
      return `${ORIGINAL_ORIGIN}/work/doc`;
    }
    if (text.includes('活动')) {
      return `${ORIGINAL_ORIGIN}/wow/fellow-program.html`;
    }
    if (label.includes('切换语言')) {
      return ORIGINAL_ORIGIN;
    }

    return ORIGINAL_WORK;
  };

  const closeRemoteView = (fromHistory = false) => {
    if (!remoteView) {
      return;
    }

    remoteView.remove();
    remoteView = null;

    if (!fromHistory && window.location.hash.startsWith('#remote=')) {
      window.history.back();
    }
  };

  const openRemoteView = (url, title = 'Accio Work') => {
    if (!url) {
      return;
    }

    const targetUrl = isAuthRoute(url) ? ACCIO_LOGIN_URL : url;

    closeRemoteView(true);
    addBridgeStyles();

    const shell = document.createElement('section');
    const isLoginView = targetUrl === ACCIO_LOGIN_URL;
    shell.className = `accio-remote-view${isLoginView ? ' accio-remote-view--login' : ''}`;
    shell.setAttribute('aria-label', '原站功能视图');

    const toolbar = document.createElement('header');
    toolbar.className = 'accio-remote-toolbar';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'accio-remote-back';
    back.textContent = '返回首页';
    back.addEventListener('click', () => closeRemoteView(false));

    const heading = document.createElement('div');
    heading.className = 'accio-remote-title';
    heading.textContent = title;

    const spacer = document.createElement('div');
    spacer.className = 'accio-remote-spacer';

    const loginBanner = document.createElement('div');
    loginBanner.className = 'accio-login-banner';
    loginBanner.textContent = '免费组建你的 Agent 团队，每日赠送免费额度';

    const open = document.createElement('a');
    open.className = 'accio-remote-open';
    open.href = targetUrl;
    open.target = '_blank';
    open.rel = 'noopener noreferrer';
    open.textContent = '在原站打开';

    const loading = document.createElement('div');
    loading.className = 'accio-remote-loading';
    loading.textContent = '正在加载原站功能…';

    const frame = document.createElement('iframe');
    frame.className = 'accio-remote-frame';
    frame.title = title;
    frame.src = targetUrl;
    frame.setAttribute('allow', 'clipboard-read; clipboard-write');
    frame.addEventListener('load', () => loading.remove(), { once: true });

    toolbar.append(back, heading, spacer, open);
    shell.append(toolbar);
    if (isLoginView) {
      shell.append(loginBanner);
    }
    shell.append(loading, frame);
    document.body.appendChild(shell);
    remoteView = shell;

    window.history.pushState({ remoteUrl: targetUrl }, '', `#remote=${encodeURIComponent(targetUrl)}`);
  };

  const handleButton = (event, button) => {
    const label = (button.getAttribute('aria-label') || '').toLowerCase();
    const buttonText = (button.textContent || '').replace(/\s+/g, ' ').trim();

    if (isAuthLabel(`${label} ${buttonText}`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openRemoteView(ACCIO_LOGIN_URL, buttonText || '登录');
      return;
    }

    if (label === '返回顶部') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    openRemoteView(buttonTarget(button), (buttonText || label || 'Accio Work').trim());
  };

  const handleAnchor = (event, anchor) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const anchorLabel = `${anchor.getAttribute('aria-label') || ''} ${anchor.textContent || ''}`;
    if (isAuthLabel(anchorLabel)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openRemoteView(ACCIO_LOGIN_URL, anchor.textContent.trim() || '登录');
      return;
    }

    const href = toOriginalUrl(anchor.getAttribute('href'));
    if (!href || !/^https?:\/\//i.test(href)) {
      return;
    }

    if (href === ACCIO_LOGIN_URL) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openRemoteView(ACCIO_LOGIN_URL, anchor.textContent.trim() || '登录');
      return;
    }

    if (!href.startsWith(ORIGINAL_ORIGIN)) {
      return;
    }

    event.preventDefault();
    openRemoteView(href, anchor.textContent.trim() || 'Accio Work');
  };

  const boot = () => {
    addBridgeStyles();

    document.addEventListener('click', (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (anchor) {
        handleAnchor(event, anchor);
        return;
      }

      const button = event.target.closest?.('button');
      if (button) {
        handleButton(event, button);
      }
    }, true);

    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        openRemoteView(`${ORIGINAL_ORIGIN}/`, 'Accio');
      });
    });

    window.addEventListener('popstate', () => closeRemoteView(true));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && remoteView) {
        closeRemoteView(false);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
