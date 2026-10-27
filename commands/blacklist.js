const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, isTicketStaff } = require('../utils/permissions');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Bloquear/desbloquear usuario de crear wagers')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Añadir usuario a blacklist')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(opt => opt.setName('razon').setDescription('Razon').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Quitar usuario de blacklist')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('check')
        .setDescription('Ver si un usuario esta en blacklist')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))),
  async execute(interaction) {
    if (!isTicketStaff(interaction.member, interaction.guild.id) && !interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ embeds: [errorEmbed('Sin permisos', 'No tienes permisos para usar este comando.')], ephemeral: true });
    }
    
    const guildCfg = getGuildConfig(interaction.guild.id);
    if (!guildCfg.blacklistRoleId) {
      return interaction.reply({ embeds: [errorEmbed('Sin configurar', 'Configura el rol blacklist con /setup')], ephemeral: true });
    }
    
    const role = interaction.guild.roles.cache.get(guildCfg.blacklistRoleId);
    if (!role) return interaction.reply({ embeds: [errorEmbed('Error', 'Rol blacklist no encontrado.')], ephemeral: true });
    
    if (interaction.options.getSubcommand() === 'add') {
      const user = interaction.options.getUser('usuario');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado en el servidor.', ephemeral: true });
      if (member.roles.cache.has(role.id)) return interaction.reply({ content: 'Este usuario ya esta en blacklist.', ephemeral: true });
      await member.roles.add(role).catch(() => {});
      const razon = interaction.options.getString('razon') || 'Sin razon';
      return interaction.reply({ embeds: [successEmbed('Blacklist', `${user} añadido a blacklist.\nRazon: ${razon}`)], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'remove') {
      const user = interaction.options.getUser('usuario');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado en el servidor.', ephemeral: true });
      if (!member.roles.cache.has(role.id)) return interaction.reply({ content: 'Este usuario no esta en blacklist.', ephemeral: true });
      await member.roles.remove(role).catch(() => {});
      return interaction.reply({ embeds: [successEmbed('Blacklist', `${user} removido de blacklist.`)], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'check') {
      const user = interaction.options.getUser('usuario');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) return interaction.reply({ content: 'Usuario no encontrado en el servidor.', ephemeral: true });
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [errorEmbed('Blacklist', `${user} SI esta en blacklist.`)], ephemeral: true });
      } else {
        return interaction.reply({ embeds: [successEmbed('Blacklist', `${user} NO esta en blacklist.`)], ephemeral: true });
      }
    }
  },
};
