const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Ver top ELO del servidor'),
  async execute(interaction) {
    const users = db.read('users.json', {});
    const entries = Object.entries(users)
      .filter(([id, data]) => (data.wins || 0) + (data.losses || 0) > 0 || data.elo !== config.elo.start)
      .map(([id, data]) => ({ id, elo: data.elo || config.elo.start, wins: data.wins || 0, losses: data.losses || 0 }))
      .sort((a,b) => b.elo - a.elo)
      .slice(0, 10);
    
    if (entries.length === 0) {
      return interaction.reply({ content: 'Aún no hay partidas registradas.', ephemeral: true });
    }
    
    let description = '';
    entries.forEach((entry, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i+1}.**`;
      const total = entry.wins + entry.losses;
      const wr = total > 0 ? ((entry.wins/total)*100).toFixed(1) : '0.0';
      description += `${medal} <@${entry.id}> • **${entry.elo} ELO** • ${entry.wins}W/${entry.losses}L (${wr}%)\n`;
    });
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 TOP ELO - GPO PvP')
      .setDescription(description)
      .setColor(config.colors.main)
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'GPO PvP Hub' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
