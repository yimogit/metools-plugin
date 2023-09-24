<template>
  <v-tab :items="tabItems">
    <div slot="fanyi">
      <div class="layui-form-item layui-form-text">
        <textarea v-model="model.beforeTxt" @keydown.space="fanyi" @keyup.ctrl.86="fanyi"
          placeholder="请输入转换前字符串... 粘贴/空格后自动翻译" class="layui-textarea"></textarea>
      </div>
      <div class="layui-form-item layui-form-text">
        <v-select v-model="currentOption" :options="typeOptions" @change="fanyi"></v-select>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea v-model="model.afterTxt" rows="13" placeholder="翻译结果..." class="layui-textarea"></textarea>
      </div>
      <div class="layui-form-item layui-form-text">
        <pre v-html="model.jsonData" v-if="model.jsonData" class="layui-code"></pre>
      </div>
    </div>
  </v-tab>
</template>
<script>
import common from '../utils/common'
import CryptoJS from 'crypto-js'
export default {
  meta: {
    menuName: '在线翻译',
    sort: 90,
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'fanyi',
          Title: '在线翻译',
        },
      ],
      currentOption: 1,
      typeOptions: [],
      model: {
        beforeTxt: '',
        afterTxt: '',
        afterTxt: '',
        jsonData: '',
      },
      config: {
        baiduAppId: '20170416000044969',
        baiduAppKey: 'X1ZMBUNuENgb7pzMVrpA',
        youdaoAppId: '43710a08c729372d',
        youdaoAppKey: 'LQlyErvEpecLMhUhTGOW0EjveWtqTg58',
      }
    }
  },
  watch: {
    $route: 'fetchData',
    'model.afterTxt': 'saveData',
  },
  created() {
    this.loadData()
    this.fetchData()
  },
  methods: {
    loadData() {
      this.model =
        JSON.parse(localStorage.getItem('fanyi_model') || 'null') || this.model
      this.config = Object.assign(this.config, JSON.parse(localStorage.getItem('fanyi_config') || 'null'))
    },
    saveData() {
      localStorage.setItem('fanyi_model', JSON.stringify(this.model))
    },
    fetchData() {
      this.typeOptions.push({
        Text: '百度翻译',
        Value: 1,
      })
      this.typeOptions.push({
        Text: '有道翻译',
        Value: 2,
      })
    },
    fanyi() {
      switch (this.currentOption) {
        case 1:
          this.baidufanyi()
          break
        case 2:
          this.youdaofanyi()
          break
        default:
          break
      }
    },
    youdaofanyi() {
      let self = this
      var str = this.model.beforeTxt
      if (common.trim(str) == '') {
        self.model.beforeTxt = ''
        return
      }
      var query = str
      var appKey = self.config.youdaoAppId
      var key = self.config.youdaoAppKey //注意：暴露appSecret，有被盗用造成损失的风险
      var salt = new Date().getTime()
      var curtime = Math.round(new Date().getTime() / 1000)
      // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
      var from = 'auto'
      var to = 'zh-CHS'
      var str1 = appKey + truncate(query) + salt + curtime + key
      var sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex)
      var api = 'https://openapi.youdao.com/api'
      var data = {
        q: query,
        appKey: appKey,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
        signType: 'v3',
        curtime: curtime,
      }
      if (typeof chrome != undefined && chrome.tabs) {
        common.SendPostRequest(api, data, function (text) {
          var resp = JSON.parse(text)
          if (resp.errorCode == 0) {
            self.model.afterTxt = ''
            resp.translation.forEach((item) => {
              self.model.afterTxt += item + '\n'
            })
            self.model.jsonData = ''
          } else {
            self.model.afterTxt = '翻译失败~~~可以在设置中设置自己的密钥~~~~'
            self.model.jsonData = JSON.stringify(resp)
          }
        })
        return
      }
      layui.jquery.ajax({
        url: api,
        type: 'post',
        dataType: 'jsonp',
        data: data,
        success: function (resp) {
          if (resp.errorCode == 0) {
            self.model.afterTxt = ''
            resp.translation.forEach((item) => {
              self.model.afterTxt += item + '\n'
            })
            self.model.jsonData = ''
          } else {
            self.model.afterTxt = '翻译失败~~~可以在设置中设置自己的密钥~~~~'
            self.model.jsonData = JSON.stringify(resp)
          }
        },
        error: function (data) {
          self.model.afterTxt = '翻译失败~~~可以在设置中设置自己的密钥~~~~'
          self.model.jsonData = JSON.stringify(data)
        },
      })

      function truncate(q) {
        var len = q.length
        if (len <= 20) return q
        return q.substring(0, 10) + len + q.substring(len - 10, len)
      }
    },
    baidufanyi() {
      //http://api.fanyi.baidu.com/api/trans/product/apihelp
      let self = this
      var url =
        common.getProtocol() == 'http'
          ? 'http://api.fanyi.baidu.com/api/trans/vip/translate'
          : 'https://fanyi-api.baidu.com/api/trans/vip/translate'
      if (common.trim(self.model.beforeTxt) == '') {
        self.model.beforeTxt = ''
        return
      }
      var appid = self.config.baiduAppId
      var key = self.config.baiduAppKey
      var salt = new Date().getTime()
      var query = self.model.beforeTxt.trim()
      // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
      var from = 'auto'
      var to = 'auto'
      var str1 = appid + query + salt + key
      var sign = CryptoJS['MD5'](str1).toString()
      var data = {
        q: query,
        appid: appid,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
      }
      if (typeof chrome != undefined && chrome.tabs) {
        common.SendGetRequest(url, data, function (text) {
          self.model.afterTxt = ''
          JSON.parse(text).trans_result.forEach((item) => {
            self.model.afterTxt += item.dst + '\n'
          })
          self.model.jsonData = ''
        })
        return
      }
      layui.jquery.ajax({
        url: url,
        type: 'get',
        dataType: 'jsonp',
        data: data,
        success: function (resp) {
          if (!resp.trans_result) {
            self.model.afterTxt = '翻译失败~~~可以在设置中设置自己的密钥~~~~'
            self.model.jsonData = JSON.stringify(data)
            return
          }
          self.model.afterTxt = ''
          resp.trans_result.forEach((item) => {
            self.model.afterTxt += item.dst + '\n'
          })
          self.model.jsonData = ''
        },
        error: function (data) {
          self.model.afterTxt = '翻译失败~~~可以在设置中设置自己的密钥~~~~'
          self.model.jsonData = JSON.stringify(data)
        },
      })
    },
  },
}
</script>
<style scoped>
.areaResult {
  width: 48%;
  float: left;
  margin-right: 1%;
}
</style>
