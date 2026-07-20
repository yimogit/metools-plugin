<template>
  <v-tab :items="tabItems">
    <div slot="pdfwatermark">
      <div class="layui-form-item" style="padding:5px;">
        <span class="wm-label">拖拽 PDF 到下方区域或点击上传</span>
        <v-upload @before="onUploadPdf" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;" accept=".pdf">
          <v-button style="position:absolute;">选择 PDF</v-button>
        </v-upload>
        <v-button v-if="pdfBytes && processedPdfUrl" style="margin-left:10px;" @click="downloadPdf">下载水印 PDF</v-button>
        <v-button v-if="pdfBytes" style="margin-left:5px;" @click="processWatermark" :disabled="!watermarkText || processing">
          <span v-if="processing">处理中...</span>
          <span v-else>应用水印</span>
        </v-button>
      </div>

      <div class="layui-form-item" style="padding:5px;" v-if="pdfBytes">
        <span style="line-height:38px;color:#1aa094;">已加载 {{ pageCount }} 页 PDF</span>
      </div>

      <div class="wm-controls">
        <div class="wm-control-group">
          <label class="wm-label">文字</label>
          <input v-model="watermarkText" placeholder="水印文字" class="layui-input" style="width:160px;display:inline-block;" />
        </div>
        <div class="wm-control-group">
          <label class="wm-label">模式</label>
          <v-select v-model="mode" :options="modeOptions" style="width:90px;display:inline-block;"></v-select>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">字号</label>
          <input v-model.number="fontSize" type="number" min="8" max="600" class="layui-input" style="width:70px;display:inline-block;" />
          <span class="wm-unit">px</span>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">透明</label>
          <input v-model.number="opacity" type="range" min="5" max="100" style="width:80px;display:inline-block;vertical-align:middle;" />
          <span style="line-height:38px;font-size:12px;">{{ opacity }}%</span>
        </div>
        <div class="wm-control-group">
          <label class="wm-label">颜色</label>
          <input v-model="color" type="color" style="width:34px;height:34px;display:inline-block;vertical-align:middle;border:none;cursor:pointer;padding:0;" />
        </div>
      </div>

      <div v-if="!isMobile" class="drop-zone" :class="{'drop-zone-active':dragOver}"
        @dragover.prevent="dragOver=true" @dragleave.prevent="dragOver=false" @drop.prevent="onDropPdf">
        <iframe v-if="processedPdfUrl" :src="processedPdfUrl" class="pdf-preview"></iframe>
        <div v-else-if="pdfBytes" class="drop-placeholder" style="line-height:30px;">PDF 已加载，点击「应用水印」预览效果</div>
        <div v-else class="drop-placeholder">拖拽 PDF 文件到此处</div>
      </div>
      <div v-else class="wm-preview-wrap">
        <iframe v-if="processedPdfUrl" :src="processedPdfUrl" class="pdf-preview-m"></iframe>
        <div v-else-if="pdfBytes" class="wm-mobile-hint">PDF 已加载，点击「应用水印」预览效果</div>
        <div v-else class="wm-mobile-hint">点击上方「选择 PDF」上传文件</div>
      </div>
    </div>
  </v-tab>
</template>
<script>
import { PDFDocument, rgb } from 'pdf-lib'

