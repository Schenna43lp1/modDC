# Simple Discord Moderationsbot

Ein einfacher Discord Moderationsbot in Node.js mit den Befehlen:

- `!kick @User Grund`
- `!ban @User Grund`
- `!mute @User`
- `!unmute @User`
- `!warn @User Grund`
- `!warns @User`

## Voraussetzungen

- Node.js v16+
- Discord Bot Token (im Discord Developer Portal erstellen)
- Eine Rolle `Muted` wird bei Bedarf automatisch erstellt
- Ein Textchannel `mod-logs` für Moderations-Logs (optional)

## Installation

1. Repo klonen:
   ```bash
   git clone https://github.com/dein-benutzername/simple-discord-mod-bot.git
   cd simple-discord-mod-bot
   ```

2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

3. Bot Token in `.env` Datei eintragen (Beispiel siehe `.env.example`):
   ```
   TOKEN=DEIN_BOT_TOKEN_HIER
   ```

4. Bot starten:
   ```bash
   node index.js
   ```

## Befehle

- `!kick @User Grund`
- `!ban @User Grund`
- `!mute @User`
- `!unmute @User`
- `!warn @User Grund`
- `!warns @User`

## Rechte

Der Bot benötigt folgende Rechte im Server:
- `Kick Members`
- `Ban Members`
- `Manage Roles`
- `View Channels`
- `Send Messages`
