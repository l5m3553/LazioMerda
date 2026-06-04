const https = require('https');

exports.handler = async (event) => {
  try {
    const data = await fetchStandings();
    
    const roma = data.find(t => t.team.name.includes('Roma'));
    const lazio = data.find(t => t.team.name.includes('Lazio'));

    if (!roma || !lazio) throw new Error('Squadre non trovate');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      },
      body: JSON.stringify({
        roma: {
          position: roma.rank,
          points: roma.points,
          wins: roma.all.win,
          draws: roma.all.draw,
          losses: roma.all.lose,
          played: roma.all.played,
          form: roma.form,
          next: null
        },
        lazio: {
          position: lazio.rank,
          points: lazio.points,
          wins: lazio.all.win,
          draws: lazio.all.draw,
          losses: lazio.all.lose,
          played: lazio.all.played,
          form: lazio.form,
          next: null
        },
        gap: roma.points - lazio.points,
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

function fetchStandings() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'v3.football.api-sports.io',
      path: '/standings?league=135&season=2025',
      method: 'GET',
      headers: {
        'x-apisports-key': process.env.FOOTBALL_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const standings = parsed.response[0][0].league.standings[0];
          resolve(standings);
        } catch(e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.end();
  });
}
