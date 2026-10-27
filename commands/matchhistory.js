const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserMatchHistory } = require('../utils/matchHistory');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matchhistory')
    .setDescription('Ver historial de wagers')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a ver')
        .setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const history = getUserMatchHistory(target.id, 10);
    
    if (history.length === 0) {
      return interaction.reply({ content: `${target.username} no tiene historial de wagers.`, ephemeral: true });
    }
    
    let desc = '';
    for (const match of history) {
      const won = match.winners.includes(target.id);
      const result = won ? 'VICTORIA' : 'DERROTA';
      const color = won ? '+' : '-';
      const eloChange = match.eloGain || 0;
      desc += `**${match.type.toUpperCase()}** | ${result} | ${color}${eloChange} ELO\n`;
      desc += `Ganadores: ${match.winners.map(id => `<@${id}>`).join(', ')}\n`;
      desc += `Perdedores: ${match.losers.map(id => `<@${id}>`).join(', ')}\n`;
      desc += `Items: ${match.items || 'Ninguno'}\n`;
      desc += `---\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`Historial de ${target.username}`)
      .setDescription(desc)
      .setColor(won => won ? config.colors.success : config.colors.danger)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Ultimos 10 wagers' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
