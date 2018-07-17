<template>
  <v-tab :items="tabItems">
    <div slot="generatecode">
      <v-input-txt label="文本/Url" placeholder="将要生成二维码的文本或链接" v-model="dataTxt"></v-input-txt>
      <div class="layui-form-item layui-form-text">

        <input type="color" class="layui-input" placeholder="颜色 默认#ffffff" v-model="color" @change="convert(dataTxt,color,bgcolor)" />
      </div>
      <div class="layui-form-item layui-form-text">
        <input type="color" class="layui-input" placeholder="背景 默认#1aa094" v-model="bgcolor" @change="convert(dataTxt,color,bgcolor)" />
      </div>
      <!-- <div class="layui-form-item">
        <v-button @click="convert(dataTxt,color,bgcolor)">生成</v-button>
      </div> -->
      <div class="layui-form-item">
        <img :src="qrcodeImg" />
      </div>
    </div>
    <div slot="decode">
      <div id="qrfile" qrCanvas="qr-canvas" qrResult="qrcode_content">
        <div title="把您的二维码拖到这儿，即可识别内容">
          <div class="browser" id="canvas_ext_div">
            <label style="height:30px;line-height:30px;">
              <span>选择要识别的二维码，或者拖动图片到面板中</span>
              <input type="file" name="files" accept="image/*" id="ewmfile" title="选择文件后自动识别">
            </label>
          </div>
        </div>
        <canvas style="border: 1px solid #CCC;" id="qr-canvas"></canvas>
      </div>
      <div>识别结果：
        <p id="qrcode_content" style="border: 1px solid #ccc;line-height: 30px;"></p>
      </div>
    </div>
  </v-tab>
</template>
<script>
import jrQrcode from 'jr-qrcode'
import webqr from '../assets/qrcode/webqr.js'
import common from '../utils/common'
export default {
  meta: {
    menuName: '二维码生成/识别',
    sort: 101
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'generatecode',
          Title: '二维码生成'
        },
        {
          Name: 'decode',
          Title: '二维码解码'
        }
      ],
      qrcodeImg: '',
      dataTxt: '',
      color: '#ffffff',
      bgcolor: '#1aa094',
      imgText: ''
    }
  },
  created() {
    let self = this
    window.webqr = webqr
    if (typeof chrome != undefined && chrome.tabs) {
      chrome.tabs.getSelected(function(tab) {
        self.dataTxt = tab.url
      })
    } else {
      self.dataTxt = location.href
    }
    this.$nextTick(() => {
      layui.jquery('#ewmfile').change(function() {
        webqr.handleFiles(this.files)
      })
      this.selectDecode()
    })
  },
  watch: {
    dataTxt: 'zidong'
  },
  methods: {
    zidong() {
      this.convert(this.dataTxt, this.color, this.bgcolor)
    },
    convert(txt, color, bgcolor) {
      var imgBase64 = jrQrcode.getQrBase64(txt, {
        padding: 10, //二维码四边空白，默认为10px
        width: 256, //二维码图片宽度，默认为256px
        height: 256, //二维码图片高度，默认为256px
        correctLevel: QRErrorCorrectLevel.H, //二维码容错level，默认为高
        background: color || '#ffffff', //二维码颜色
        foreground: bgcolor || '#1aa094' //二维码背景颜色
      })
      this.qrcodeImg = imgBase64
    },
    selectDecode() {
      webqr.load('qrfile', 200, 200)
    }
  }
}
</script>