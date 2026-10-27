const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wagerpanel')
    .setDescription('Enviar el panel para retar a wager')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('GPO PvP | WAGERS')
      .setDescription(
        'Pulsa el boton correspondiente para crear tu wager.\n\n' +
        '1v1 - Reto individual\n' +
        '2v2 - Reto por equipos\n\n' +
        'Se abrira un ticket privado con los retados.\n' +
        'El equipo retado debera aceptar o rechazar.\n\n' +
        'Items apostados: se indican en el formulario al crear el wager.\n\n' +
        'ELO: Inicio 800 | Ganas mas al vencer a alguien con mayor ELO | Max +20 por victoria\n' +
        'DODGE: Al rechazar pierdes (Diferencia de ELO / 2)'
      )
      .setColor(config.colors.main)
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'GPO PvP Hub' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('wager_create_1v1').setLabel('Retar 1v1').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('wager_create_2v2').setLabel('Retar 2v2').setStyle(ButtonStyle.Success)
      );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Panel enviado correctamente.', ephemeral: true });
  },
};
