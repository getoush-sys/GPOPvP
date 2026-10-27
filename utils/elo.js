const config = require('../config.json');

function expectedScore(ratingA, ratingB) {
  const scale = config.elo.scale;
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / scale));
}

function calculateWagerGain(winnerRating, loserRating) {
  const k = config.elo.k;
  const maxGain = config.elo.maxWinGain;
  const exp = expectedScore(winnerRating, loserRating);
  let gain = Math.round(k * (1 - exp));
  if (gain > maxGain) gain = maxGain;
  if (gain < 1) gain = 1;
  return gain;
}

function calculateDodgeLoss(challengerRating, challengedRating) {
  const diff = Math.abs(challengerRating - challengedRating);
  let loss = Math.round(diff * config.elo.dodgeFactor);
  if (loss < config.elo.dodgeMin) loss = config.elo.dodgeMin;
  return loss;
}

function getUserElo(users, userId) {
  if (!users[userId]) {
    users[userId] = {
      elo: config.elo.start,
      wins: 0,
      losses: 0,
      dodges: 0
    };
  }
  return users[userId];
}

module.exports = {
  expectedScore,
  calculateWagerGain,
  calculateDodgeLoss,
  getUserElo
};