var STORAGE_KEY = 'me_pdfwatermark_config'
function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch (e) { return {} }
}
function saveConfig(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default {
  meta: { menuName: 'PDF 加水印', sort: 14 },
  data() {
    var saved = loadConfig()
    return {
      tabItems: [{ Name: 'pdfwatermark', Title: 'PDF 水印' }],
      pdfBytes: null,
      processedPdfUrl: null,
      pageCount: 0,
      watermarkText: saved.watermarkText || '水印',
      mode: saved.mode || 'tile',
      modeOptions: [
        { Text: '居中', Value: 'center' },
        { Text: '平铺', Value: 'tile' }
      ],
      fontSize: saved.fontSize || 48,
      opacity: saved.opacity != null ? saved.opacity : 30,
      color: saved.color || '#999999',
      dragOver: false,
      processing: false,
      fileName: '',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200
    }
  },
  computed: {
    isMobile() { return this.windowWidth < 768 }
  },
  mounted() {
    var self = this
    window.addEventListener('resize', function () { self.windowWidth = window.innerWidth })
  },
  methods: {
    saveSettings() {
      saveConfig({
        watermarkText: this.watermarkText,
        mode: this.mode,
        fontSize: this.fontSize,
        opacity: this.opacity,
        color: this.color
      })
    },
    onUploadPdf(base64) {
      var bytes = this.base64ToBytes(base64)
      this.loadPdf(bytes)
    },
    onDropPdf(e) {
      this.dragOver = false
      var file = e.dataTransfer.files[0]
      if (!file) return
      this.readPdfFile(file)
    },
    readPdfFile(file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
      this.fileName = file.name
      var reader = new FileReader()
      var self = this
      reader.onload = function (ev) {
        var bytes = new Uint8Array(ev.target.result)
        self.loadPdf(bytes)
      }
      reader.readAsArrayBuffer(file)
    },
    base64ToBytes(base64) {
      var raw = atob(base64.split(',')[1] || base64)
      var bytes = new Uint8Array(raw.length)
      for (var i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i)
      }
      return bytes
    },
    loadPdf(bytes) {
      this.pdfBytes = bytes
      this.processedPdfUrl = null
      var self = this
      PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (doc) {
        self.pageCount = doc.getPageCount()
      }).catch(function () {
        self.pageCount = 0
      })
    },
    createWatermarkImage() {
      var canvas = document.createElement('canvas')
      var ctx = canvas.getContext('2d')
      var fs = this.fontSize || 48
      ctx.font = 'bold ' + fs + 'px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif'
      var metrics = ctx.measureText(this.watermarkText)
      canvas.width = Math.ceil(metrics.width) + 20
      canvas.height = Math.ceil(fs * 1.5) + 10
      ctx.font = 'bold ' + fs + 'px "Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = this.hexToRgba(this.color, this.opacity / 100)
      ctx.fillText(this.watermarkText, canvas.width / 2, canvas.height / 2)
      return canvas
    },
    processWatermark() {
      if (!this.pdfBytes || !this.watermarkText) return
      this.saveSettings()
      this.processing = true
      var self = this
      var wmCanvas = this.createWatermarkImage()
      var wmDataUrl = wmCanvas.toDataURL('image/png')
      var wmBytesBase64 = wmDataUrl.split(',')[1]
      var wmRaw = atob(wmBytesBase64)
      var wmPngBytes = new Uint8Array(wmRaw.length)
      for (var i = 0; i < wmRaw.length; i++) { wmPngBytes[i] = wmRaw.charCodeAt(i) }

      var pdfBytes = this.pdfBytes
      PDFDocument.load(pdfBytes, { ignoreEncryption: true }).then(function (doc) {
        return doc.embedPng(wmPngBytes).then(function (wmImage) {
          var pages = doc.getPages()
          var wmW = wmImage.width
          var wmH = wmImage.height
          var alpha = self.opacity / 100
          var colorParts = self.hexToRgb(self.color)

          for (var p = 0; p < pages.length; p++) {
            var page = pages[p]
            var size = page.getSize()
            var pw = size.width
            var ph = size.height
            var wmScaledW = wmW
            var wmScaledH = wmH

            if (wmW > pw * 0.8) {
              var scale = (pw * 0.8) / wmW
              wmScaledW = wmW * scale
              wmScaledH = wmH * scale
            }

            if (self.mode === 'center') {
              page.drawImage(wmImage, {
                x: (pw - wmScaledW) / 2,
                y: (ph - wmScaledH) / 2,
                width: wmScaledW,
                height: wmScaledH,
                opacity: alpha
              })
            } else {
              var gapX = wmScaledW * 2.5
              var gapY = wmScaledH * 4
              for (var x = -wmScaledW; x < pw + wmScaledW; x += gapX) {
                for (var y = -wmScaledH; y < ph + wmScaledH; y += gapY) {
                  page.drawImage(wmImage, {
                    x: x,
                    y: y,
                    width: wmScaledW,
                    height: wmScaledH,
                    opacity: alpha
                  })
                }
              }
            }
          }
          return doc.save()
        })
      }).then(function (modifiedPdfBytes) {
        var blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' })
        if (self.processedPdfUrl) { URL.revokeObjectURL(self.processedPdfUrl) }
        self.processedPdfUrl = URL.createObjectURL(blob)
        self.processing = false
      }).catch(function (err) {
        console.error(err)
        self.processing = false
        window.layui.layer.msg('处理失败: ' + (err.message || '未知错误'))
      })
    },
    downloadPdf() {
      if (!this.processedPdfUrl) return
      var a = document.createElement('a')
      a.href = this.processedPdfUrl
      a.download = (this.fileName || 'document') + '_watermarked.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    hexToRgba(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16)
      var g = parseInt(hex.slice(3, 5), 16)
      var b = parseInt(hex.slice(5, 7), 16)
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
    },
    hexToRgb(hex) {
      return {
        r: parseInt(hex.slice(1, 3), 16) / 255,
        g: parseInt(hex.slice(3, 5), 16) / 255,
        b: parseInt(hex.slice(5, 7), 16) / 255
      }
    }
  }
}
</script>
<style scoped>
.wm-label { line-height: 38px; margin-right: 10px; }
.wm-controls { padding: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
.wm-control-group { display: inline-flex; align-items: center; gap: 4px; }
.wm-unit { line-height: 38px; color: #999; font-size: 12px; }
.drop-zone { border: 2px dashed #ccc; border-radius: 4px; min-height: 200px; padding: 10px; text-align: center; transition: border-color .2s; margin: 5px; }
.drop-zone-active { border-color: #1aa094; background: rgba(26,160,148,.05); }
.drop-placeholder { color: #999; line-height: 180px; user-select: none; }
.pdf-preview { width: 100%; height: 500px; border: none; }
.pdf-preview-m { width: 100%; height: 400px; border: none; }
.wm-preview-wrap { padding: 5px; }
.wm-mobile-hint { color: #999; text-align: center; padding: 40px 10px; font-size: 13px; }
@media (max-width: 767px) {
  .wm-label { line-height: 30px; }
  .wm-controls { flex-direction: column; align-items: flex-start; gap: 6px; }
}
</style>
