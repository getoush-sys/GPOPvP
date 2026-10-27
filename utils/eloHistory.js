const db = require('./db');

function addEloHistory(userId, data) {
  const eloHistory = db.read('elohistory.json', {});
  if (!eloHistory[userId]) eloHistory[userId] = [];
  eloHistory[userId].push({
    ...data,
    timestamp: Date.now()
  });
  // Keep last 50
  if (eloHistory[userId].length > 50) {
    eloHistory[userId] = eloHistory[userId].slice(-50);
  }
  db.write('elohistory.json', eloHistory);
}

function getEloHistory(userId, limit = 10) {
  const eloHistory = db.read('elohistory.json', {});
  const history = eloHistory[userId] || [];
  return history.slice(-limit).reverse();
}

module.exports = { addEloHistory, getEloHistory };
