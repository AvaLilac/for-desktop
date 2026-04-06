import { Client } from "discord-rpc";

import { config } from "./config";

// internal state
let rpc: Client;

export async function initDiscordRpc() {
  if (!config.discordRpc) return;

  // clean up existing client if one exists
  rpc?.removeAllListeners();

  try {
    rpc = new Client({ transport: "ipc" });

    rpc.on("ready", () =>
      rpc.setActivity({
        details: "Chatting with others on AviaClient",
        state: "stoat.chat",
        largeImageKey: "qr",
        largeImageText: "Join Stoat!",
        buttons: [
          {
            label: "Join Stoat",
            url: "https://stoat.chat/",
          },
        ],
      }),
    );

    rpc.on("disconnected", reconnect);

    rpc.login({ clientId: "1490783938829090837" });
  } catch (err) {
    reconnect();
  }
}

const reconnect = () => setTimeout(() => initDiscordRpc(), 1e4);

export async function destroyDiscordRpc() {
  rpc?.destroy();
}
