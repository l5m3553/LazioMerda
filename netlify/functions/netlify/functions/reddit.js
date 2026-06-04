const https = require('https');

exports.handler = async (event) => {
  try {
    const [posts, lazio] = await Promise.all([
      fetchPosts('ASRoma', 'hot', 8),
      fetchPosts('ASRoma', 'new', 20)
    ]);

    const filtered = lazio
      .filter(p => {
        const text = (p.title + ' ' + p.selftext).toLowerCase();
        return text.includes('lazio') || 
               text.includes('derby') || 
               text.includes('derby della capitale');
      })
      .slice(0, 4);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900'
      },
      body: JSON.stringify({
        top: posts.map(p => ({
          title: p.title,
          score: p.score,
          comments: p.num_comments,
          url: 'https://reddit.com' + p.permalink,
          flair: p.link_flair_text || null,
          created: p.created_utc
        })),
        derby: filtered.map(p => ({
          title: p.title,
          score: p.score,
          comments: p.num_comments,
          url: 'https://reddit.com' + p.permalink,
          created: p.created_utc
        })),
        updated: new Date().toISOString()
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

function fetchPosts(subreddit, sort, limit) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.reddit.com',
      path: `/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'laziomerda-bot/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.data.children.map(c => c.data));
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
