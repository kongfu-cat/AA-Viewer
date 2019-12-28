<template>
  <div style="position:relative;">
    <div
      v-html="aaContent"
      @mouseup="handleSelectText"
      @mousedown="handleRemoveTooltip"
    ></div>
    <div
      class="aa-tooltip"
      v-if="tooltipVisiable"
      :style="{ position: 'absolute', left: tooltipOffset[0]+'px', top: tooltipOffset[1]+'px' }"
    >
      {{ tooltipText}}
    </div>
  </div>
</template>

<script>
import translate from 'translate'
import baiduFanyiApi from 'src/lib/baidufanyi.config.js'
export default {
  props: {
    aaContent: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      tooltipOffset: [0, 0],
      tooltipText: 'tooltipText',
      tooltipVisiable: false
    }
  },
  mounted () {
  },
  methods: {
    handleRemoveTooltip () {
      this.tooltipVisiable = false
    },
    handleSelectText (event) {
      let selStr = this.getSelection().toString(),
        position = this.getMousePos()
      console.log('handleTranslate.selection: ', selStr)
      console.log('handleTranslate.position: ', position)
      if (selStr.trim()) {
        position[0] -= 50
        position[1] -= 150
        this.tooltipOffset = position
        this.translateTextBaidu(selStr.trim()).then(text => {
          this.tooltipText = text
          this.tooltipVisiable = true
        })
      }
    },
    translateText (textOrigin) {
      return new Promise((resolve, reject) => {
        translate(textOrigin, {
          from: 'ja',
          to: 'zh',
          engine: 'google',
          key: 'YOUR-KEY-HERE'        }).then(text => {
          console.log(text)
          resolve(text)
        }).catch(err => {
          reject(err)
        })
      })
    },
    string2md5 (str) {
      var crypto = require('crypto')
      // 加盐密码的md5值
      var md5 = crypto.createHash('md5')
      var result = md5.update(str).digest('hex')
      return result
    },
    translateTextBaidu (q) {
      let salt = Math.random().toString().slice(2, 5),
        appid = baiduFanyiApi.appid, // baidu fanyi 的开发者 appid
        key = baiduFanyiApi.key, // baidu fanyi 的开发者 key
        sign = this.string2md5(appid + q + salt + key)
      console.log('签名：%s', sign)
      return new Promise((resolve, reject) => {
        this.$axios.get('/baidu-fanyi-api', {
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
          resolve(data.trans_result[0].dst || `error(${data.error_code}): ${data.error_msg}`)
        }).catch(err => {
          reject(err)
        })
      })
    },
    getSelection () {
      if (document.Selection) {
        // ie浏览器
        return document.selection.createRange()
      } else {
        // 标准浏览器
        return window.getSelection()
      }
    },
    replaceSelection () {
      let sel = this.getSelection(),
        range = document.createRange()
      if (sel && sel.rangeCount) {
        let firstRange = sel.getRangeAt(0)
        let lastRange = sel.getRangeAt(sel.rangeCount - 1)
        range.setStart(firstRange.startContainer, firstRange.startOffset)
        range.setEnd(lastRange.endContainer, lastRange.endOffset)
      }
      //   var ele = document.createElement('i')
      //   ele.className = className
      //   ele.textContent = sel.toString()
      //   range.surroundContents(ele)
    },
    getMousePos (event) {
      var e = event || window.event
      var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft
      var scrollY = document.documentElement.scrollTop || document.body.scrollTop
      var x = e.pageX || e.clientX + scrollX
      var y = e.pageY || e.clientY + scrollY
      // alert('x: ' + x + '\ny: ' + y);
      return [x, y]
    }
  }
}
</script>

<style scoped>
.aa-tooltip {
  padding: 5px;
  background-color: yellow;
  border-radius: 3px;
  border: 1px solid #eee;
}
</style>
