const db = require('./db');

function addMatchHistory(wagerId, data) {
  const history = db.read('matchhistory.json', {});
  if (!history[wagerId]) {
    history[wagerId] = data;
    db.write('matchhistory.json', history);
  }
}

function getUserMatchHistory(userId, limit = 10) {
  const history = db.read('matchhistory.json', {});
  const userMatches = [];
  for (const [id, match] of Object.entries(history)) {
    if (match.winners.includes(userId) || match.losers.includes(userId)) {
      userMatches.push({ id, ...match });
    }
  }
  userMatches.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0));
  return userMatches.slice(0, limit);
}

module.exports = { addMatchHistory, getUserMatchHistory };
