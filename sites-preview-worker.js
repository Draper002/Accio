/**
 * Cloudflare Workers entry point for the static Accio Help preview.
 * The site's HTML, JavaScript, and assets are served by the platform ASSETS binding.
 */
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Cloudflare's ASSETS binding does not always infer the index document
    // for the root URL, so make the homepage route explicit.
    if (url.pathname === '/') {
      url.pathname = '/index.html';
    }

    return env.ASSETS.fetch(new Request(url, request));
  },
};

export default worker;
