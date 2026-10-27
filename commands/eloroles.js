const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, saveGuildConfig } = require('../utils/permissions');
const { successEmbed, errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eloroles')
    .setDescription('Configurar roles automaticos por ELO')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('agregar')
        .setDescription('Agregar rol por rango de ELO')
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol a asignar').setRequired(true))
        .addIntegerOption(opt => opt.setName('min').setDescription('ELO minimo').setRequired(true).setMinValue(0))
        .addIntegerOption(opt => opt.setName('max').setDescription('ELO maximo').setRequired(true).setMinValue(0)))
    .addSubcommand(sub =>
      sub.setName('ver')
        .setDescription('Ver roles por ELO configurados'))
    .addSubcommand(sub =>
      sub.setName('eliminar')
        .setDescription('Eliminar rol por ELO')
        .addRoleOption(opt => opt.setName('rol').setDescription('Rol a eliminar').setRequired(true))),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const guildCfg = getGuildConfig(guildId);
    if (!guildCfg.eloRoles) guildCfg.eloRoles = [];
    
    if (interaction.options.getSubcommand() === 'agregar') {
      const rol = interaction.options.getRole('rol');
      const min = interaction.options.getInteger('min');
      const max = interaction.options.getInteger('max');
      if (min > max) return interaction.reply({ embeds: [errorEmbed('Error', 'El minimo no puede ser mayor al maximo.')], ephemeral: true });
      
      guildCfg.eloRoles.push({ roleId: rol.id, minElo: min, maxElo: max });
      saveGuildConfig(guildId, guildCfg);
      return interaction.reply({ embeds: [successEmbed('Rol agregado', `${rol} asignado a ${min} - ${max} ELO`)], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'ver') {
      if (guildCfg.eloRoles.length === 0) return interaction.reply({ content: 'No hay roles por ELO configurados.', ephemeral: true });
      let desc = '';
      for (const er of guildCfg.eloRoles) {
        desc += `<@&${er.roleId}> | ${er.minElo} - ${er.maxElo} ELO\n`;
      }
      return interaction.reply({ embeds: [successEmbed('Roles por ELO', desc)], ephemeral: true });
    }
    
    if (interaction.options.getSubcommand() === 'eliminar') {
      const rol = interaction.options.getRole('rol');
      guildCfg.eloRoles = guildCfg.eloRoles.filter(er => er.roleId !== rol.id);
      saveGuildConfig(guildId, guildCfg);
      return interaction.reply({ embeds: [successEmbed('Rol eliminado', `${rol} removido de la configuracion`)], ephemeral: true });
    }
  },
};
