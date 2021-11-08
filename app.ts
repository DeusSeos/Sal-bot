import { Client, Intents, Message } from 'discord.js';
import { DiscordPlay, DisPlayEvent } from 'discord-play';
require("dotenv").config();

const myCookies = "your-cookies-here";

const client: Client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

client.once("ready", () => {
    console.log(`Ready!`);
    client.user!.setStatus('idle');
    client.user!.setActivity(" sadness", { type: "LISTENING" });

});

interface Command {
    name: string,
    args: string[]
}

interface Track {
    title: string,
    url: string,
    artist: string
}

let DisPlay: DiscordPlay, track: Track;

client.on('messageCreate', async (message: Message) => {
    const command: Command = parseCommand(message.content);
    console.log(message.content);
    // console.log(parseCommand(message.content))
    // console.log(message.member!.voice)
    switch (command.name) {

        case "?join": {
            if (message.member!.voice.channel === null) {
                message.channel.send("Error: join a voice channel to use this bot");
                console.log("No voice channel for member");
                break;
            };
            DisPlay = new DiscordPlay(message.member!.voice, {
                quality: "HIGHEST",
                emptyQueueBehaviour: "CONNECTION_KEEP",
                cookies: myCookies,

            });
            DisPlay.on(DisPlayEvent.BUFFERING, (oldState, newState) => {
                message.channel.send("Loading resource");
            });
            DisPlay.on(DisPlayEvent.PLAYING, (oldState, newState) => {
                message.channel.send(`Now playing, **${track.title}**`);
            });
            DisPlay.on(DisPlayEvent.FINISH, (oldState, newState) => {
                message.channel.send("Finished playing");
            });
            DisPlay.on('error', error => {
                message.channel.send("Error");
                console.log(error);
            });
            break;
        }
        case "?p":
        case "?play": {
            track = await DisPlay.enqueue(command.args.join(' '));
            message.reply(`Enqueued, **${track.title}**`)
            break;
        }

        case "?next":
        case "?skip": {
            DisPlay.skip();
            break;
        }

        case "?np":
        case "?queue":
        case "?playlist": {
            message.reply(DisPlay.queue.map(x => `${DisPlay.queue.indexOf(x) + 1}. ${x.title}`).join("\n"));
            break;
        }
        case "?dc":
        case "?disconnect":
        case "?leave": {
            try {
                DisPlay.stop();
                message.reply("Left voice channel");
            } catch {
                message.channel.send("No connection found");
            }
            break;
        }

        case "?loop":
            if (DisPlay.toggleSongLoop()) {
                message.channel.send(`Looping **${track.title}**`);
            } else {
                message.channel.send("No longer looping.");
            }
            break;

    }
});

client.login();

function parseCommand(content: string): Command {
    const args: string[] = content.split(' ');
    const name: string = args.shift()!;
    return { name, args };
}