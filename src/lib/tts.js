import baiduTTSApi from 'src/lib/baidutts.config.js'

const fs = require('fs')
const path = require('path')
class BaiduTTS {
    constructor() {
        const AipSpeechClient = require('baidu-aip-sdk').speech
        // 设置APPID/AK/SK
        this.client = new AipSpeechClient(baiduTTSApi.api, baiduTTSApi.key, baiduTTSApi.secretKey)
        this.player = require('play-sound')()
        this.audio = null
        this.mp3Path = path.join(path.resolve('.'), 'mp3', 'tts.mpVoice.mp3')
    }
    text2audio (text, options, saveFlag) {
        // 语音合成, 附带可选参数
        this.client.text2audio(text, options).then((result) => {
            if (result.data) {
                fs.writeFileSync(this.mp3Path, result.data)
                // 语音读取
                if (this.audio !== null) {
                    this.audio.kill()
                    this.audio = null
                }
                this.audio = this.player.play(this.mp3Path, (err) => {
                    if (err && !err.killed) throw err
                })
            } else {
                // 服务发生错误
                console.log(result)
            }
        }, function (e) {
            // 发生网络错误
            console.log(e)
        })
    }
}

const tts = new BaiduTTS()
export default tts

// tts.text2audio('你好，百度语音合成')
// const player = require('play-sound')()
// const audio = player.play('tts.mpVoice.mp3', (err) => {
//     if (err && !err.killed) throw err
// })
// audio.kill()
