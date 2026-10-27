const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEloHistory } = require('../utils/eloHistory');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('elohistory')
    .setDescription('Ver historial de cambios de ELO')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a ver')
        .setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const history = getEloHistory(target.id, 10);
    
    if (history.length === 0) {
      return interaction.reply({ content: `${target.username} no tiene historial de ELO.`, ephemeral: true });
    }
    
    let desc = '';
    for (const h of history) {
      const change = h.change >= 0 ? `+${h.change}` : `${h.change}`;
      desc += `**${h.reason}** | ${change} ELO | ${h.before} -> ${h.after}\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Historial ELO - ${target.username}`)
      .setDescription(desc)
      .setColor(config.colors.main)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Ultimos 10 cambios' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
