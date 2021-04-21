
import CryptoJS from "crypto-js";

const b64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/='
// const codes = ['0', '1234']
const codes = ['\u200b', '\u200c\u200d']
const table = []

const makeTable = () => {
  const [sep, chars] = codes
  const char_count = b64.length
  const code_len = chars.length

  while (table.length < char_count) {
    let table_len = table.length
    for (let i = 0; i < code_len; i++) {
      let c = chars.charAt(i)
      if (!table.includes(c)) {
        if (table.length >= char_count) break
        table.push(c)
      }

      for (let j = 0; j < table_len; j++) {
        if (table.length >= char_count) break
        let t = `${c}${table[j]}`
        if (!table.includes(t)) {
          table.push(t)
        }
      }
    }
  }

  for (let i = 0; i < table.length; i++) {
    table[i] = sep + table[i]
  }
}

makeTable()


const clean = (t) => {
  return t.replace(/[^\u200b\u200c\u200d]/gi, '')
}
const addPunctuations = (t, lang) => {
  let a = t.split('')
  let idx = 0
  lang = lang || '喵'
  while (idx < a.length) {
    let c = a[idx].charCodeAt(0)
    let delta = (c % 60) + 1
    idx += delta
    if (!a[idx]) {
      break
    }

    a[idx] += lang
    let mod = idx % 32
    switch (mod) {
      case 0:
      case 1:
      case 2:
      case 3:
        a[idx] += '，'
        break
      case 7:
        a[idx] += '。'
        break
      case 8:
        a[idx] += '？'
        break
      case 9:
        a[idx] += '！'
        break
      case 10:
        a[idx] += '～'
        break
    }
  }

  t = lang + a.join('') + lang + '。'

  return t
}
export default {
  encode(text, lang) {
    var str = CryptoJS.enc.Utf8.parse(text);
    var t = CryptoJS.enc.Base64.stringify(str);
    let len = t.length
    let arr = []
    for (let i = 0; i < len; i++) {
      let c = t.charAt(i)
      let n = b64.indexOf(c)
      // console.log(c, n, table[n])
      arr.push(table[n])
    }
    let data = arr.join('')
    return addPunctuations(data, lang)
  },
  decode(t) {
    t = clean(t)

    for (let idx = table.length; idx >= 0; idx--) {
      let reg = new RegExp(table[idx], 'ig')
      t = t.replace(reg, b64.charAt(idx))
    }
    var words = CryptoJS.enc.Base64.parse(t);
    t = words.toString(CryptoJS.enc.Utf8);
    return t
  }
}