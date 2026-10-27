const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function mainEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(config.colors.main)
    .setTimestamp();
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(config.colors.success)
    .setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(config.colors.danger)
    .setTimestamp();
}

function warningEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(config.colors.warning)
    .setTimestamp();
}

module.exports = {
  mainEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed
};
