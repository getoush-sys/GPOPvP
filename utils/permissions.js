const db = require('./db');

function getGuildConfig(guildId) {
  const guilds = db.read('guilds.json', {});
  if (!guilds[guildId]) {
    guilds[guildId] = {
      ticketCategoryId: null,
      ticketRoles: [],
      logChannelId: null,
      resultsChannelId: null,
      blacklistRoleId: null,
      eloRoles: [],
      autoCloseHours: 24,
      staffRoles: []
    };
    db.write('guilds.json', guilds);
  }
  if (!guilds[guildId].resultsChannelId) guilds[guildId].resultsChannelId = null;
  if (!guilds[guildId].blacklistRoleId) guilds[guildId].blacklistRoleId = null;
  if (!guilds[guildId].eloRoles) guilds[guildId].eloRoles = [];
  if (guilds[guildId].autoCloseHours === undefined) guilds[guildId].autoCloseHours = 24;
  return guilds[guildId];
}

function saveGuildConfig(guildId, config) {
  const guilds = db.read('guilds.json', {});
  guilds[guildId] = config;
  db.write('guilds.json', guilds);
}

function isTicketStaff(member, guildId) {
  if (member.permissions.has('ManageGuild')) return true;
  const guildCfg = getGuildConfig(guildId);
  const roles = guildCfg.ticketRoles || [];
  if (roles.length === 0) {
    if (member.permissions.has('KickMembers') || member.permissions.has('BanMembers')) return true;
    return false;
  }
  return member.roles.cache.some(r => roles.includes(r.id));
}

function isBlacklisted(member, guildId) {
  const guildCfg = getGuildConfig(guildId);
  if (!guildCfg.blacklistRoleId) return false;
  return member.roles.cache.has(guildCfg.blacklistRoleId);
}

module.exports = {
  getGuildConfig,
  saveGuildConfig,
  isTicketStaff,
  isBlacklisted
};
