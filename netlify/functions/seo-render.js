const fs = require('fs');
const path = require('path');

const TEAM_NAMES = {NYY:'Yankees',BOS:'Red Sox',TOR:'Blue Jays',TB:'Rays',BAL:'Orioles',CLE:'Guardians',MIN:'Twins',DET:'Tigers',CWS:'White Sox',KC:'Royals',HOU:'Astros',TEX:'Rangers',SEA:'Mariners',LAA:'Angels',OAK:'Athletics',ATL:'Braves',PHI:'Phillies',NYM:'Mets',MIA:'Marlins',WSH:'Nationals',MIL:'Brewers',CHC:'Cubs',STL:'Cardinals',PIT:'Pirates',CIN:'Reds',LAD:'Dodgers',SD:'Padres',ARI:'D-backs',SF:'Giants',COL:'Rockies'};
const BASE = 'https://www.upperrdecky.com';

function isBot(ua) {
  if (!ua) return false;
  const bots = ['googlebot','bingbot','yandexbot','duckduckbot','slurp','baiduspider','facebookexternalhit','twitterbot','linkedinbot','embedly','quora link preview','showyoubot','outbrain','pinterest','applebot','semrushbot','ahrefs'];
  ua = ua.toLowerCase();
  return bots.some(b => ua.includes(b));
}

function getPlayerData(id) {
  try {
    const p = path.join(__dirname, '..', '..', 'api', 'batters', id, 'summary.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch(e) { return null; }
}

function fmtBa(v) { return v != null && v < 1 ? (''+v.toFixed(3)).replace(/^0/,'') : (v||0).toFixed(3); }

function buildSEOPage(title, description, canonical, jsonLd) {
  let ldScript = jsonLd ? '<script type="application/ld+json">' + JSON.stringify(jsonLd) + '</script>' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="UpperDecky">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@UpperDecky15">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
${ldScript}
<meta http-equiv="refresh" content="0;url=${canonical}#${new URL(canonical).pathname}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<p><a href="${canonical}">View on UpperDecky</a></p>
</body>
</html>`;
}

exports.handler = async function(event) {
  const ua = event.headers['user-agent'] || '';
  if (!isBot(ua)) {
    // Not a bot - serve normal SPA
    return { statusCode: 200, headers: {'Content-Type':'text/html'}, body: fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8') };
  }

  const reqPath = event.path;
  let title, desc, canonical, jsonLd;

  // Player page
  const playerMatch = reqPath.match(/^\/player\/(\d+)/);
  if (playerMatch) {
    const player = getPlayerData(playerMatch[1]);
    if (player) {
      title = player.full_name + ' Stats & Advanced Analytics 2025 | UpperDecky';
      desc = player.full_name + ' (' + player.team + ') 2025 stats: AVG ' + fmtBa(player.ba) + ', ' + (player.home_runs||0) + ' HR, ' + (player.avg_launch_speed||0).toFixed(1) + ' mph exit velo, ' + fmtBa(player.ops) + ' OPS. Free Statcast data.';
      canonical = BASE + '/player/' + playerMatch[1];
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': player.full_name,
        'jobTitle': 'Professional Baseball Player',
        'memberOf': { '@type': 'SportsTeam', 'name': TEAM_NAMES[player.team] || player.team },
        'url': canonical
      };
    }
  }

  // Team page
  const teamMatch = reqPath.match(/^\/team\/([A-Z]+)/);
  if (teamMatch) {
    const abbr = teamMatch[1];
    const name = TEAM_NAMES[abbr] || abbr;
    title = name + ' Roster & Player Stats 2025 | UpperDecky';
    desc = name + ' 2025 roster with advanced Statcast analytics. Exit velocity, barrel rate, xwOBA and more for every ' + name + ' batter. Free.';
    canonical = BASE + '/team/' + abbr;
    jsonLd = { '@context': 'https://schema.org', '@type': 'SportsTeam', 'name': name, 'sport': 'Baseball', 'url': canonical };
  }

  // Players list
  if (reqPath === '/players') {
    title = 'All MLB Players - Stats & Advanced Analytics 2025 | UpperDecky';
    desc = 'Browse 461+ MLB players with advanced Statcast analytics. Sort by batting average, home runs, exit velocity, barrel rate, xwOBA. Free.';
    canonical = BASE + '/players';
  }

  // Compare
  if (reqPath === '/compare') {
    title = 'Compare MLB Players Head to Head | UpperDecky';
    desc = 'Compare any two MLB players side by side with advanced Statcast metrics. Free tool.';
    canonical = BASE + '/compare';
  }

  // Leaderboards
  const lbMatch = reqPath.match(/^\/leaderboard\/([\w-]+)/);
  if (lbMatch) {
    const lbNames = {'due-for':'Due For HR Tracker','thicc-boy':'Thicc Boy Index','plate-discipline':'Plate Discipline Leaderboard','hbp':'HBP Pain Index','full-moon':'Full Moon Effect'};
    const lbDescs = {'due-for':'Which MLB players are most overdue for a home run? Track career AB/HR pace vs current drought.','thicc-boy':'The Thicc Boy Index ranks MLB players by power output relative to body weight.','plate-discipline':'MLB plate discipline rankings - chase rate, whiff rate, and discipline scores.','hbp':'Most hit-by-pitch players in MLB. Career HBP leaders and pain index.','full-moon':'Does the full moon affect batting averages? Probably not. But the data says maybe.'};
    title = (lbNames[lbMatch[1]]||'Leaderboard') + ' 2025 | UpperDecky';
    desc = lbDescs[lbMatch[1]] || 'MLB leaderboard with free advanced analytics.';
    canonical = BASE + '/leaderboard/' + lbMatch[1];
  }

  // Scatter
  if (reqPath === '/scatter') {
    title = 'Size vs Power - MLB Height & Weight vs Home Runs | UpperDecky';
    desc = 'Does being bigger make you hit more home runs? Interactive scatter plots of MLB player height and weight vs HR totals.';
    canonical = BASE + '/scatter';
  }

  // Homepage
  if (reqPath === '/' || !title) {
    title = 'UpperDecky - Free MLB Advanced Analytics & Statcast Data | No Paywalls';
    desc = 'Free MLB advanced analytics. Player stats, barrel rates, exit velocity, xwOBA, live games, and unique leaderboards. No paywalls. No subscriptions. Updated daily.';
    canonical = BASE + '/';
    jsonLd = { '@context': 'https://schema.org', '@type': 'WebSite', 'name': 'UpperDecky', 'url': BASE, 'description': desc };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=3600' },
    body: buildSEOPage(title, desc, canonical, jsonLd)
  };
};
