const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { isTicketStaff } = require('../utils/permissions');
const { errorEmbed } = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('forceend')
    .setDescription('Forzar cierre de un ticket de wager (Solo staff)')
    .addStringOption(option =>
      option.setName('wagerid')
        .setDescription('ID del wager')
        .setRequired(true)),
  async execute(interaction) {
    if (!isTicketStaff(interaction.member, interaction.guild.id)) {
      return interaction.reply({ embeds: [errorEmbed('Sin permisos', 'Solo moderadores/hosters/encargados pueden usar este comando.')], ephemeral: true });
    }
    
    const wagerId = interaction.options.getString('wagerid');
    const wagers = db.read('wagers.json', {});
    const wager = wagers[wagerId];
    
    if (!wager) {
      return interaction.reply({ embeds: [errorEmbed('No encontrado', 'No existe ese wager.')], ephemeral: true });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    wager.status = 'forceclosed';
    wager.forceClosedBy = interaction.user.id;
    wagers[wagerId] = wager;
    db.write('wagers.json', wagers);
    
    try {
      const channel = interaction.guild.channels.cache.get(wager.channelId);
      if (channel) {
        await channel.send(`⚠️ Este ticket ha sido cerrado a la fuerza por ${interaction.user.tag}.`);
        setTimeout(() => channel.delete().catch(() => {}), 5000);
      }
    } catch (e) {
      console.error(e);
    }
    
    await interaction.editReply({ content: 'Ticket cerrado a la fuerza.' });
  },
};
