const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wager')
    .setDescription('Abrir panel de wagers 1v1 / 2v2'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('⚔️ GPO PvP - WAGERS')
      .setDescription('**Sistema de Wagers / Duelos**\n\nSelecciona el tipo de duelo para retar a otro jugador/equipo.\n\n- **1v1** - Duelo individual\n- **2v2** - Duelo por equipos\n\nAl crear el wager se abrirá un ticket privado con el/los retados. Ahí se aceptará/rechazará el duelo.\n\n**Items apostados:** Puedes ponerlos en el formulario al crear el wager.\n\n**ELO:** Empiezas en 800 | Ganas más si le ganas a alguien con más ELO | Máx +20 por victoria\n\n**Dodge:** Si rechazas un wager, pierdes (diferencia de ELO / 2)')
      .setColor(config.colors.main)
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'GPO PvP Hub' })
      .setTimestamp();
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('wager_create_1v1').setLabel('Crear Wager 1v1').setStyle(ButtonStyle.Primary).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId('wager_create_2v2').setLabel('Crear Wager 2v2').setStyle(ButtonStyle.Success).setEmoji('🤝')
      );
    
    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
