const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');
var FutaFolder = 'FutaFolder';
const Opus = require('node-opus');
const Audio = require('./Audio');
const ytdl = require('ytdl-core');
const readline = require('readline');
const ReadLine = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

bot.on('ready', () => {
    console.log('Started');
});

ReadLine.on('line', (input) => {

    if (input.startsWith('say')) {
        Chat = input.split(' ')[1];
        Input = input.split(' ')[2];
    }

});

bot.on('message', (message) => {

    if (message.content == 'Hello') {
        message.channel.sendMessage('Turtle is a snow mexican');
    }
    /*
    if (message.content == 'month') {
        var FutaPics = fs.readdirSync(FutaFolder);
        message.channel.sendMessage('February, here you go :)');
        var roll = Math.floor(Math.random() * FutaPics.length);
        var Pic = FutaPics[roll];
        message.channel.sendFile(FutaFolder + '/' + Pic);

    }
    */
    if (message.content == 'join') {
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        if (VoiceChannel == null) {
            message.channel.sendMessage("Join a Voice Channel, then I'll join you");
            return;
        }
        VoiceChannel.join().then(connection => {
            message.channel.sendMessage('I am connected to ' + VoiceChannel + ' by request of ' + message.author);
        });
    }

    if (message.content == 'leave') {
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        VoiceChannel.disconnect()
            .then(connection => {
                message.channel.sendMessage('I have disconnected from ' + VoiceChannel);
            });
    }

    if (message.content == 'channel') {
        var User = message.user.client.find('type', 'voice');
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        message.channel.sendmessage(User + 'has joined' + VoiceChannel);
    }

    if (message.author.discriminator == '6269') {
        message.channel.sendMessage('Shut up Red');
    }

    var audioManagers = {};

    function createAudioManager() {
        var audioManager = new Audio(message.content.settings);
        audioManager.shuffle = true;

        audioManager.eventBus.on('playing', function (playable) {
            if (!playable.output || true) {
                return;
            }
            if (playable.info) {
                message.channel.sendMessage(playable.output, 'finished playing **' + playable + '** (' + playable.info.title + ')');
            } else {
                message.channel.sendMessage(playable.output, 'finished playing **' + playable + '**');
            }
        });
        return audioManager;
    }

    function getOrCreateAudioManager(guild) {
        if (!guild) {
            return null;
        }

        if (!audioManagers[guild.id]) {
            audioManagers[guild.id] = createAudioManager();
        }
        return audioManagers[guild.id];
    }
    
    if (message.content.startsWith('oldplay https://www.youtube.com/')) {
        message.channel.sendMessage('good now just make it play the link :P');

        var VoiceChannel = message.author.client.channels.find((channel) => {
            return channel instanceof Discord.VoiceChannel && channel.members.find((member) => member.id === message.author.id);
        });
        if (VoiceChannel == null) {
            message.channel.sendMessage("Join a Voice Channel, then I'll join you");
            return true;
        }
        var audioManager = getOrCreateAudioManager(VoiceChannel.guild);
        audioManager.join(VoiceChannel).then(function () {
            var urlstring = message.content.split(' ')[1];
            console.log(urlstring + '1')
            if (urlstring.startsWith('www')) {
                urlstring = 'http://' + urlstring;
            }
            console.log(urlstring + '2');
            return audioManager.play(urlstring, message.channel);
        }).then(function (playables) {
            console.log('then');
            if (playables.length > 1) {
                message.channel.sendMessage('playlist added');
                console.log('playable');
            } else if (audioManager.queue.length > 0) {
                message.channel.sendMessage('added to queue');
            }
        }, function (e) {
            message.channel.sendMessage('link is broken');
        });
        var urlstring = message.content.split(' ')[1];
        message.channel.sendMessage('playing ' + urlstring);
        console.log(urlstring + '3');
        return true;
    }
    
    if (message.content.startsWith('play https://www.youtube.com/watch?v=')) {
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        if (VoiceChannel == null) {
            message.channel.sendMessage("Join a Voice Channel, then I'll join you");
            return;
        }
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        const streamOptions = { seek: 0, volume: 0.5 };
        VoiceChannel.join()
            .then(connection => {
                var urlstring = message.content.split(' ')[1];
                const stream = ytdl(urlstring, { filter: 'audioonly' });
                const dispatcher = connection.playStream(stream, streamOptions);
            })
            .catch(console.error);
        var urlstring = message.content.split(' ')[1];
        message.channel.sendMessage('playing ' + urlstring);
    }

    if (message.content == 'really') {
        var VoiceChannel = message.author.client.channels.find('type', 'voice');
        message.channel.sendMessage('It better not work');
        const ytdl = require('ytdl-core');
        const streamOptions = { seek: 0, volume: 0.5 };
        VoiceChannel.join()
            .then(connection => {
                const stream = ytdl('https://www.youtube.com/watch?v=1CGMk_roNaE', { filter: 'audioonly' });
                const dispatcher = connection.playStream(stream, streamOptions);
            })
            .catch(console.error);
    }

});


