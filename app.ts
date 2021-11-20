import { Client, Intents, Message } from 'discord.js';
import { DiscordPlay, DisPlayEvent, LoopMode } from 'discord-play';
import { VoiceConnectionDestroyedState, VoiceConnectionStatus } from '@discordjs/voice';
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
    client.user!.setStatus('online');
    client.user!.setActivity("a war is at hand", { type: "LISTENING" });

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
    const prefix = process.env.PREFIX ? process.env.PREFIX : "$";
    let lines = message.content.split('\n');
    for (let line of lines) {
        const command: Command = parseCommand(prefix, line) || { prefix, name: "", args: [] };
        if (command.name === "") return;
        console.log(`${command.prefix}${command.name}`+command.args.join(" "));
        switch (command.name) {
            case "join": {
                join(message);
                break;
            }

            case "p":
                case "play": {
                if (command.args.length == 0) {
                    message.reply("Error: no input provided");
                    break;
                }
                //use join method but with false to prevent already connected message
                if (message.member!.voice.channel === null) {
                    message.reply("Error: join a voice channel to use this bot");
                    break;
                } 
                //if not connected, connect
                if (DisPlay === undefined) {
                    join(message);
                }
                
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

            case "q":
            case "np":
            case "queue":
            case "playlist": {
                let i = 0;
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
                if ((<VoiceConnectionDestroyedState>DisPlay.connection.connection.state).status != VoiceConnectionStatus.Destroyed){
                    DisPlay.set_pause(true);
                    DisPlay.stop();
                    message.reply("Left voice channel");
                }
                else {
                    message.reply("Error: Not connected to a voice channel");
                }
                break;
            }

            case "pause":
            case "p": {
                DisPlay.set_pause(true);
                message.reply("Paused");
                break;
            }

            case "resume":
            case "r": {
                DisPlay.set_pause(false);
                message.reply("Resumed");
                break;
            }

            case "loop": {
                if (command.args.length == 0) {
                    message.reply(DisPlay.setLoopMode(LoopMode.NONE)[1]);
                }
                else {
                    switch (command.args[0]) {
                        case "none":
                            message.reply(DisPlay.setLoopMode(LoopMode.NONE)[1]);
                            break;
                        case "track":
                        case "queue":
                        case "playlist":
                        case "p":
                            message.reply(DisPlay.setLoopMode(LoopMode.QUEUE)[1]);
                            break;
                        case "current":
                        case "single":
                        case "song":
                        case "s":
                            message.reply(DisPlay.setLoopMode(LoopMode.SINGLE)[1]);
                            break;
                    }
                }
                break;
            }

        }
    }
});

client.login();

process.stdin.resume();

function exitHandler(cleanup: boolean, exit: boolean) {
    if (cleanup) {
        try {
            DisPlay.stop();
            console.log("Disconnected due to exit signal");
        } catch {
            console.log("No connection detected. Exited")
        }
    };
    if (exit) process.exit();
}

// when app is closing
//process.on('exit', exitHandler.bind(true, true));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(true, true));

// catches kill signals
//process.on('SIGUSR1', exitHandler.bind(true, true));
//process.on('SIGUSR2', exitHandler.bind(true, true));

//catches uncaught exceptions
//process.on('uncaughtException', exitHandler.bind(true, true));

//Join function logic
function join(message: Message) {
    if (message.member!.voice.channel === null) {
        message.reply("Error: join a voice channel to use this bot");
        return;
    };

    // if the DisPlay already exists, then the bot must have connected to a voice channel
    if (DisPlay) {
        // if the state is "Destroyed", then the bot must have disconnected from the voice channel. reconstruct the DisPlay
        if ((<VoiceConnectionDestroyedState>DisPlay.connection.connection.state).status == VoiceConnectionStatus.Destroyed) {
            let queue = DisPlay.queue;
            DisPlay = new DiscordPlay(message.member!.voice, {
                quality: "HIGHEST",
                emptyQueueBehaviour: "CONNECTION_KEEP",
                cookies: myCookies,
            });
            for (let track of queue) {
                DisPlay.enqueue(track.url);
            }
        }
        // if the state is not "Destroyed", the bot must still be connected to a voice channel, or is in the process of changing state
        else {
            message.reply("Error: Already connected to a voice channel");
        }
        return;
    }

    DisPlay = new DiscordPlay(message.member!.voice, {
        quality: "HIGHEST",
        emptyQueueBehaviour: "CONNECTION_KEEP",
        cookies: myCookies,
    });
    /*
    //removing this annoying message
    DisPlay.on(DisPlayEvent.BUFFERING, (_o, _n) => {
        message.channel.send("Loading resource");
    });
    */
    DisPlay.on(DisPlayEvent.PLAYING, (_o, _n) => {
        message.channel.send(`Now playing, **${DisPlay.queue[0].title}**`);
        client.user!.setActivity(`${DisPlay.queue[0].title} - ${DisPlay.queue[0].artist}`, { type: "LISTENING" });
    });
    DisPlay.on(DisPlayEvent.FINISH, (_o, _n) => {
        message.channel.send("Finished playing");
        client.user!.setActivity("nothing", {type: "LISTENING"});
    });
    DisPlay.on('error', error => {
        message.reply("Error");
        console.log(error);
    });
};

function connected() {
    return (<VoiceConnectionDestroyedState>DisPlay.connection.connection.state).status != VoiceConnectionStatus.Destroyed;
}

function parseCommand(prefix: string, content: string): Command | undefined {
    content = content.trim();
    //check if message starts with prefix
    if (content.startsWith(prefix)) {
        //remove prefix and split into command and args
        //makes commands lowercase
        const args = content.slice(prefix.length).split(' ');
        return {
            prefix,
            name: args[0].toLowerCase(),
            args: args.slice(1)
        }
    }
    return undefined;
}