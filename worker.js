export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url') || "https://www.omg.xxx/videos/93745616/kendra-lynn-gives-her-boyfriend-a-birthday-threesome-with-jojo-kiss/";

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/',
    };

    try {
      // 1. Fetch the Page
      // Note: This will likely trigger a 403 or Cloudflare challenge in a real Worker
      const response = await fetch(targetUrl, { headers });
      const html = await response.text();

      if (response.status !== 200) {
        return new Response(JSON.stringify({
          error: "Failed to fetch page",
          status: response.status,
          hint: "Cloudflare likely blocked this request from the Worker IP."
        }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. Extract Gateway URLs
      // Pattern: /get_file/[SERVER]/[HASH]/[DIR]/[ID]/[FILE]
      const gatewayRegex = /https:\/\/www\.omg\.xxx\/get_file\/[^\s'"]+/g;
      const gatewayMatches = html.match(gatewayRegex) || [];
      const uniqueGateways = [...new Set(gatewayMatches)];

      const results = [];

      // 3. Resolve Redirects
      for (const gatewayUrl of uniqueGateways) {
        // We use redirect: 'manual' to catch the 302 Location header
        const res = await fetch(gatewayUrl, {
          headers: { 'Referer': targetUrl, 'User-Agent': headers['User-Agent'] },
          redirect: 'manual'
        });

        const cdnUrl = res.headers.get('Location');
        
        results.push({
          gateway: gatewayUrl,
          cdn: cdnUrl || "No redirect found",
          status: res.status
        });
      }

      return new Response(JSON.stringify({
        target: targetUrl,
        results: results
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }
};
