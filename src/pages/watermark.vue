<template>
  <v-tab :items="tabItems">
    <div slot="watermark">
      <div class="wm-toolbar">
        <span class="wm-toolbar-text">拖拽图片、粘贴或点击上传</span>
        <v-upload @before="onUpload" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;">
          <v-button style="position:absolute;">选择图片</v-button>
        </v-upload>
        <v-button v-if="srcImage" class="wm-dl-btn" @click="downloadImage">下载水印图片</v-button>
      </div>

      <div class="wm-controls">
        <div class="wm-control-group">
          <label class="wm-label">文字</label>
          <input v-model="watermarkText" @input="onSettingChange" placeholder="水印文字" class="layui-input wm-input-text" />
        </div>
        <div class="wm-control-group">
          <label class="wm-label">模式</label>
          <v-select v-model="mode" :options="modeOptions" @change="onSettingChange" style="width:90px;display:inline-block;"></v-select>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">字号</label>
          <input v-model.number="fontSize" @input="onSettingChange" type="number" min="8" max="600" :placeholder="String(defaultFontSize)" class="layui-input wm-input-num" />
          <span class="wm-unit">px</span>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">透明</label>
          <input v-model.number="opacity" @input="onSettingChange" type="range" min="5" max="100" class="wm-range" />
          <span class="wm-range-val">{{ opacity }}%</span>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">颜色</label>
          <input v-model="color" @input="onSettingChange" type="color" class="wm-color" />
        </div>
      </div>

      <div v-if="!isMobile" class="drop-zone" :class="{ 'drop-zone-active': dragOver }"
        @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false" @drop.prevent="onDrop">
        <img v-if="srcImage" :src="srcImage" class="wm-preview" />
        <div v-else class="drop-placeholder">拖拽图片到此处，或 Ctrl+V 粘贴</div>
      </div>
      <div v-else class="wm-preview-wrap">
        <img v-if="srcImage" :src="srcImage" class="wm-preview-m" />
        <div v-else class="wm-mobile-hint">点击上方「选择图片」上传或从相册粘贴</div>
      </div>
    </div>
  </v-tab>
</template>
<script>
var STORAGE_KEY = 'me_watermark_config'

