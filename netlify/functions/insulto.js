const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const response = await makeRequest(prompt);
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ content: response }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ content: 'DEBUG ERROR: ' + err.message }),
    };
  }
};

function makeRequest(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(JSON.stringify(parsed.error)));
          else if (parsed.content && parsed.content[0]) resolve(parsed.content[0].text);
          else reject(new Error('Unexpected response: ' + data.substring(0, 200)));
        } catch(e) { reject(new Error('Parse error: ' + data.substring(0, 200))); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
