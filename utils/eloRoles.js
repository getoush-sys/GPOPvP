const db = require('./db');
const { getGuildConfig } = require('./permissions');
const { getUserElo } = require('./elo');

async function checkAndAssignEloRoles(guild, userId) {
  try {
    const guildCfg = getGuildConfig(guild.id);
    const eloRoles = guildCfg.eloRoles || [];
    if (eloRoles.length === 0) return;
    
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    
    const users = db.read('users.json', {});
    const userData = getUserElo(users, userId);
    const elo = userData.elo;
    
    // Remove roles not matching
    for (const er of eloRoles) {
      if (member.roles.cache.has(er.roleId)) {
        if (elo < er.minElo || elo > er.maxElo) {
          await member.roles.remove(er.roleId).catch(() => {});
        }
      }
    }
    
    // Add matching role
    for (const er of eloRoles) {
      if (elo >= er.minElo && elo <= er.maxElo) {
        if (!member.roles.cache.has(er.roleId)) {
          await member.roles.add(er.roleId).catch(() => {});
        }
        break;
      }
    }
  } catch (e) {
    console.error('Error checking elo roles:', e);
  }
}

module.exports = { checkAndAssignEloRoles };
