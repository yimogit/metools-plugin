<template>
  <div>
    <div class="layui-form-item">
      <v-button @click="addItem">
        <span>添加新项 <i class="layui-icon">&#xe654;</i></span>
      </v-button>
      <v-button @click="saveData">
        <span>保存数据 <i class="layui-icon">&#xe60e;</i></span>
      </v-button>
    </div>
    <fieldset class="layui-elem-field" v-for="(item, index) in dataList" :key="'t_' + index">
      <legend>
        第{{ dataList.length - index }}项
        <button class="layui-btn layui-btn-danger layui-btn-mini" @click="delItem(index)">
          <i class="layui-icon">&#xe640;</i>
        </button>
      </legend>
      <div class="layui-field-box">
        <div class="layui-form-item">
          <label class="layui-form-label">名称</label>
          <div class="layui-input-block">
            <input class="layui-input" placeholder="网站或应用名称" v-model="item.title" />
          </div>
        </div>
        <div class="layui-form-item">
          <label class="layui-form-label">密钥</label>
          <div class="layui-input-block">
            <input class="layui-input" placeholder="Base32 密钥" v-model="item.text" @input="onKeyChange(item)" />
          </div>
        </div>
        <div class="layui-form-item" v-if="item.text">
          <label class="layui-form-label">验证码</label>
          <div class="layui-input-block">
            <blockquote class="layui-elem-quote totp-code">
              <span class="totp-digits">{{ item.code || '------' }}</span>
              <span class="totp-timer">（{{ item.remaining }}秒后刷新）</span>
              <button class="layui-btn layui-btn-sm btn-copy" :data-clipboard-text="item.code">复制</button>
            </blockquote>
          </div>
        </div>
      </div>
    </fieldset>
    <div class="well">
      <p>可用于 Google Authenticator 等支持 TOTP 算法的二步验证。</p>
      <p>输入密钥后验证码会自动刷新。</p>
    </div>
  </div>
</template>
<script>
import base32 from 'thirty-two'
import jssha from 'jssha'
import Clipboard from 'clipboard'

var TIME_STEP = 30
var btnCopy = null
var TOTP_PAGE_STORAGE_KEY = 'me_twostepvalidation_list'

export default {
  meta: { menuName: '双重验证器', sort: 10 },
  data() {
    return {
      dataList: [],
      timerId: null
    }
  },
  created() {
    this.loadData()
    this.startTimer()
    if (!btnCopy) {
      btnCopy = new Clipboard('.btn-copy')
      btnCopy.on('success', function (e) {
        window.layui.layer.msg('复制成功: ' + e.text)
        e.clearSelection()
      })
    }
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  },
  methods: {
    addItem() {
      this.dataList.splice(0, 0, { text: '', title: '', code: '', remaining: TIME_STEP })
    },
    delItem(index) {
      this.dataList.splice(index, 1)
    },
    onKeyChange() {
      this.refreshAllCodes()
    },
    loadData() {
      var saved = []
      try { saved = JSON.parse(localStorage.getItem(TOTP_PAGE_STORAGE_KEY) || '[]') } catch (e) {}
      this.dataList = saved.map(function (s) {
        var item = { text: s.text || '', title: s.title || '', code: '', remaining: TIME_STEP }
        if (item.text) {
          var result = this.computeTOTP(item.text)
          item.code = result.code
          item.remaining = result.remaining
        }
        return item
      }.bind(this))
      if (this.dataList.length === 0) {
        this.dataList = [{ text: '', title: '', code: '', remaining: TIME_STEP }]
      }
    },
    saveData() {
      var toSave = this.dataList.map(function (s) {
        return { text: s.text, title: s.title }
      })
      localStorage.setItem(TOTP_PAGE_STORAGE_KEY, JSON.stringify(toSave))
      window.layui.layer.msg('保存成功')
    },
    startTimer() {
      var self = this
      this.timerId = setInterval(function () {
        self.refreshAllCodes()
      }, 1000)
    },
    refreshAllCodes() {
      var now = Math.floor(Date.now() / 1000)
      for (var i = 0; i < this.dataList.length; i++) {
        var item = this.dataList[i]
        if (!item.text) {
          item.code = ''
          item.remaining = TIME_STEP
          continue
        }
        var result = this.computeTOTP(item.text, now)
        item.code = result.code
        item.remaining = result.remaining
      }
    },
    computeTOTP(key, now) {
      try {
        now = now || Math.floor(Date.now() / 1000)
        var remaining = TIME_STEP - (now % TIME_STEP)
        var movingFactor = Math.floor(now / TIME_STEP)

        var normKey = key.replace(/[\s\-]/g, '').toUpperCase()
        var keyBytes = base32.decode(normKey)

        var factorBytes = new Array(8)
        var mf = movingFactor
        for (var i = 7; i >= 0; i--) {
          factorBytes[i] = String.fromCharCode(mf & 0xff)
          mf >>>= 8
        }

        var hmacSha = new jssha('SHA-1', 'BYTES')
        hmacSha.setHMACKey(keyBytes, 'BYTES')
        hmacSha.update(factorBytes.join(''))
        var hmac = hmacSha.getHMAC('BYTES')

        var offset = hmac.charCodeAt(hmac.length - 1) & 0x0f
        var binary =
          ((hmac.charCodeAt(offset) & 0x7f) << 24) |
          ((hmac.charCodeAt(offset + 1) & 0xff) << 16) |
          ((hmac.charCodeAt(offset + 2) & 0xff) << 8) |
          (hmac.charCodeAt(offset + 3) & 0xff)
        var otp = (binary % 1000000).toString()
        while (otp.length < 6) {
          otp = '0' + otp
        }

        return { code: otp, remaining: remaining }
      } catch (e) {
        return { code: '------', remaining: TIME_STEP }
      }
    }
  }
}
</script>
<style scoped>
.totp-code { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.totp-digits { font-size: 22px; font-weight: bold; letter-spacing: 3px; font-family: 'Courier New', monospace; }
.totp-timer { color: #999; font-size: 12px; }
</style>
