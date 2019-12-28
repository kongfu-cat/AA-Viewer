import key from './lib/key'
import tts from './lib/api'

/**
 * Generate "Google TTS" audio download link
 *
 * @param   {String}  text
 * @param   {String!} lang     default is 'en'
 * @param   {Number!} speed    default is 1, show = 0.24
 * @param   {Number!} timeout  default is 10000ms
 * @return  Promise(url: String)
 */
export default function (text, lang, speed, timeout) {
  return key(timeout).then(function (key) {
    return tts(text, key, lang, speed)
  })
};
