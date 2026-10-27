const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { isTicketStaff } = require('../utils/permissions');
const { errorEmbed } = require('../utils/embeds');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activewagers')
    .setDescription('Ver wagers activos ahora mismo'),
  async execute(interaction) {
    if (!isTicketStaff(interaction.member, interaction.guild.id)) {
      return interaction.reply({ embeds: [errorEmbed('Sin permisos', 'Solo staff puede usar este comando.')], ephemeral: true });
    }
    
    const wagers = db.read('wagers.json', {});
    const active = [];
    for (const [id, w] of Object.entries(wagers)) {
      if (w.guildId === interaction.guild.id && (w.status === 'pending' || w.status === 'accepted')) {
        active.push({ id, ...w });
      }
    }
    
    if (active.length === 0) {
      return interaction.reply({ content: 'No hay wagers activos.', ephemeral: true });
    }
    
    let desc = '';
    for (const w of active) {
      const status = w.status === 'pending' ? 'Pendiente' : 'Aceptado';
      desc += `**${w.type.toUpperCase()}** | ID: \`${w.id}\` | Estado: ${status}\n`;
      desc += `Desafiantes: ${w.challengerTeam.map(id => `<@${id}>`).join(', ')}\n`;
      desc += `Desafiados: ${w.challengedTeam.map(id => `<@${id}>`).join(', ')}\n`;
      desc += `Canal: <#${w.channelId || 'N/A'}>\n`;
      desc += `Items: ${w.items || 'Ninguno'}\n\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('Wagers Activos')
      .setDescription(desc)
      .setColor(config.colors.warning)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
