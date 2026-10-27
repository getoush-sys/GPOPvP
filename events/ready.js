const { checkAutoClose } = require('../utils/autoclose');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`${client.user.tag} is online!`);
    console.log('GPO PvP Bot - Wagers + ELO + Tickets');
    client.user.setActivity('GPO PvP | /wagerpanel', { type: 3 });
    
    // Check autoclose every 30 minutes
    setInterval(() => {
      checkAutoClose(client).catch(() => {});
    }, 30 * 60 * 1000);
    checkAutoClose(client).catch(() => {});
  },
};
