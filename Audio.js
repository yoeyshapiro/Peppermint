const URL = require('url');
const ytdl = require('ytdl-core');
const EventEmitter = require('events').EventEmitter;
const _ = require('underscore');
const Promise = require('bluebird');
const request = Promise.promisifyAll(require('request'));

class Playable {
    constructor(output) {
        this.output = output;
        this.options = {};
        this.disabled = false;
        if (!this.play || !this.stop) {
            throw new Error('unimplemented');
        }
    }
}

class UrlPlayable extends Playable {
    constructor(url, output) {
        super(output);
        this.url = url;
    }

    toString() {
        return this.url;
    }
}

const YTDL_OPTIONS = {
    quality: 'lowest',
    filter: function (format) {
        return format.container === 'mp4' && !!format.audioEncoding;
    }
};

const YOUTUBE_MATCH_URL = 'https://www.youtube.com/watch?v=';

class YoutubePlayable extends UrlPlayable {
    static toUrl(videoId) {
        return YOUTUBE_MATCH_URL + videoId;
    }

    play() {
        console.log('youtube play');
        var url = URL.parse(this.url, true);
        console.log(url);
        var videoId = url.query ? url.query.v : null;
        console.log(videoId);
        var youtubeUrl = YoutubePlayable.toUrl(videoId);
        console.log(youtubeUrl);
        console.log('youtubeurl defined');
        console.log(ytdl(youtubeUrl, YTDL_OPTIONS));
        this.stream = ytdl(youtubeUrl, YTDL_OPTIONS);
        console.log('stream defined');
        this.stream.on('info', (info) => {
            this.info = info;
        });
        console.log('youtube play done');
        return this.stream;
    }

    stop() {
        this.stream.unpipe();
        this.stream.end();
    }
}

const GOOGLE_PLAYLIST_API = 'https://www.googleapis.com/youtube/v3/playlistItems';

class AudioManager {
    constructor(settings) {
        this.settings = settings;
        this.defaultOptions = { volume: 0.2, passes: 2 };
        this.eventBus = new EventEmitter();

        this.voiceConnection = null;
        this.currentlyPlaying = null;
        this.queue = [];

        this.played = [];
        this.loop = false;
        this.shuffle = false;
    }
    
    static createFromVoiceConnection(settings, voiceConnection) {
        var manager = new AudioManager(settings);
        manager.voiceConnection = voiceConnection;
        return manager;
    }

    join(voiceChannel) {
        var promise
        if (!this.voiceConnection) {
            promise = voiceChannel.join().then((connection) => {
                this.voiceConnection = connection;
            });
        } else {
            promise = Promise.resolve();
        }
        return promise;
    }
    
    start() {
        console.log('start');
        if (!this.currentlyPlaying) {
            console.log('start if1');
            if (this.queue.length) {
                console.log('start if queue');

                var playable = this.queue.shift();
                console.log('defined');
                this.currentlyPlaying = playable;
                console.log('current');
                playable.play();
                console.log('playable');
                playable.stream.on('error', (e) => {
                    this.eventBus.emit('error', new Error(e));
                });
                console.log('1');
                if (playable instanceof YoutubePlayable) {
                    console.log('start youtube');
                    playable.stream.on('info', (info) => {
                        this.eventBus.emit('playing', playable, info);
                    });
                } else {
                    console.log('start else youtube');
                    this.eventBus.emit('playing', playable);
                }

                console.log('start made it past');
                var dispatcher = this.voiceConnection.playStream(playable.stream, _.extend({}, this.defaultOptions, playable.options));
                dispatcher.on('start', () => {
                });
                console.log('dispatcher start');
                dispatcher.on('end', () => {
                    this.stop();
                    if (this.loop) {
                        this.played.push(playable);
                    }
                    this.start();
                });
                console.log('dispatcher end');
                dispatcher.on('error', (e) => {
                    this.eventBus.emit('error', new Error(e));
                });
                console.log('start if queue done');
            } else if (this.loop && this.played.length) {
                console.log('start else if loop');
                if (this.shuffle) {
                    this.addPlayable(_.shuffle(this.played));
                } else {
                    this.addPlayable(this.played);
                }
                this.played = [];
                this.start();
            }
        }
        console.log('start done');
    }

    stop() {
        if (this.voiceConnection && this.currentlyPlaying) {
            this.currentlyPlaying.stop();
            this.eventBus.emit('stopping', this.currentlyPlaying);
            this.currentlyPlaying = null;
        }
    }

    play() {
        return this._addFromUrl.apply(this, arguments).then((status) => {
            console.log('play');
            this.start();
            console.log('play done');
            return status;
        });
    }
    
    addPlayable(playable) {
        if (Array.isArray(playable)) {
            playable.forEach((playable) => this.addPlayable(playable));
            console.log('addplayable done if');
        } else if (!playable.disabled) {
            this.queue.push(playable);
            console.log('addplayable done else');
        }
        console.log('addplayable done');
    }

    _addFromUrl(urlstring, output) {
        var url = URL.parse(urlstring, true);
        var addPromise;
        console.log(url);
        if (url.hostname === 'www.youtube.com' && url.pathname === '/watch') {
            addPromise = Promise.resolve(new YoutubePlayable(urlstring, output));
        } else if (url.hostname === 'www.youtube.com' && url.pathname === '/playlist' && url.query.list) {
            addPromise = request.getAsync({
                url: GOOGLE_PLAYLIST_API,
                qs: {
                    part: 'contentDetails',
                    maxResults: 50,
                    playlistId: url.query.list,
                    key: this.settings.google.key
                }
            }).then((response) => {
                if (response.statusCode !== 200) {
                    throw new Error('invalid status from google api' + response.statusCode);
                }
                var playlist = JSON.parse(response.body);
                var toAdd = _(playlist.items).chain().map((item) => {
                    var itemUrl = YoutubePlayable.toUrl(item.contentDetails.videoId);
                    return new YoutubePlayable(itemUrl, output);
                });
                if (this.shuffle) {
                    toAdd = toAdd.shuffle();
                }
                return toAdd.value();
                });
        }
        return addPromise.then((playables) => {
            this.addPlayable(playables);
            console.log('addfromurl done');
            return playables;
        });
    }
}

module.exports = Playable;
module.exports = UrlPlayable;
module.exports = YoutubePlayable;
module.exports = AudioManager;