function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch (e) { return {} }
}
function saveConfig(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default {
  meta: { menuName: '图片加水印', sort: 15 },
  data() {
    var saved = loadConfig()
    return {
      tabItems: [{ Name: 'watermark', Title: '图片水印' }],
      srcImage: null,
      originalImage: null,
      watermarkText: saved.watermarkText || '水印',
      mode: saved.mode || 'tile',
      modeOptions: [
        { Text: '居中', Value: 'center' },
        { Text: '平铺', Value: 'tile' }
      ],
      fontSize: saved.fontSize || null,
      opacity: saved.opacity != null ? saved.opacity : 40,
      color: saved.color || '#999999',
      dragOver: false,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200
    }
  },
  computed: {
    isMobile() {
      return this.windowWidth < 768
    },
    defaultFontSize() {
      return this.isMobile ? 32 : 20
    }
  },
  mounted() {
    this.pasteInit()
    var self = this
    window.addEventListener('resize', function () {
      self.windowWidth = window.innerWidth
    })
  },
  methods: {
    onSettingChange() {
      saveConfig({
        watermarkText: this.watermarkText,
        mode: this.mode,
        fontSize: this.fontSize,
        opacity: this.opacity,
        color: this.color
      })
      this.renderWatermark()
    },
    onUpload(base64) { this.loadImage(base64) },
    onDrop(e) {
      this.dragOver = false
      var file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        var reader = new FileReader()
        reader.onload = function (ev) { this.loadImage(ev.target.result) }.bind(this)
        reader.readAsDataURL(file)
      }
    },
    pasteInit() {
      var self = this
      document.addEventListener('paste', function (e) {
        if (!(e.clipboardData && e.clipboardData.items)) return
        for (var i = 0; i < e.clipboardData.items.length; i++) {
          var item = e.clipboardData.items[i]
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            var file = item.getAsFile()
            var reader = new FileReader()
            reader.onload = function (ev) { self.loadImage(ev.target.result) }
            reader.readAsDataURL(file)
          }
        }
      })
    },
    loadImage(src) {
      var img = new Image()
      var self = this
      img.onload = function () {
        self.originalImage = img
        self.srcImage = src
        self.$nextTick(function () { self.renderWatermark() })
      }
      img.src = src
    },
    renderWatermark() {
      if (!this.originalImage || !this.watermarkText) return
      var img = this.originalImage
      var canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      var ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      var fs = this.fontSize || this.defaultFontSize
      ctx.font = 'bold ' + fs + 'px "Microsoft YaHei","PingFang SC",sans-serif'
      ctx.fillStyle = this.colorHexToRgba(this.color, this.opacity / 100)

      if (this.mode === 'center') {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(this.watermarkText, img.naturalWidth / 2, img.naturalHeight / 2)
      } else {
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        var tw = ctx.measureText(this.watermarkText).width
        var th = fs
        var gapX = Math.max(tw * 2.5, 100)
        var gapY = Math.max(th * 4, 80)
        ctx.save()
        ctx.translate(img.naturalWidth / 2, img.naturalHeight / 2)
        ctx.rotate(-25 * Math.PI / 180)
        var range = Math.max(img.naturalWidth, img.naturalHeight) * 1.5
        for (var y = -range; y < range; y += gapY) {
          for (var x = -range; x < range; x += gapX) {
            ctx.fillText(this.watermarkText, x, y)
          }
        }
        ctx.restore()
      }
      this.srcImage = canvas.toDataURL('image/png')
      this._lastCanvas = canvas
    },
    colorHexToRgba(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16)
      var g = parseInt(hex.slice(3, 5), 16)
      var b = parseInt(hex.slice(5, 7), 16)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
    },
    downloadImage() {
      var canvas = this._lastCanvas
      if (!canvas) return
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = 'watermarked.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
  }
}
</script>
<style scoped>
.wm-toolbar { padding: 8px 5px; }
.wm-toolbar-text { line-height: 38px; margin-right: 10px; }
.wm-dl-btn { margin-left: 70px; }

.wm-controls { padding: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
.wm-control-group { display: inline-flex; align-items: center; gap: 4px; }
.wm-label { line-height: 38px; font-size: 13px; white-space: nowrap; }
.wm-input-text { width: 140px; display: inline-block; }
.wm-input-num { width: 62px; display: inline-block; }
.wm-unit { line-height: 38px; color: #999; font-size: 12px; }
.wm-range { width: 80px; display: inline-block; vertical-align: middle; }
.wm-range-val { line-height: 38px; font-size: 12px; min-width: 36px; }
.wm-color { width: 34px; height: 34px; display: inline-block; vertical-align: middle; border: none; cursor: pointer; padding: 0; }

.drop-zone { border: 2px dashed #ccc; border-radius: 4px; min-height: 120px; padding: 10px; text-align: center; transition: border-color .2s; margin: 5px; }
.drop-zone-active { border-color: #1aa094; background: rgba(26,160,148,.05); }
.drop-placeholder { color: #999; line-height: 100px; user-select: none; }
.wm-preview { max-width: 100%; max-height: 400px; display: block; margin: 0 auto; }
.wm-preview-wrap { padding: 5px; }
.wm-preview-m { width: 100%; display: block; }
.wm-mobile-hint { color: #999; text-align: center; padding: 40px 10px; font-size: 13px; }

@media (max-width: 767px) {
  .wm-toolbar-text { display: block; line-height: 28px; margin-bottom: 4px; }
  .wm-dl-btn { margin-left: 5px; }
  .wm-controls { flex-direction: column; align-items: flex-start; gap: 6px; }
  .wm-label { line-height: 30px; min-width: 36px; }
  .wm-input-text { width: 120px; }
  .wm-input-num { width: 56px; }
  .wm-unit { line-height: 30px; }
  .wm-range-val { line-height: 30px; }
  .wm-range { width: 90px; }
}
</style>
