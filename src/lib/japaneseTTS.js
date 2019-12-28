import googleTTS from './google-tts-api'
var player = require('play-sound')()
var fs = require('fs')
var path = require('path')
var http = require('http')
var https = require('https')
var urlParse = require('url').parse

function downloadFile (url, dest) {
    return new Promise(function (resolve, reject) {
        var info = urlParse(url)
        var httpClient = info.protocol === 'https:' ? https : http
        var options = {
            host: info.host,
            path: info.path,
            headers: {
                'user-agent': 'WHAT_EVER'
            }
        }
        httpClient.get(options, function (res) {
            // check status code
            if (res.statusCode !== 200) {
                reject(new Error('request to ' + url + ' failed, status code = ' + res.statusCode + ' (' + res.statusMessage + ')'))
                return
            }

            var file = fs.createWriteStream(dest)
            file.on('finish', function () {
                // close() is async, call resolve after close completes.
                file.close(resolve)
            })
            file.on('error', function (err) {
                // Delete the file async. (But we don't check the result)
                fs.unlink(dest)
                reject(err)
            })

            res.pipe(file)
        })
            .on('error', function (err) {
                reject(err)
            })
            .end()
    })
}

export function text2audioJP (text) {
    var mp3Path = path.join(path.resolve('.'), 'mp3', 'tts.google.mp3')
    googleTTS(text, 'ja', 1) // speed normal = 1 (default), slow = 0.24
        .then(function (url) {
            url = url.replace(/^\/google-tts-api/, 'https://translate.google.cn')
            console.log('[TTS] url', url) // https://translate.google.com/translate_tts?...
            // url = url.replace(/^https+\/\/translate.google.c[n|om]/, 'google-tts-api')
            var dest = mp3Path // file destination
            console.log('[TTS] Download to ' + dest + ' ...')
            return downloadFile(url, dest)
        })
        .then(function () {
            console.log('[TTS] Download success')
            player.play(mp3Path, (err) => {
                if (err && !err.killed) throw err
            })
        })
        .catch(function (err) {
            console.error('[TTS] error', err.stack)
        })
}
