export default async function handler(req, res) {
  const { endpoint } = req.query;
  
  if (!endpoint || typeof endpoint !== 'string') {
    return res.status(400).json({ error: 'Missing endpoint parameter' });
  }

  // Ensure endpoint starts with a slash
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
        'Accept': 'application/json',
        'X-N8N-API-KEY': apiKey
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(`${targetUrl}${safeEndpoint}`, fetchOptions);
    
    // N8n API typically returns JSON, but we should handle text just in case
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      const text = await response.text();
      return res.status(response.status).send(text);
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to fetch from N8n API' });
  }
}
