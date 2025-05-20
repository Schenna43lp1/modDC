require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel]
});

const prefix = '!';
const muteRoleName = 'Muted';

// Speicher für Warnungen (nur für Demo, nicht persistent)
const warnings = new Map();

client.once('ready', () => {
    console.log(`Bot ist online als ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply("Du hast keine Berechtigung, diesen Befehl zu verwenden.");
    }

    if (command === 'warn') {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Bitte erwähne einen Benutzer.");
        const reason = args.slice(1).join(' ') || "Kein Grund angegeben";

        let userWarnings = warnings.get(user.id) || 0;
        userWarnings++;
        warnings.set(user.id, userWarnings);

        message.channel.send(`${user} wurde verwarnt. Grund: ${reason} (Anzahl Warnungen: ${userWarnings})`);
    }

    else if (command === 'mute') {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Bitte erwähne einen Benutzer.");
        if (user.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply("Du kannst keine Moderatoren muten.");

        let muteRole = message.guild.roles.cache.find(r => r.name === muteRoleName);
        if (!muteRole) {
            try {
                muteRole = await message.guild.roles.create({
                    name: muteRoleName,
                    color: 'Grey',
                    permissions: []
                });
                message.guild.channels.cache.forEach(async (channel) => {
                    await channel.permissionOverwrites.edit(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    });
                });
            } catch (err) {
                console.error(err);
                return message.reply("Konnte die Muted-Rolle nicht erstellen.");
            }
        }

        const duration = parseInt(args[1]) || 10; // default 10 Minuten
        if (user.roles.cache.has(muteRole.id)) return message.reply("Der Benutzer ist bereits gemutet.");

        try {
            await user.roles.add(muteRole);
            message.channel.send(`${user} wurde für ${duration} Minuten gemutet.`);

            setTimeout(async () => {
                if (user.roles.cache.has(muteRole.id)) {
                    await user.roles.remove(muteRole);
                    message.channel.send(`${user} wurde entmutet.`);
                }
            }, duration * 60 * 1000);

        } catch (err) {
            console.error(err);
            message.reply("Fehler beim Muting.");
        }
    }

    else if (command === 'unmute') {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Bitte erwähne einen Benutzer.");

        const muteRole = message.guild.roles.cache.find(r => r.name === muteRoleName);
        if (!muteRole) return message.reply("Keine Muted-Rolle auf diesem Server.");

        if (!user.roles.cache.has(muteRole.id)) return message.reply("Der Benutzer ist nicht gemutet.");

        try {
            await user.roles.remove(muteRole);
            message.channel.send(`${user} wurde entmutet.`);
        } catch (err) {
            console.error(err);
            message.reply("Fehler beim Entmuten.");
        }
    }

    else if (command === 'kick') {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Bitte erwähne einen Benutzer.");
        if (!user.kickable) return message.reply("Ich kann diesen Benutzer nicht kicken.");
        const reason = args.slice(1).join(' ') || "Kein Grund angegeben";

        try {
            await user.kick(reason);
            message.channel.send(`${user} wurde gekickt. Grund: ${reason}`);
        } catch (err) {
            console.error(err);
            message.reply("Fehler beim Kicken.");
        }
    }

    else if (command === 'ban') {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Bitte erwähne einen Benutzer.");
        if (!user.bannable) return message.reply("Ich kann diesen Benutzer nicht bannen.");
        const reason = args.slice(1).join(' ') || "Kein Grund angegeben";

        try {
            await user.ban({ reason });
            message.channel.send(`${user} wurde gebannt. Grund: ${reason}`);
        } catch (err) {
            console.error(err);
            message.reply("Fehler beim Bannen.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
