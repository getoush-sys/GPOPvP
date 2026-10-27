const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('./permissions');

async function createWagerTicket(guild, creator, opponents, challengerTeam, challengedTeam, wagerId) {
  const guildCfg = getGuildConfig(guild.id);
  const categoryId = guildCfg.ticketCategoryId;
  
  const allMembers = [...challengerTeam, ...challengedTeam];
  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    }
  ];

  for (const member of allMembers) {
    permissionOverwrites.push({
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  // add staff roles
  const staffRoles = guildCfg.ticketRoles || [];
  for (const roleId of staffRoles) {
    const role = guild.roles.cache.get(roleId);
    if (role) {
      permissionOverwrites.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      });
    }
  }

  const options = {
    name: `wager-${wagerId}`,
    type: ChannelType.GuildText,
    permissionOverwrites
  };
  
  if (categoryId) {
    const cat = guild.channels.cache.get(categoryId);
    if (cat && cat.type === ChannelType.GuildCategory) {
      options.parent = categoryId;
    }
  }

  const channel = await guild.channels.create(options);
  return channel;
}

module.exports = {
  createWagerTicket
};
