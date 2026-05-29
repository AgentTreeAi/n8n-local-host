export default async function handler(req, res) {
  const { endpoint } = req.query;

  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
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
    return res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
}
