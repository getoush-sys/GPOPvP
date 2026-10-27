const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getUserElo } = require('../utils/elo');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Ver tu perfil de ELO')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario a ver (opcional)')
        .setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const users = db.read('users.json', {});
    const userData = getUserElo(users, target.id);
    db.write('users.json', users);
    
    const total = (userData.wins || 0) + (userData.losses || 0);
    const winrate = total > 0 ? ((userData.wins || 0) / total * 100).toFixed(1) : '0.0';
    
    const embed = new EmbedBuilder()
      .setTitle(`Perfil de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(config.colors.main)
      .addFields(
        { name: 'ELO', value: `**${userData.elo}**`, inline: true },
        { name: 'Victorias', value: `**${userData.wins || 0}**`, inline: true },
        { name: 'Derrotas', value: `**${userData.losses || 0}**`, inline: true },
        { name: 'Winrate', value: `**${winrate}%** (${total} partidas)`, inline: true },
        { name: 'Wager Dodges', value: `**${userData.dodges || 0}**`, inline: true }
      )
      .setFooter({ text: 'GPO PvP | ELO System' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};
