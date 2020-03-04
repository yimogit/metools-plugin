<template>
  <v-tab :items="tabItems">
    <div slot="twostepvalidation">
      <div class="layui-form-item">
        <v-button @click="addItem">
          <span
            >添加新项
            <i class="layui-icon">&#xe654;</i>
          </span>
        </v-button>
        <v-button @click="saveData">
          <span
            >保存数据
            <i class="layui-icon">&#xe60e; </i>
          </span>
        </v-button>
      </div>
      <fieldset
        class="layui-elem-field"
        v-for="(item, index) in dataList"
        :key="'t_' + index"
      >
        <legend>
          第{{ dataList.length - index }}项
          <button
            class="layui-btn layui-btn-danger layui-btn-mini"
            @click="delItem(index)"
          >
            <i class="layui-icon">&#xe640;</i>
          </button>
        </legend>
        <div class="layui-field-box">
          <div class="layui-form-item">
            <label class="layui-form-label">网站名称</label>
            <div class="layui-input-block">
              <input
                class="layui-input"
                placeholder="网站名称"
                v-model="item.title"
              />
            </div>
          </div>
          <div class="layui-form-item">
            <label class="layui-form-label">绑定密钥</label>
            <div class="layui-input-block">
              <input
                class="layui-input"
                placeholder="双重验证绑定密钥"
                v-model="item.text"
              />
            </div>
          </div>
          <div class="layui-form-item">
            <div class="layui-input-block">
              <v-button @click="genCode(item)" :id="item.text">
                <span
                  >生成验证码
                  <i class="layui-icon">&#x1002;</i>
                </span>
              </v-button>
            </div>
          </div>
          <div class="layui-form-item" v-if="item.code">
            <label class="layui-form-label">验证码</label>
            <div class="layui-input-block">
              <blockquote class="layui-elem-quote">
                {{ item.code }}
                <button
                  class="layui-btn layui-btn-sm btn-copy"
                  :data-clipboard-text="item.code"
                >
                  复制
                </button>
              </blockquote>
            </div>
          </div>
        </div>
      </fieldset>
      <div class="well">
        <p>
          可用于谷歌验证等支持 TOTP 算法的二步验证 算法，结合
          thirty-two，jssha生成
        </p>
        <p>参考：https://github.com/wuyanxin/totp.js</p>
      </div>
    </div>
  </v-tab>
</template>
<script>
import common from '../utils/common'
import base32 from 'thirty-two'
import jssha from 'jssha'
import Clipboard from 'clipboard'
let btnCopy
export default {
  meta: {
    menuName: '双重验证器',
    sort: 10
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'twostepvalidation',
          Title: '双重验证器'
        }
      ],
      dataList: [],
      showMoreBtn: false
    }
  },
  created() {
    let self = this
    self.loadData()
    if (!btnCopy) {
      btnCopy = new Clipboard('.btn-copy')
      btnCopy.on('success', function(e) {
        layer.msg('复制成功:' + e.text)
        e.clearSelection()
      })
    }
  },
  beforeDestroy() {
    layer.closeAll()
  },
  methods: {
    addItem() {
      this.dataList.splice(0, 0, { text: '', title: '', code: '' })
    },
    delItem(index) {
      this.dataList.splice(index, 1)
    },
    loadData() {
      this.dataList = JSON.parse(
        localStorage.getItem('me_twostepvalidation_list') || '[]'
      )
        .filter(s => s.text)
        .map(s => {
          return Object.assign(s, { code: this.genOTP(s.text) })
        })
      if (this.dataList.length === 0) {
        this.dataList = [{ text: '', title: '', code: '' }]
      }
    },
    saveData() {
      localStorage.setItem(
        'me_twostepvalidation_list',
        JSON.stringify(this.dataList)
      )
      window.layui.layer.msg('保存成功')
    },
    genCode(item) {
      //参考：https://github.com/wuyanxin/totp.js
      var code = this.genOTP(item.text)
      item.code = code
    },
    genOTP(key, timeStep = 30, t0 = 0) {
      var movingFactor = Math.floor((Date.now() / 1000 - t0) / timeStep)
      const hmacSha = new jssha('SHA-1', 'BYTES')
      hmacSha.setHMACKey(base32.decode(key).toString(), 'BYTES')

      const factorByte = this._factor2ByteText(movingFactor)
      hmacSha.update(factorByte)

      const hmac_result = hmacSha.getHMAC('BYTES')
      return this._truncat(hmac_result)
    },
    _truncat(hmac_result) {
      var digit = 6
      const offset = hmac_result[19].charCodeAt() & 0xf
      const bin_code =
        ((hmac_result[offset].charCodeAt() & 0x7f) << 24) |
        ((hmac_result[offset + 1].charCodeAt() & 0xff) << 16) |
        ((hmac_result[offset + 2].charCodeAt() & 0xff) << 8) |
        (hmac_result[offset + 3].charCodeAt() & 0xff)
      let otp = (bin_code % 10 ** digit).toString()
      while (otp.length < digit) {
        otp = '0' + otp
      }
      return otp
    },
    _factor2ByteText(movingFactor) {
      const text = new Array(8)
      for (let i = text.length - 1; i >= 0; i--) {
        text[i] = String.fromCharCode(movingFactor & 0xff)
        movingFactor >>= 8
      }
      return text.join('')
    }
  }
}
</script>
