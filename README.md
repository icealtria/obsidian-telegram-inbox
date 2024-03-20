# Telegram Inbox

This plugin can receive messages from Telegram bots and add them to Obsidian's daily note.

## Usage
1. Create a bot using [@BotFather](https://telegram.me/BotFather).
2. Copy the bot token provided by [@BotFather](https://telegram.me/BotFather).
3. Paste the token into the `Bot Token` field in the plugin settings.
4. Add your username or telegram ID to the `Allowed Users`. (If left blank, messages from all users will be accepted.)
5. Click the `Restart` button.

## Manually install the plugin
Requires Node.js environment.

### Build
- Clone this repo. `git clone https://github.com/icealtria/telegram-inbox`
- Run `pnpm i` or another package manager to install dependencies.
- Run `pnpm build` to build the plugin.
  
### Install
- Copy over `main.js`, `manifest.json`, `styles.css` to your vault `VaultFolder/.obsidian/plugins/telegram-inbox/`.

