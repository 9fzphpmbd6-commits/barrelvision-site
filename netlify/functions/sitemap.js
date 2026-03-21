const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  const BASE = 'https://www.upperrdecky.com';
  const today = new Date().toISOString().split('T')[0];
  
  // Read batters data
  let batters = [];
  try {
    const battersPath = path.join(__dirname, '..', '..', 'api', 'batters.json');
    const data = fs.readFileSync(battersPath, 'utf8');
    batters = JSON.parse(data);
  } catch(e) {
    console.error('Failed to read batters.json:', e.message);
  }

  // Team abbreviations
  const teams = ['NYY','BOS','TOR','TB','BAL','CLE','MIN','DET','CWS','KC','HOU','TEX','SEA','LAA','OAK','ATL','PHI','NYM','MIA','WSH','MIL','CHC','STL','PIT','CIN','LAD','SD','ARI','SF','COL'];

  // Leaderboard types
  const leaderboards = ['due-for','thicc-boy','plate-discipline','hbp','full-moon'];

  let urls = [];

  // Homepage
  urls.push({loc: BASE + '/', priority: '1.0', changefreq: 'daily'});

  // Static pages
  urls.push({loc: BASE + '/players', priority: '0.9', changefreq: 'daily'});
  urls.push({loc: BASE + '/compare', priority: '0.7', changefreq: 'weekly'});
  urls.push({loc: BASE + '/scatter', priority: '0.6', changefreq: 'weekly'});
  urls.push({loc: BASE + '/barrel-or-bust.html', priority: '0.6', changefreq: 'weekly'});

  // Team pages
  teams.forEach(function(t) {
    urls.push({loc: BASE + '/team/' + t, priority: '0.8', changefreq: 'daily'});
  });

  // Leaderboard pages
  leaderboards.forEach(function(lb) {
    urls.push({loc: BASE + '/leaderboard/' + lb, priority: '0.7', changefreq: 'daily'});
  });

  // Player pages
  batters.forEach(function(b) {
    const slug = b.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    urls.push({loc: BASE + '/player/' + b.batter_id + '/' + slug, priority: '0.6', changefreq: 'weekly'});
  });

  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function(u) {
    xml += '  <url>\n';
    xml += '    <loc>' + u.loc + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>' + u.changefreq + '</changefreq>\n';
    xml += '    <priority>' + u.priority + '</priority>\n';
    xml += '  </url>\n';
  });
  xml += '</urlset>';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    },
    body: xml
  };
};
