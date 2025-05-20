require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

// Erstelle neuen Client mit nötigen Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // Serverinformationen
    GatewayIntentBits.GuildMessages, // Nachrichten in Servern
    GatewayIntentBits.MessageContent, // Inhalt von Nachrichten lesen
    GatewayIntentBits.GuildMembers, // Mitglieder verwalten
  ],
});

const TOKEN = process.env.TOKEN; // Bot Token aus .env
const PREFIX = '!'; // Befehlspräfix

client.once('ready', () => {
  console.log(`Bot ist eingeloggt als ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (!message.guild) return; // Nur Server-Nachrichten, keine DMs
  if (message.author.bot) return; // Keine Bot-Nachrichten
  if (!message.content.startsWith(PREFIX)) return; // Nur Befehle

  // Rechtecheck: nur mit KickMembers Recht kann man Befehle nutzen
  if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
    return message.reply('Du hast keine Rechte, diesen Befehl zu benutzen.');
  }

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Channel für Moderations-Logs suchen
  const logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs');

  // Warnungen im RAM speichern
  if (!client.warns) client.warns = new Map();

  if (command === 'kick') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Bitte erwähne einen Benutzer zum Kicken.');
    if (!user.kickable) return message.reply('Ich kann diesen Benutzer nicht kicken.');

    const reason = args.join(' ') || 'Kein Grund angegeben';
    await user.kick(reason);
    message.channel.send(`${user.user.tag} wurde gekickt. Grund: ${reason}`);

    if (logChannel) logChannel.send(`**Kick:** ${user.user.tag} von ${message.author.tag}\nGrund: ${reason}`);
  }
  else if (command === 'ban') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Bitte erwähne einen Benutzer zum Bannen.');
    if (!user.bannable) return message.reply('Ich kann diesen Benutzer nicht bannen.');

    const reason = args.join(' ') || 'Kein Grund angegeben';
    await user.ban({ reason });
    message.channel.send(`${user.user.tag} wurde gebannt. Grund: ${reason}`);

    if (logChannel) logChannel.send(`**Ban:** ${user.user.tag} von ${message.author.tag}\nGrund: ${reason}`);
  }
  else if (command === 'mute') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Bitte erwähne einen Benutzer zum Muten.');

    // Rolle "Muted" suchen oder erstellen
    let muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!muteRole) {
      try {
        muteRole = await message.guild.roles.create({
          name: 'Muted',
          color: '#555555',
          permissions: [],
        });
        // In allen Channels SendMessages & Speak verbieten
        for (const [, channel] of message.guild.channels.cache) {
          await channel.permissionOverwrites.edit(muteRole, {
            SendMessages: false,
            Speak: false,
            AddReactions: false,
          });
        }
      } catch (err) {
        return message.reply('Konnte die Muted Rolle nicht erstellen. Bitte gib mir die nötigen Rechte.');
      }
    }

    if (user.roles.cache.has(muteRole.id)) return message.reply('Der Benutzer ist bereits gemutet.');

    await user.roles.add(muteRole);
    message.channel.send(`${user.user.tag} wurde gemutet.`);

    if (logChannel) logChannel.send(`**Mute:** ${user.user.tag} von ${message.author.tag}`);
  }
  else if (command === 'unmute') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Bitte erwähne einen Benutzer zum Entmuten.');

    const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
    if (!muteRole) return message.reply('Es gibt keine Muted Rolle.');

    if (!user.roles.cache.has(muteRole.id)) return message.reply('Der Benutzer ist nicht gemutet.');

    await user.roles.remove(muteRole);
    message.channel.send(`${user.user.tag} wurde entmutet.`);

    if (logChannel) logChannel.send(`**Unmute:** ${user.user.tag} von ${message.author.tag}`);
  }
  else if (command === 'warn') {
    const user = message.mentions.members.first();
    if (!user) return message.reply('Bitte erwähne einen Benutzer zum Verwarnen.');
    const reason = args.join(' ') || 'Kein Grund angegeben';

    let warns = client.warns.get(user.id) || [];
    warns.push({ moderator: message.author.tag, reason, date: new Date() });
    client.warns.set(user.id, warns);

    message.channel.send(`${user.user.tag} wurde verwarnt. Grund: ${reason}`);

    if (logChannel) logChannel.send(`**Warn:** ${user.user.tag} von ${message.author.tag}\nGrund: ${reason}`);
  }
  else if (command === 'warns') {
    const user = message.mentions.members.first() || message.member;
    const warns = client.warns.get(user.id) || [];
    if (warns.length === 0) return message.reply(`${user.user.tag} hat keine Verwarnungen.`);

    let warnList = warns.map((w, i) => `${i + 1}. Von ${w.moderator} am ${w.date.toLocaleDateString()}: ${w.reason}`).join('\n');
    message.channel.send(`Verwarnungen für ${user.user.tag}:\n${warnList}`);
  }
});

client.login(TOKEN);
