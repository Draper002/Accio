(() => {
  'use strict';

  const ORIGINAL_ORIGIN = 'https://www.accio.com';
  const ORIGINAL_WORK = `${ORIGINAL_ORIGIN}/work`;
  const ACCIO_LOGIN_URL = 'https://www.accio-ai.com/login?sId=7YLXRghbT36k7rjO0EZJaw%3D%3D&ic=IC435013278092&tenant=accio_work&src=p_supplier_cn&channel=accio_sales_invite';
  const AUTH_ROUTE_PATTERN = /(?:^|\/)(?:login|register|signup|sign-in|sign-up|pricing|work\/app)(?:\/|$)/i;
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
        display: flex;
        flex-direction: column;
        background: #ffffff;
        color: #1d1d1f;
      }
      .accio-remote-frame {
        width: 100%;
        flex: 1 1 auto;
        min-height: 0;
        border: 0;
        background: #ffffff;
      }
      .accio-remote-loading {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        pointer-events: none;
        color: #6b7280;
        font: 13px system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
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
    const text = `${button.textContent || ''} ${button.getAttribute('value') || ''}`.replace(/\s+/g, ' ').trim();

    if (text.includes('定价')) {
      return ACCIO_LOGIN_URL;
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
    shell.className = 'accio-remote-view';
    shell.setAttribute('aria-label', '原站功能视图');

    const loading = document.createElement('div');
    loading.className = 'accio-remote-loading';
    loading.textContent = '正在加载原站功能…';

    const frame = document.createElement('iframe');
    frame.className = 'accio-remote-frame';
    frame.title = title;
    frame.src = targetUrl;
    frame.setAttribute('allow', 'clipboard-read; clipboard-write');
    frame.addEventListener('load', () => loading.remove(), { once: true });

    shell.append(loading, frame);
    document.body.appendChild(shell);
    remoteView = shell;

    window.history.pushState({ remoteUrl: targetUrl }, '', `#remote=${encodeURIComponent(targetUrl)}`);
  };

  const handleButton = (event, button) => {
    const label = `${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`.toLowerCase();
    const buttonText = `${button.textContent || ''} ${button.getAttribute('value') || ''}`.replace(/\s+/g, ' ').trim();

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

      const button = event.target.closest?.('button, [role="button"], input[type="button"], input[type="submit"]');
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
