import { timingSafeEqual } from 'node:crypto';

// Authenticated n8n proxy.
// Hardening:
//  - Every request must carry the shared app password (x-app-auth header),
//    checked with a constant-time compare. Without it the n8n API key is never
//    used and the request is rejected (401). This is what gates the public app.
//  - The endpoint is locked to the n8n public REST API (/api/v1/...), with path
//    traversal blocked, so the proxy can't be abused as a general-purpose relay.
//  - The injected API key is never returned to the client.
const ALLOWED_PREFIX = '/api/v1/';

function safeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length === 0) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return res.status(500).json({ error: 'APP_PASSWORD is not configured on the server' });
  }
  if (!safeMatch(req.headers['x-app-auth'], appPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { endpoint } = req.query;
  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Only allow the n8n public REST API. Reject path traversal and any attempt
  // to point the proxy at a different host or path.
  if (!safeEndpoint.startsWith(ALLOWED_PREFIX) || safeEndpoint.includes('..')) {
    return res.status(403).json({ error: 'Endpoint not allowed' });
  }

  const targetUrl = process.env.N8N_URL || 'https://n8n.workflowsolution.org';
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'N8N_API_KEY is not configured on the server' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        Accept: 'application/json',
        'X-N8N-API-KEY': apiKey,
      },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(`${targetUrl}${safeEndpoint}`, fetchOptions);
    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await upstream.json();
      return res.status(upstream.status).json(data);
    }
    const text = await upstream.text();
    res.setHeader('Content-Type', contentType || 'text/plain');
    return res.status(upstream.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'Upstream fetch failed' });
  }
}
