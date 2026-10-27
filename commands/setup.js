const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { getGuildConfig, saveGuildConfig } = require('../utils/permissions');
const { successEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurar tickets, roles, canal de resultados y mas')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option =>
      option.setName('categoria')
        .setDescription('Categoria donde se crearan los tickets')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('rol1')
        .setDescription('Rol encargado/moderador/hoster')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('rol2')
        .setDescription('Otro rol encargado')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('rol3')
        .setDescription('Otro rol encargado')
        .setRequired(false))
    .addChannelOption(option =>
      option.setName('canal_resultados')
        .setDescription('Canal donde se enviaran resultados y dodges')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('rol_blacklist')
        .setDescription('Rol para usuarios bloqueados de wagers')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('autocierre_horas')
        .setDescription('Horas para autocierre de wager aceptado sin reportar (default 24)')
        .setMinValue(1)
        .setMaxValue(72)
        .setRequired(false))
    .addChannelOption(option =>
      option.setName('logs')
        .setDescription('Canal para logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const guildCfg = getGuildConfig(guildId);
    
    const categoria = interaction.options.getChannel('categoria');
    const rol1 = interaction.options.getRole('rol1');
    const rol2 = interaction.options.getRole('rol2');
    const rol3 = interaction.options.getRole('rol3');
    const canalResultados = interaction.options.getChannel('canal_resultados');
    const rolBlacklist = interaction.options.getRole('rol_blacklist');
    const autocierre = interaction.options.getInteger('autocierre_horas');
    const logs = interaction.options.getChannel('logs');
    
    if (categoria) guildCfg.ticketCategoryId = categoria.id;
    if (canalResultados) guildCfg.resultsChannelId = canalResultados.id;
    if (rolBlacklist) guildCfg.blacklistRoleId = rolBlacklist.id;
    if (autocierre) guildCfg.autoCloseHours = autocierre;
    if (logs) guildCfg.logChannelId = logs.id;
    
    const roles = [];
    if (rol1) roles.push(rol1.id);
    if (rol2) roles.push(rol2.id);
    if (rol3) roles.push(rol3.id);
    if (roles.length > 0) guildCfg.ticketRoles = roles;
    
    saveGuildConfig(guildId, guildCfg);
    
    await interaction.reply({
      embeds: [successEmbed('Configuracion guardada',
        `Categoria: ${categoria ? categoria.name : (guildCfg.ticketCategoryId ? `<#${guildCfg.ticketCategoryId}>` : 'Sin configurar')}\n` +
        `Roles encargados: ${guildCfg.ticketRoles.length ? guildCfg.ticketRoles.map(r=>`<@&${r}>`).join(', ') : 'Permisos (Kick/Ban/ManageGuild)'}\n` +
        `Canal de resultados: ${canalResultados ? canalResultados.name : (guildCfg.resultsChannelId ? `<#${guildCfg.resultsChannelId}>` : 'Sin configurar')}\n` +
        `Rol Blacklist: ${rolBlacklist ? rolBlacklist.name : (guildCfg.blacklistRoleId ? `<@&${guildCfg.blacklistRoleId}>` : 'Sin configurar')}\n` +
        `Autocierre: ${guildCfg.autoCloseHours} horas\n` +
        `Canal logs: ${logs ? logs.name : (guildCfg.logChannelId ? `<#${guildCfg.logChannelId}>` : 'Sin configurar')}`
      )],
      ephemeral: true
    });
  },
};
