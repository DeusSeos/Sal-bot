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
    prefix: string,
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
    const prefix = "$";
    const command: Command = parseCommand(prefix, message.content) || { prefix, name: "", args: [] };
    console.log(message.content);
    switch (command.name) {
        case "join": {
            if (message.member!.voice.channel === null) {
                message.reply("Error: join a voice channel to use this bot");
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
                message.channel.send(`Now playing, **${DisPlay.queue[0].title}**`);
            });
            DisPlay.on(DisPlayEvent.FINISH, (oldState, newState) => {
                message.channel.send("Finished playing");
            });
            DisPlay.on('error', error => {
                message.reply("Error");
                console.log(error);
            });
            break;
        }

        case "p":
        case "play": {
            track = await DisPlay.enqueue(command.args.join(' '));
            message.reply(`Enqueued, **${track.title}**`)
            break;
        }

        case "next":
        case "skip": {
            DisPlay.skip();
            message.reply("Skipped");
            break;
        }

        case "np":
        case "queue":
        case "playlist": {
            let i = 0;
            console.log(DisPlay.queue);
            if (DisPlay.queue.length === 0) {
                message.reply("Queue is empty");
                break;
            }

            message.reply(DisPlay.queue.map(x => {
                i++;
                return `${i}. ${x.title}`
            }).join("\n"));
            break;
        }

        case "dc":
        case "disconnect":
        case "leave": {
            try {
                DisPlay.stop();
                message.reply("Left voice channel");
            } catch {
                message.reply("No connection found");
            }
            break;
        }

        case "loop": {
            if (DisPlay.toggleSongLoop()) {
                message.reply(`Looping **${track.title}**`);
            } else {
                message.reply("No longer looping.");
            }
            break;
        }

    }
});

client.login();

process.stdin.resume();

function exitHandler(cleanup: boolean, exit: boolean) {
    if (cleanup) {
        DisPlay.stop ? DisPlay.stop() : null;
        console.log("Disconnected due to exit signal");
    };
    if (exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(true, true));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(true, true));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(true, true));
process.on('SIGUSR2', exitHandler.bind(true, true));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(true, true));

function parseCommand(prefix: string, content: string): Command | undefined {
    content = content.trim();
    if (content.startsWith(prefix)) {
        const args = content.slice(prefix.length).split(' ');
        return {
            prefix,
            name: args[0],
            args: args.slice(1)
        }
    }
    return undefined;
}