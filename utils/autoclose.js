const db = require('./db');
const { getGuildConfig } = require('./permissions');
const tickets = require('./tickets');

async function checkAutoClose(client) {
  try {
    const wagers = db.read('wagers.json', {});
    const now = Date.now();
    
    for (const [wagerId, wager] of Object.entries(wagers)) {
      if (wager.status !== 'accepted') continue;
      if (!wager.guildId) continue;
      
      const guildCfg = getGuildConfig(wager.guildId);
      const hours = guildCfg.autoCloseHours || 24;
      const maxTime = hours * 60 * 60 * 1000;
      
      if (now - (wager.acceptedAt || wager.createdAt) > maxTime) {
        try {
          const guild = await client.guilds.fetch(wager.guildId);
          const channel = guild.channels.cache.get(wager.channelId);
          if (channel) {
            await channel.send(`Auto-cierre: Este wager ha estado aceptado por mas de ${hours} horas sin ser reportado. Cerrando ticket.`);
            setTimeout(() => channel.delete().catch(() => {}), 5000);
          }
        } catch (e) {}
        
        wager.status = 'autoclosed';
        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);
      }
    }
  } catch (e) {
    console.error('AutoClose error:', e);
  }
}

module.exports = { checkAutoClose };
