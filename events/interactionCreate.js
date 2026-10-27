const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const db = require('../utils/db');
const { getUserElo, calculateWagerGain, calculateDodgeLoss } = require('../utils/elo');
const { createWagerTicket } = require('../utils/tickets');
const { isTicketStaff, getGuildConfig, isBlacklisted } = require('../utils/permissions');
const { successEmbed, errorEmbed } = require('../utils/embeds');
const { addMatchHistory } = require('../utils/matchHistory');
const { addEloHistory } = require('../utils/eloHistory');
const { checkAndAssignEloRoles } = require('../utils/eloRoles');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        const reply = { content: 'Hubo un error al ejecutar este comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId === 'wager_create_1v1') {
        if (isBlacklisted(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'No puedes crear wagers, estas en blacklist.', ephemeral: true });
        }
        const modal = new ModalBuilder()
          .setCustomId('wager_modal_1v1')
          .setTitle('Crear Wager 1v1');

        const opponent = new TextInputBuilder()
          .setCustomId('opponent')
          .setLabel('ID del oponente a retar')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('123456789012345678');

        const items = new TextInputBuilder()
          .setCustomId('items')
          .setLabel('Items apostados (opcional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder('Escribe los items que se apostaran');

        modal.addComponents(
          new ActionRowBuilder().addComponents(opponent),
          new ActionRowBuilder().addComponents(items)
        );

        await interaction.showModal(modal);
        return;
      }

      if (customId === 'wager_create_2v2') {
        if (isBlacklisted(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'No puedes crear wagers, estas en blacklist.', ephemeral: true });
        }
        const modal = new ModalBuilder()
          .setCustomId('wager_modal_2v2')
          .setTitle('Crear Wager 2v2');

        const teammate = new TextInputBuilder()
          .setCustomId('teammate')
          .setLabel('ID de tu compañero')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('123456789012345678');

        const opp1 = new TextInputBuilder()
          .setCustomId('opp1')
          .setLabel('ID oponente 1')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('123456789012345678');

        const opp2 = new TextInputBuilder()
          .setCustomId('opp2')
          .setLabel('ID oponente 2')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('123456789012345678');

        const items = new TextInputBuilder()
          .setCustomId('items')
          .setLabel('Items apostados (opcional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setPlaceholder('Escribe los items que se apostaran');

        modal.addComponents(
          new ActionRowBuilder().addComponents(teammate),
          new ActionRowBuilder().addComponents(opp1),
          new ActionRowBuilder().addComponents(opp2),
          new ActionRowBuilder().addComponents(items)
        );

        await interaction.showModal(modal);
        return;
      }

      if (customId.startsWith('wager_accept_')) {
        const wagerId = customId.split('_')[2];
        const wagers = db.read('wagers.json', {});
        const wager = wagers[wagerId];
        if (!wager) return interaction.reply({ content: 'Wager no encontrado.', ephemeral: true });
        if (wager.status !== 'pending') return interaction.reply({ content: 'Este wager ya fue respondedido.', ephemeral: true });
        if (!wager.challenged.includes(interaction.user.id)) return interaction.reply({ content: 'Solo el equipo retado puede aceptar.', ephemeral: true });
        if (wager.accepted.includes(interaction.user.id)) return interaction.reply({ content: 'Ya has aceptado este wager.', ephemeral: true });

        wager.accepted.push(interaction.user.id);
        if (wager.accepted.length === wager.challenged.length) {
          wager.status = 'accepted';
          wager.acceptedAt = Date.now();
          wagers[wagerId] = wager;
          db.write('wagers.json', wagers);
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder().setCustomId(`wager_win_challenger_${wagerId}`).setLabel('Ganaron Desafiantes').setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId(`wager_win_challenged_${wagerId}`).setLabel('Ganaron Desafiados').setStyle(ButtonStyle.Danger)
            );
          await interaction.update({ content: `Wager aceptado.\n\nItems apostados: ${wager.items || 'Ninguno'}\n\nEsperando a que un encargado marque el resultado.`, components: [row] });
        } else {
          wagers[wagerId] = wager;
          db.write('wagers.json', wagers);
          await interaction.reply({ content: 'Has aceptado. Falta que acepte el resto del equipo retado.', ephemeral: true });
        }
        return;
      }

      if (customId.startsWith('wager_decline_')) {
        const wagerId = customId.split('_')[2];
        const wagers = db.read('wagers.json', {});
        const wager = wagers[wagerId];
        if (!wager) return interaction.reply({ content: 'Wager no encontrado.', ephemeral: true });
        if (wager.status !== 'pending') return interaction.reply({ content: 'Este wager ya fue respondedido.', ephemeral: true });
        if (!wager.challenged.includes(interaction.user.id)) return interaction.reply({ content: 'Solo el equipo retado puede rechazar.', ephemeral: true });

        const users = db.read('users.json', {});
        const challengerAvg = wager.challengerTeam.reduce((a, b) => a + getUserElo(users, b).elo, 0) / wager.challengerTeam.length;
        const challengedAvg = wager.challengedTeam.reduce((a, b) => a + getUserElo(users, b).elo, 0) / wager.challengedTeam.length;
        const loss = calculateDodgeLoss(challengerAvg, challengedAvg);

        for (const uid of wager.challengedTeam) {
          const u = getUserElo(users, uid);
          const before = u.elo;
          u.elo = Math.max(0, u.elo - loss);
          u.dodges = (u.dodges || 0) + 1;
          users[uid] = u;
          addEloHistory(uid, { change: -loss, before, after: u.elo, reason: 'Wager Dodge' });
        }
        db.write('users.json', users);

        wager.status = 'declined';
        wager.dodgedBy = interaction.user.id;
        wager.dodgeLoss = loss;
        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        await interaction.update({ content: `Wager rechazado por ${interaction.user.tag}.\n\nEl equipo retado pierde ${loss} ELO por dodge.\n\nEste ticket se cerrara en 10 segundos.`, components: [] });

        try {
          const guildCfg = getGuildConfig(interaction.guild.id);
          if (guildCfg.resultsChannelId) {
            const resChannel = interaction.guild.channels.cache.get(guildCfg.resultsChannelId);
            if (resChannel) {
              const resEmbed = new EmbedBuilder()
                .setTitle('WAGER DODGE')
                .setColor(config.colors.danger)
                .addFields(
                  { name: 'Tipo', value: wager.type.toUpperCase(), inline: true },
                  { name: 'Rechazado por', value: `<@${interaction.user.id}>`, inline: true },
                  { name: 'Perdida por dodge', value: `-${loss} ELO`, inline: true },
                  { name: 'Desafiantes', value: wager.challengerTeam.map(id => `<@${id}>`).join('\n'), inline: true },
                  { name: 'Desafiados', value: wager.challengedTeam.map(id => `<@${id}>`).join('\n'), inline: true },
                  { name: 'Items apostados', value: wager.items || 'Ninguno', inline: false }
                )
                .setFooter({ text: `Wager ID: ${wagerId}` })
                .setTimestamp();
              await resChannel.send({ embeds: [resEmbed] });
            }
          }
        } catch (e) { console.error(e); }

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 10000);
        return;
      }

      if (customId.startsWith('wager_win_challenger_') || customId.startsWith('wager_win_challenged_')) {
        if (!isTicketStaff(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'Solo moderadores/hosters/encargados pueden reportar el resultado.', ephemeral: true });
        }
        const wagerId = customId.split('_').pop();
        const wagers = db.read('wagers.json', {});
        const wager = wagers[wagerId];
        if (!wager) return interaction.reply({ content: 'Wager no encontrado.', ephemeral: true });
        if (wager.status !== 'accepted') return interaction.reply({ content: 'Este wager no se encuentra aceptado.', ephemeral: true });

        // Show modal for proof link
        const modal = new ModalBuilder()
          .setCustomId(`wager_result_modal_${wagerId}_${customId.includes('challenger') ? 'challenger' : 'challenged'}`)
          .setTitle('Reportar Resultado');

        const proof = new TextInputBuilder()
          .setCustomId('proof')
          .setLabel('Link de prueba (opcional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('https://...');

        modal.addComponents(new ActionRowBuilder().addComponents(proof));
        await interaction.showModal(modal);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'wager_modal_1v1') {
        if (isBlacklisted(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'No puedes crear wagers, estas en blacklist.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const opponentId = interaction.fields.getTextInputValue('opponent').trim();
        const items = interaction.fields.getTextInputValue('items').trim() || 'Ninguno';

        if (!/^\d{17,20}$/.test(opponentId)) {
          return interaction.editReply({ content: 'ID invalido. Debe ser un ID numerico de Discord.' });
        }
        if (opponentId === interaction.user.id) {
          return interaction.editReply({ content: 'No puedes retarte a ti mismo.' });
        }

        // Check last rival
        const wagers = db.read('wagers.json', {});
        for (const [id, w] of Object.entries(wagers)) {
          if ((w.challengerTeam.includes(interaction.user.id) && w.challengedTeam.includes(opponentId)) || 
              (w.challengedTeam.includes(interaction.user.id) && w.challengerTeam.includes(opponentId))) {
            if (w.status === 'finished' || w.status === 'declined') {
              // allow if different wager
            }
          }
        }

        const users = db.read('users.json', {});
        getUserElo(users, interaction.user.id);
        getUserElo(users, opponentId);
        db.write('users.json', users);

        const wagerId = Math.random().toString(36).substr(2, 9);
        const challengerTeam = [interaction.user.id];
        const challengedTeam = [opponentId];

        const wager = {
          id: wagerId,
          type: '1v1',
          guildId: interaction.guild.id,
          channelId: null,
          challenger: interaction.user.id,
          challenged: challengedTeam,
          challengerTeam,
          challengedTeam,
          items,
          status: 'pending',
          accepted: [],
          createdAt: Date.now()
        };

        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        const opponent = await interaction.guild.members.fetch(opponentId).catch(() => null);
        if (!opponent) return interaction.editReply({ content: 'No se ha encontrado ese usuario en el servidor.' });

        const ticket = await createWagerTicket(interaction.guild, interaction.user, [opponent], challengerTeam, challengedTeam, wagerId);
        wager.channelId = ticket.id;
        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId(`wager_accept_${wagerId}`).setLabel('Aceptar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`wager_decline_${wagerId}`).setLabel('Rechazar').setStyle(ButtonStyle.Danger)
          );

        await ticket.send({
          content: `<@${interaction.user.id}> ha retado a <@${opponentId}> a un WAGER 1v1\n\nItems apostados: ${items}\n\nEl equipo retado debe aceptar o rechazar.`,
          components: [row]
        });

        await interaction.editReply({ content: `Wager creado. Ticket: ${ticket}` });
        return;
      }

      if (interaction.customId === 'wager_modal_2v2') {
        if (isBlacklisted(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'No puedes crear wagers, estas en blacklist.', ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        const teammateId = interaction.fields.getTextInputValue('teammate').trim();
        const opp1Id = interaction.fields.getTextInputValue('opp1').trim();
        const opp2Id = interaction.fields.getTextInputValue('opp2').trim();
        const items = interaction.fields.getTextInputValue('items').trim() || 'Ninguno';

        const ids = [teammateId, opp1Id, opp2Id];
        for (const id of ids) {
          if (!/^\d{17,20}$/.test(id)) {
            return interaction.editReply({ content: 'Todos los IDs deben ser numericos de Discord.' });
          }
        }
        if (new Set([interaction.user.id, ...ids]).size !== 4) {
          return interaction.editReply({ content: 'No puede haber IDs repetidos.' });
        }

        const users = db.read('users.json', {});
        [interaction.user.id, teammateId, opp1Id, opp2Id].forEach(id => getUserElo(users, id));
        db.write('users.json', users);

        const wagerId = Math.random().toString(36).substr(2, 9);
        const challengerTeam = [interaction.user.id, teammateId];
        const challengedTeam = [opp1Id, opp2Id];

        const wagers = db.read('wagers.json', {});
        const wager = {
          id: wagerId,
          type: '2v2',
          guildId: interaction.guild.id,
          channelId: null,
          challenger: interaction.user.id,
          challenged: challengedTeam,
          challengerTeam,
          challengedTeam,
          items,
          status: 'pending',
          accepted: [],
          createdAt: Date.now()
        };

        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        const members = [];
        for (const id of [...challengerTeam, ...challengedTeam]) {
          const m = await interaction.guild.members.fetch(id).catch(() => null);
          if (!m) return interaction.editReply({ content: `No se ha podido encontrar <@${id}> en el servidor.` });
          members.push(m);
        }

        const challengedMembers = challengedTeam.map(id => members.find(m => m.id === id));
        const ticket = await createWagerTicket(interaction.guild, interaction.user, challengedMembers, challengerTeam, challengedTeam, wagerId);
        wager.channelId = ticket.id;
        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId(`wager_accept_${wagerId}`).setLabel('Aceptar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`wager_decline_${wagerId}`).setLabel('Rechazar').setStyle(ButtonStyle.Danger)
          );

        await ticket.send({
          content: `<@${interaction.user.id}> + <@${teammateId}> han retado a <@${opp1Id}> + <@${opp2Id}> a un WAGER 2v2\n\nItems apostados: ${items}\n\nEl equipo retado debe aceptar o rechazar.`,
          components: [row]
        });

        await interaction.editReply({ content: `Wager creado. Ticket: ${ticket}` });
        return;
      }

      if (interaction.customId.startsWith('wager_result_modal_')) {
        if (!isTicketStaff(interaction.member, interaction.guild.id)) {
          return interaction.reply({ content: 'Solo moderadores/hosters/encargados pueden reportar el resultado.', ephemeral: true });
        }
        const parts = interaction.customId.split('_');
        const wagerId = parts[3];
        const winnerSide = parts[4]; // challenger or challenged
        const proof = interaction.fields.getTextInputValue('proof').trim() || null;

        const wagers = db.read('wagers.json', {});
        const wager = wagers[wagerId];
        if (!wager) return interaction.reply({ content: 'Wager no encontrado.', ephemeral: true });
        if (wager.status !== 'accepted') return interaction.reply({ content: 'Este wager no se encuentra aceptado.', ephemeral: true });

        await interaction.deferReply();

        const winnerIsChallenger = winnerSide === 'challenger';
        const users = db.read('users.json', {});

        const challengerAvg = wager.challengerTeam.reduce((a, b) => a + getUserElo(users, b).elo, 0) / wager.challengerTeam.length;
        const challengedAvg = wager.challengedTeam.reduce((a, b) => a + getUserElo(users, b).elo, 0) / wager.challengedTeam.length;

        const winners = winnerIsChallenger ? wager.challengerTeam : wager.challengedTeam;
        const losers = winnerIsChallenger ? wager.challengedTeam : wager.challengerTeam;
        const gain = calculateWagerGain(challengerAvg, challengedAvg);

        for (const uid of winners) {
          const u = getUserElo(users, uid);
          const before = u.elo;
          u.elo += gain;
          u.wins = (u.wins || 0) + 1;
          users[uid] = u;
          addEloHistory(uid, { change: gain, before, after: u.elo, reason: 'Wager Win' });
        }
        for (const uid of losers) {
          const u = getUserElo(users, uid);
          const before = u.elo;
          u.elo = Math.max(0, u.elo - gain);
          u.losses = (u.losses || 0) + 1;
          users[uid] = u;
          addEloHistory(uid, { change: -gain, before, after: u.elo, reason: 'Wager Loss' });
        }
        db.write('users.json', users);

        wager.status = 'finished';
        wager.winner = winnerIsChallenger ? 'challenger' : 'challenged';
        wager.reportedBy = interaction.user.id;
        wager.gain = gain;
        wager.proof = proof;
        wager.finishedAt = Date.now();
        wagers[wagerId] = wager;
        db.write('wagers.json', wagers);

        addMatchHistory(wagerId, {
          type: wager.type,
          guildId: wager.guildId,
          winners: winners,
          losers: losers,
          eloGain: gain,
          items: wager.items,
          proof: proof,
          reportedBy: interaction.user.id,
          finishedAt: Date.now()
        });

        for (const uid of [...winners, ...losers]) {
          await checkAndAssignEloRoles(interaction.guild, uid);
        }

        await interaction.editReply({
          content: `Resultado reportado por ${interaction.user.tag}\n\nGanadores: ${winners.map(id => `<@${id}>`).join(', ')} | +${gain} ELO\nPerdedores: ${losers.map(id => `<@${id}>`).join(', ')} | -${gain} ELO\n\nItems apostados: ${wager.items || 'Ninguno'}\nPrueba: ${proof || 'Ninguna'}`
        });

        try {
          const guildCfg = getGuildConfig(interaction.guild.id);
          if (guildCfg.resultsChannelId) {
            const resChannel = interaction.guild.channels.cache.get(guildCfg.resultsChannelId);
            if (resChannel) {
              const resEmbed = new EmbedBuilder()
                .setTitle('WAGER FINALIZADO')
                .setColor(config.colors.success)
                .addFields(
                  { name: 'Tipo', value: wager.type.toUpperCase(), inline: true },
                  { name: 'Ganador', value: winnerIsChallenger ? 'Desafiantes' : 'Desafiados', inline: true },
                  { name: 'ELO por jugador', value: `+${gain} / -${gain}`, inline: true },
                  { name: 'Ganadores', value: winners.map(id => `<@${id}>`).join('\n'), inline: true },
                  { name: 'Perdedores', value: losers.map(id => `<@${id}>`).join('\n'), inline: true },
                  { name: 'Reportado por', value: `<@${interaction.user.id}>`, inline: true },
                  { name: 'Items apostados', value: wager.items || 'Ninguno', inline: false },
                  { name: 'Prueba', value: proof || 'Ninguna', inline: false }
                )
                .setFooter({ text: `Wager ID: ${wagerId}` })
                .setTimestamp();
              await resChannel.send({ embeds: [resEmbed] });
            }
          }
        } catch (e) { console.error(e); }

        return;
      }
    }
  },
};
