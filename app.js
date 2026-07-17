(() => {
  'use strict';

  const ORIGINAL_ORIGIN = 'https://www.accio.com';
  const ORIGINAL_WORK = `${ORIGINAL_ORIGIN}/work`;
  const ACCIO_LOGIN_URL = 'https://www.accio-ai.com/login?sId=7YLXRghbT36k7rjO0EZJaw%3D%3D&ic=IC435013278092&tenant=accio_work&src=p_supplier_cn&channel=accio_sales_invite';
  const INTERNATIONAL_DOWNLOAD_ROUTES = Object.freeze({
    windows: `${ORIGINAL_WORK}/fixed/download?platform=windowsDownloadUrl`,
    macApple: `${ORIGINAL_WORK}/fixed/download?platform=macAppleDownloadUrl`,
    macIntel: `${ORIGINAL_WORK}/fixed/download?platform=macIntelDownloadUrl`
  });
  const AUTH_ROUTE_PATTERN = /(?:^|\/)(?:login|register|signup|sign-in|sign-up|pricing|work\/app)(?:\/|$)/i;
  const AUTH_LABEL_PATTERN = /(?:登录|注册|登陆|免费注册|立即注册|立即登录|sign[\s-]?in|log[\s-]?in|sign[\s-]?up|register|create[\s-]?account)/i;
  const DOWNLOAD_LABEL_PATTERN = /(?:下载|download)/i;
  const PENDING_DOWNLOAD_STORAGE_KEY = 'accio.pendingInternationalDownload';
  const DOWNLOAD_RESUME_PROMPT_ID = 'accio-download-resume-prompt';
  const MOBILE_APP_PROMPT_ID = 'accio-mobile-app-prompt';
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
      .accio-download-resume-prompt {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(15, 23, 42, .36);
        color: #111827;
        font: 14px/1.55 system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      }
      .accio-download-resume-card {
        width: min(448px, 100%);
        padding: 24px;
        border: 1px solid rgba(16, 185, 129, .24);
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 22px 60px rgba(15, 23, 42, .28);
      }
      .accio-download-resume-card h2 {
        margin: 0 0 6px;
        font-size: 16px;
        line-height: 1.35;
      }
      .accio-download-resume-card p {
        margin: 0;
        color: #4b5563;
      }
      .accio-download-resume-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }
      .accio-download-resume-actions button {
        min-height: 38px;
        padding: 0 13px;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }
      .accio-download-resume-actions [data-accio-download-continue] {
        background: #111827;
        color: #ffffff;
      }
      .accio-download-resume-actions [data-accio-download-login] {
        background: #ecfdf5;
        color: #047857;
      }
      .accio-download-resume-actions [data-accio-download-dismiss] {
        margin-left: auto;
        background: transparent;
        color: #6b7280;
      }
      .accio-mobile-app-prompt {
        display: none;
      }
      @media (max-width: 767px) {
        body {
          padding-bottom: 94px;
        }
        .accio-mobile-app-prompt {
          position: fixed;
          right: 12px;
          bottom: 12px;
          left: 12px;
          z-index: 2147482998;
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 68px;
          padding: 10px 12px;
          border: 1px solid rgba(16, 185, 129, .2);
          border-radius: 16px;
          background: rgba(255, 255, 255, .98);
          box-shadow: 0 12px 36px rgba(15, 23, 42, .18);
          color: #111827;
          font: 13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
        }
        .accio-mobile-app-icon {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 11px;
          background: #111827;
          color: #ffffff;
          font-weight: 800;
          letter-spacing: -.04em;
        }
        .accio-mobile-app-copy {
          min-width: 0;
          flex: 1 1 auto;
        }
        .accio-mobile-app-copy strong,
        .accio-mobile-app-copy span {
          display: block;
        }
        .accio-mobile-app-copy strong {
          font-size: 14px;
        }
        .accio-mobile-app-copy span {
          margin-top: 2px;
          overflow: hidden;
          color: #6b7280;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .accio-mobile-app-prompt button {
          min-height: 36px;
          flex: 0 0 auto;
          padding: 0 12px;
          border: 0;
          border-radius: 999px;
          background: #111827;
          color: #ffffff;
          font: inherit;
          font-weight: 700;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const isAuthLabel = (value) => AUTH_LABEL_PATTERN.test((value || '').replace(/\s+/g, ''));

  const redirectToLogin = () => {
    // Authentication must always leave this site through the exact invite URL.
    // Do not load it in the remote iframe: that keeps the browser on accio.help
    // and can allow later external redirects to replace the intended address.
    if (window.location.href !== ACCIO_LOGIN_URL) {
      window.location.assign(ACCIO_LOGIN_URL);
    }
  };

  const getPendingDownload = () => {
    try {
      const pending = sessionStorage.getItem(PENDING_DOWNLOAD_STORAGE_KEY);
      return isInternationalDownloadUrl(pending) ? pending : null;
    } catch {
      return null;
    }
  };

  const clearPendingDownload = () => {
    try {
      sessionStorage.removeItem(PENDING_DOWNLOAD_STORAGE_KEY);
    } catch {
      // No action is required when storage is unavailable.
    }
  };

  const openLoginInNewTab = () => {
    // Run synchronously inside the visitor's click event so browsers retain
    // the user gesture and keep the current accio.help tab in place.
    window.open(ACCIO_LOGIN_URL, '_blank', 'noopener,noreferrer');
  };

  const showDownloadResumePrompt = (internationalDownloadUrl) => {
    document.getElementById(DOWNLOAD_RESUME_PROMPT_ID)?.remove();
    if (!isInternationalDownloadUrl(internationalDownloadUrl)) {
      return;
    }

    const prompt = document.createElement('section');
    prompt.id = DOWNLOAD_RESUME_PROMPT_ID;
    prompt.className = 'accio-download-resume-prompt';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'true');
    prompt.setAttribute('aria-label', '继续下载国际版 Accio Work');

    const card = document.createElement('div');
    card.className = 'accio-download-resume-card';

    const title = document.createElement('h2');
    title.textContent = '登录后继续下载国际版';
    const description = document.createElement('p');
    description.textContent = '登录页已在新标签页打开。完成登录后，请返回当前页面，再点击下方按钮获取对应设备的国际版安装包。';
    const actions = document.createElement('div');
    actions.className = 'accio-download-resume-actions';

    const continueButton = document.createElement('button');
    continueButton.type = 'button';
    continueButton.dataset.accioDownloadContinue = 'true';
    continueButton.textContent = '我已登录，继续下载';
    continueButton.addEventListener('click', () => {
      clearPendingDownload();
      prompt.remove();
      window.location.assign(internationalDownloadUrl);
    });

    const reopenLoginButton = document.createElement('button');
    reopenLoginButton.type = 'button';
    reopenLoginButton.dataset.accioDownloadLogin = 'true';
    reopenLoginButton.textContent = '重新打开登录';
    reopenLoginButton.addEventListener('click', openLoginInNewTab);

    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.dataset.accioDownloadDismiss = 'true';
    dismissButton.textContent = '稍后再说';
    dismissButton.addEventListener('click', () => prompt.remove());

    actions.append(continueButton, reopenLoginButton, dismissButton);
    card.append(title, description, actions);
    prompt.append(card);
    document.body.appendChild(prompt);
    continueButton.focus();
  };

  const requestLoginForDownload = (internationalDownloadUrl) => {
    // Scheme 3: the user completes external login in a new tab and manually
    // resumes this same page. This is a convenience gate, not authentication.
    if (!isInternationalDownloadUrl(internationalDownloadUrl)) {
      return;
    }
    try {
      sessionStorage.setItem(PENDING_DOWNLOAD_STORAGE_KEY, internationalDownloadUrl);
    } catch {
      // The login tab can still be opened even if browser storage is unavailable.
    }
    showDownloadResumePrompt(internationalDownloadUrl);
    openLoginInNewTab();
  };

  const isDownloadLabel = (value) => DOWNLOAD_LABEL_PATTERN.test((value || '').replace(/\s+/g, ''));

  const isMobileVisitor = () => {
    const userAgent = navigator.userAgent || '';
    const isPhoneOrTablet = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const isTouchNarrowScreen = window.matchMedia?.('(max-width: 900px) and (pointer: coarse)').matches;
    return isPhoneOrTablet || Boolean(isTouchNarrowScreen);
  };

  const addMobileAppPrompt = () => {
    if (!isMobileVisitor() || document.getElementById(MOBILE_APP_PROMPT_ID)) {
      return;
    }

    const prompt = document.createElement('aside');
    prompt.id = MOBILE_APP_PROMPT_ID;
    prompt.className = 'accio-mobile-app-prompt';
    prompt.setAttribute('aria-label', '立即下载 Accio App');

    const icon = document.createElement('div');
    icon.className = 'accio-mobile-app-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'A';

    const copy = document.createElement('div');
    copy.className = 'accio-mobile-app-copy';
    const title = document.createElement('strong');
    title.textContent = '立即下载 App';
    const detail = document.createElement('span');
    detail.textContent = '登录后即可获取国际版 Accio App';
    copy.append(title, detail);

    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = '立即登录';
    prompt.append(icon, copy, action);
    document.body.appendChild(prompt);
  };

  const getDevicePlatform = () => {
    const userAgent = navigator.userAgent || '';
    const platform = navigator.userAgentData?.platform || navigator.platform || '';
    const signature = `${platform} ${userAgent}`;

    if (/Macintosh|Mac OS X|MacIntel|MacPPC|Mac68K/i.test(signature)) {
      return 'macos';
    }
    if (/Windows/i.test(signature)) {
      return 'windows';
    }
    if (/Android/i.test(signature)) {
      return 'android';
    }
    if (/iPhone|iPad|iPod/i.test(signature)) {
      return 'ios';
    }
    if (/Linux/i.test(signature)) {
      return 'linux';
    }

    return 'other';
  };

  const getMacArchitecture = async () => {
    const userAgentData = navigator.userAgentData;
    if (typeof userAgentData?.getHighEntropyValues === 'function') {
      try {
        const highEntropyValues = await userAgentData.getHighEntropyValues(['architecture']);
        if (/arm/i.test(highEntropyValues.architecture || '')) {
          return 'apple';
        }
        if (/x86|x64/i.test(highEntropyValues.architecture || '')) {
          return 'intel';
        }
      } catch {
        // Some browsers do not expose architecture hints; the picker below remains available.
      }
    }

    return 'unknown';
  };

  const getInternationalDownloadUrl = (platform, macArchitecture) => {
    if (platform === 'windows') {
      return INTERNATIONAL_DOWNLOAD_ROUTES.windows;
    }
    if (platform === 'macos') {
      return macArchitecture === 'intel'
        ? INTERNATIONAL_DOWNLOAD_ROUTES.macIntel
        : INTERNATIONAL_DOWNLOAD_ROUTES.macApple;
    }
    return INTERNATIONAL_DOWNLOAD_ROUTES.windows;
  };

  const updatePlatformDownloadLabels = () => {
    const platform = getDevicePlatform();
    const links = [
      ...document.querySelectorAll('a[href*="work-download.accio.com"]'),
      ...document.querySelectorAll('a[href*="work-download.accio-ai.com"]'),
      ...document.querySelectorAll('a[href*="/work/fixed/download?platform="]'),
      // The homepage contains download cards both inside and outside pricing.
      // They share this route fragment, so do not scope it to #pricing.
      ...document.querySelectorAll('a[href*="langRedirect=1#"]')
    ];

    const applyPlatformCopy = (macArchitecture = 'unknown') => {
      const downloadUrl = getInternationalDownloadUrl(platform, macArchitecture);
      const macDetail = macArchitecture === 'intel'
        ? 'For Intel Mac · macOS 11 or later'
        : macArchitecture === 'apple'
          ? 'For Apple Silicon Mac · macOS 11 or later'
          : 'For macOS 11 or later · Apple Silicon / Intel';
      const copy = platform === 'macos'
        ? { label: 'Download for macOS', detail: macDetail }
        : platform === 'windows'
          ? { label: '下载 Windows 版', detail: '适用于 Windows 10 或更高版本 · 仅支持 64 位' }
          : { label: '下载桌面版', detail: '支持 macOS 和 Windows' };

      [...new Set(links)].forEach((link) => {
        // Downloading from accio.help always starts with the fixed invite login.
        // The original international package route remains on the element for a
        // verified post-login handoff, never as a direct unauthenticated target.
        link.dataset.accioInternationalDownload = downloadUrl;
        link.dataset.accioRequiresLogin = 'true';
        link.href = ACCIO_LOGIN_URL;
        link.removeAttribute('target');
        const label = link.querySelector('span.font-semibold') || link;
        label.textContent = copy.label;
        link.setAttribute('aria-label', copy.label);

        const detail = link.parentElement?.querySelector('span.text-xs');
        if (detail) {
          detail.textContent = copy.detail;
        }
      });

      document.documentElement.dataset.accioPlatform = platform;
      document.documentElement.dataset.accioMacArchitecture = macArchitecture;
    };

    // Render macOS copy synchronously. Safari does not expose architecture
    // hints, but it does expose enough information to identify macOS itself.
    applyPlatformCopy();
    if (platform === 'macos') {
      getMacArchitecture().then(applyPlatformCopy).catch(() => {});
    }
  };

  const isInternationalDownloadUrl = (rawHref) => {
    if (!rawHref) {
      return false;
    }

    try {
      const parsed = new URL(rawHref, window.location.href);
      return parsed.origin === ORIGINAL_ORIGIN
        && parsed.pathname === '/work/fixed/download'
        && parsed.searchParams.has('platform');
    } catch {
      return false;
    }
  };

  const isDownloadRoute = (rawHref) => {
    if (!rawHref) {
      return false;
    }

    return isInternationalDownloadUrl(rawHref)
      || /work-download\.accio(?:-ai)?\.com/i.test(rawHref)
      || /\/work\/fixed\/download\?platform=/i.test(rawHref);
  };

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

    if (isAuthRoute(url)) {
      redirectToLogin();
      return;
    }

    const targetUrl = url;

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
    if (button.closest?.(`#${DOWNLOAD_RESUME_PROMPT_ID}`)) {
      return;
    }

    const label = `${button.getAttribute('aria-label') || ''} ${button.getAttribute('title') || ''}`.toLowerCase();
    const buttonText = `${button.textContent || ''} ${button.getAttribute('value') || ''}`.replace(/\s+/g, ' ').trim();

    if (isDownloadLabel(`${label} ${buttonText}`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestLoginForDownload(getInternationalDownloadUrl(getDevicePlatform(), 'unknown'));
      return;
    }

    if (isAuthLabel(`${label} ${buttonText}`)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      redirectToLogin();
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
    const rawHref = anchor.getAttribute('href') || '';
    const internationalDownloadUrl = anchor.dataset.accioInternationalDownload || rawHref;
    if (anchor.dataset.accioRequiresLogin === 'true' || isDownloadLabel(anchorLabel) || isDownloadRoute(rawHref)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      requestLoginForDownload(isInternationalDownloadUrl(internationalDownloadUrl)
        ? internationalDownloadUrl
        : getInternationalDownloadUrl(getDevicePlatform(), 'unknown'));
      return;
    }

    if (isAuthLabel(anchorLabel) || isAuthRoute(rawHref)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      redirectToLogin();
      return;
    }

    const href = toOriginalUrl(rawHref);
    if (!href || !/^https?:\/\//i.test(href)) {
      return;
    }

    if (isInternationalDownloadUrl(href)) {
      return;
    }

    if (href === ACCIO_LOGIN_URL) {
      event.preventDefault();
      event.stopImmediatePropagation();
      redirectToLogin();
      return;
    }

    if (!href.startsWith(ORIGINAL_ORIGIN)) {
      return;
    }

    event.preventDefault();
    openRemoteView(href, anchor.textContent.trim() || 'Accio Work');
  };

  const boot = () => {
    updatePlatformDownloadLabels();
    addBridgeStyles();
    addMobileAppPrompt();
    const pendingDownload = getPendingDownload();
    if (pendingDownload) {
      showDownloadResumePrompt(pendingDownload);
    }

    // Mobile is intentionally a single-purpose acquisition page: any tap
    // continues through the fixed invite login before a download can proceed.
    document.addEventListener('click', (event) => {
      if (!isMobileVisitor()) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      redirectToLogin();
    }, true);

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
        const action = form.getAttribute('action') || '';
        const submitText = [...form.querySelectorAll('button, input[type="submit"]')]
          .map((control) => `${control.textContent || ''} ${control.value || ''}`)
          .join(' ');
        if (isAuthRoute(action) || isAuthLabel(submitText)) {
          redirectToLogin();
          return;
        }
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
