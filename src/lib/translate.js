import translate from 'translate'
import baiduFanyiApi from 'src/lib/baidufanyi.config.js'
import axios from 'axios'

export function translateTextGoogle (textOrigin) {
    return new Promise((resolve, reject) => {
        translate(textOrigin, {
            from: 'ja',
            to: 'zh',
            engine: 'google',
            key: 'YOUR-KEY-HERE'
        }).then(text => {
            console.log(text)
            resolve(text)
        }).catch(err => {
            reject(err)
        })
    })
}

function string2md5 (str) {
    var crypto = require('crypto')
    // 加盐密码的md5值
    var md5 = crypto.createHash('md5')
    var result = md5.update(str).digest('hex')
    return result
}
export function translateTextBaidu (q) {
    let salt = Math.random().toString().slice(2, 5),
        appid = baiduFanyiApi.appid, // baidu fanyi 的开发者 appid
        key = baiduFanyiApi.key, // baidu fanyi 的开发者 key
        sign = string2md5(appid + q + salt + key)
    console.log('签名：%s', sign)
    return new Promise((resolve, reject) => {
        axios.get('/baidu-fanyi-api', {
            params: {
                q: q,
                from: 'ja',
                to: 'zh',
                appid: appid,
                salt: salt,
                sign: sign
            }
        }).then(res => {
            //   console.log('translateTextBaidu', res)
            let data = res.data
            if (data.trans_result) {
                resolve(data.trans_result[0].dst)
            } else {
                resolve(`error(${data.error_code}): ${data.error_msg}`)
            }
        }).catch(err => {
            reject(err)
        })
    })
}
