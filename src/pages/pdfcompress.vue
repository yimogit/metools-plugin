<template>
  <v-tab :items="tabItems">
    <div slot="pdfcompress">
      <div class="pc-toolbar">
        <span class="pc-toolbar-text">拖拽 PDF 到下方区域或点击上传</span>
        <v-upload @before="onUpload" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;" accept=".pdf">
          <v-button style="position:absolute;">选择 PDF</v-button>
        </v-upload>
        <v-button v-if="compressedPdfUrl" style="margin-left:10px;" @click="downloadPdf">下载压缩文件</v-button>
        <v-button v-if="originalBytes" style="margin-left:5px;" @click="compressPdf" :disabled="processing">
          <span v-if="processing">压缩中...</span>
          <span v-else>开始压缩</span>
        </v-button>
      </div>

      <div class="pc-info" v-if="originalBytes">
        <div class="pc-info-row">
          <span class="pc-info-label">原始大小：</span>
          <span class="pc-info-val">{{ formatSize(originalSize) }}</span>
          <span class="pc-info-label" style="margin-left:16px;">页数：</span>
          <span class="pc-info-val">{{ pageCount }} 页</span>
          <span v-if="compressedSize != null" class="pc-info-label" style="margin-left:16px;">压缩后：</span>
          <span v-if="compressedSize != null" class="pc-info-val pc-reduced">{{ formatSize(compressedSize) }}</span>
          <span v-if="reduction != null" class="pc-info-label" style="margin-left:8px;">减小：</span>
          <span v-if="reduction != null" class="pc-info-val pc-reduced">{{ reduction }}%</span>
        </div>
      </div>

      <div class="pc-controls" v-if="originalBytes">
        <div class="pc-control-group">
          <label class="pc-label">画质</label>
          <v-select v-model="qualityLevel" :options="qualityOptions" style="width:100px;display:inline-block;"></v-select>
        </div>
        <div class="pc-control-group" v-if="qualityLevel === 'custom'">
          <label class="pc-label">JPEG 质量</label>
          <input v-model.number="jpegQuality" type="range" min="10" max="100" class="pc-range" />
          <span class="pc-range-val">{{ jpegQuality }}%</span>
        </div>
        <div class="pc-control-group">
          <label class="pc-label">图片最大宽度</label>
          <input v-model.number="maxImageWidth" type="number" min="200" max="4000" step="100" class="layui-input pc-input-num" />
          <span class="pc-unit">px</span>
        </div>
      </div>

      <div v-if="!isMobile" class="pc-drop-zone" :class="{'pc-drop-active': dragOver}"
        @dragover.prevent="dragOver=true" @dragleave.prevent="dragOver=false" @drop.prevent="onDrop">
        <div v-if="processing" class="pc-status">
          <span class="pc-status-text">压缩处理中...</span>
          <div class="pc-progress"><div class="pc-progress-bar" :style="{width: progress + '%'}"></div></div>
        </div>
        <iframe v-else-if="compressedPdfUrl" :src="compressedPdfUrl" class="pc-preview"></iframe>
        <div v-else-if="originalBytes" class="pc-placeholder">PDF 已加载，调整参数后点击「开始压缩」</div>
        <div v-else class="pc-placeholder">拖拽 PDF 文件到此处</div>
      </div>
      <div v-else class="pc-mobile-wrap">
        <div v-if="processing" class="pc-mobile-hint">压缩处理中... {{ progress }}%</div>
        <iframe v-else-if="compressedPdfUrl" :src="compressedPdfUrl" class="pc-preview-m"></iframe>
        <div v-else-if="originalBytes" class="pc-mobile-hint">PDF 已加载，调整参数后点击「开始压缩」</div>
        <div v-else class="pc-mobile-hint">点击上方「选择 PDF」上传文件</div>
      </div>
    </div>
  </v-tab>
</template>
<script>
var STORAGE_KEY = 'me_pdfcompress_config'
function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch (e) { return {} }
}
function saveConfig(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// pdf-lib 通过 webpack 打包，在全局作用域不可用
// 这里通过 require 延迟加载
var PDFDocument = null

module.exports = {
  meta: { menuName: 'PDF 压缩', sort: 12 },
  data: function () {
    var saved = loadConfig()
    return {
      tabItems: [{ Name: 'pdfcompress', Title: 'PDF 压缩' }],
      originalBytes: null,
      originalSize: 0,
      pageCount: 0,
      compressedBytes: null,
      compressedSize: null,
      compressedPdfUrl: null,
      reduction: null,
      qualityLevel: saved.qualityLevel || 'medium',
      qualityOptions: [
        { Text: '高画质', Value: 'high' },
        { Text: '中等', Value: 'medium' },
        { Text: '高压缩', Value: 'low' },
        { Text: '自定义', Value: 'custom' }
      ],
      jpegQuality: saved.jpegQuality || 60,
      maxImageWidth: saved.maxImageWidth || 1200,
      dragOver: false,
      processing: false,
      progress: 0,
      fileName: '',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200
    }
  },
  computed: {
    isMobile: function () {
      return this.windowWidth < 768
    },
    effectiveQuality: function () {
      var map = { high: 85, medium: 60, low: 30 }
      if (this.qualityLevel === 'custom') return this.jpegQuality
      return map[this.qualityLevel] || 60
    }
  },
  mounted: function () {
    var self = this
    window.addEventListener('resize', function () {
      self.windowWidth = window.innerWidth
    })
  },
  methods: {
    saveSettings: function () {
      saveConfig({
        qualityLevel: this.qualityLevel,
        jpegQuality: this.jpegQuality,
        maxImageWidth: this.maxImageWidth
      })
    },
    formatSize: function (bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    },
    onUpload: function (base64) {
      var bytes = this.base64ToBytes(base64)
      this.loadPdf(bytes)
    },
    onDrop: function (e) {
      this.dragOver = false
      var file = e.dataTransfer.files[0]
      if (!file) return
      this.readFile(file)
    },
    readFile: function (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
      this.fileName = file.name
      this.originalSize = file.size
      this.compressedBytes = null
      this.compressedSize = null
      this.compressedPdfUrl = null
      this.reduction = null
      var self = this
      var reader = new FileReader()
      reader.onload = function (ev) {
        var bytes = new Uint8Array(ev.target.result)
        self.loadPdf(bytes)
      }
      reader.readAsArrayBuffer(file)
    },
    base64ToBytes: function (base64) {
      var raw = atob(base64.split(',')[1] || base64)
      var bytes = new Uint8Array(raw.length)
      for (var i = 0; i < raw.length; i++) {
        bytes[i] = raw.charCodeAt(i)
      }
      return bytes
    },
    loadPdf: function (bytes) {
      this.originalBytes = bytes
      if (!this.originalSize) this.originalSize = bytes.length
      var self = this
      if (!PDFDocument) {
        PDFDocument = require('pdf-lib').PDFDocument
      }
      PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (doc) {
        self.pageCount = doc.getPageCount()
      }).catch(function () {
        self.pageCount = 0
      })
    },
    compressPdf: function () {
      if (!this.originalBytes) return
      this.saveSettings()
      this.processing = true
      this.progress = 0
      this.compressedBytes = null
      this.compressedSize = null
      this.reduction = null

      var self = this
      if (!PDFDocument) {
        PDFDocument = require('pdf-lib').PDFDocument
      }

      var quality = this.effectiveQuality / 100
      var maxWidth = this.maxImageWidth

      PDFDocument.load(this.originalBytes, { ignoreEncryption: true }).then(function (doc) {
        return self.compressImages(doc, quality, maxWidth).then(function () {
          return doc.save({
            useObjectStreams: true,
            addDefaultPage: false
          })
        })
      }).then(function (savedBytes) {
        self.compressedBytes = savedBytes
        self.compressedSize = savedBytes.length
        var orig = self.originalSize || self.originalBytes.length
        if (orig > 0) {
          self.reduction = ((1 - savedBytes.length / orig) * 100).toFixed(1)
          if (self.reduction < 0) self.reduction = '0.0'
        }
        var blob = new Blob([savedBytes], { type: 'application/pdf' })
        if (self.compressedPdfUrl) { URL.revokeObjectURL(self.compressedPdfUrl) }
        self.compressedPdfUrl = URL.createObjectURL(blob)
        self.processing = false
        self.progress = 100
      }).catch(function (err) {
        console.error(err)
        self.processing = false
        window.layui.layer.msg('压缩失败: ' + (err.message || '未知错误'))
      })
    },
    compressImages: function (doc, quality, maxWidth) {
      var self = this
      var context = doc.context
      var allObjects = []

      try {
        context.enumerateIndirectObjects().forEach(function (ref, obj) {
          allObjects.push({ ref: ref, obj: obj })
        })
      } catch (e) {
        // 某些版本可能不支持 enumerateIndirectObjects
        return Promise.resolve()
      }

      // 找到所有图片流
      var imageStreams = []
      for (var i = 0; i < allObjects.length; i++) {
        var item = allObjects[i]
        var dict = item.obj.dict
        if (!dict) continue
        // 检查是否是图片 XObject
        var subtype = dict.get('Subtype')
        if (subtype && subtype.toString() === '/Image') {
          var width = dict.get('Width')
          var height = dict.get('Height')
          var filter = dict.get('Filter')
          if (width && height) {
            imageStreams.push({
              ref: item.ref,
              obj: item.obj,
              width: Number(width),
              height: Number(height),
              filter: filter ? filter.toString() : null
            })
          }
        }
      }

      if (imageStreams.length === 0) {
        return Promise.resolve()
      }

      var total = imageStreams.length
      var done = 0

      // 逐个处理图片
      function processNext(index) {
        if (index >= imageStreams.length) {
          self.progress = 100
          return Promise.resolve()
        }
        self.progress = Math.round((done / total) * 90)
        var stream = imageStreams[index]
        return self.compressStreamImage(stream, quality, maxWidth).then(function (newBytes) {
          if (newBytes) {
            // 替换图片流数据
            try {
              // pdf-lib 内部替换：清除原始数据并写入新的
              stream.obj.contents = newBytes
              // 更新 Filter 为 DCTDecode (JPEG)
              var dict = stream.obj.dict
              dict.set('Filter', context.obj('DCTDecode'))
              // 移除不必要的条目
              dict.delete('DecodeParms')
              dict.delete('SMask')
            } catch (e) {
              // 静默失败，保持原始图片
            }
          }
          done++
          return processNext(index + 1)
        })
      }

      return processNext(0)
    },
    compressStreamImage: function (stream, quality, maxWidth) {
      var self = this
      // 获取图片原始字节
      var rawBytes = null
      try {
        // pdf-lib 的 stream 对象可能有不同的获取内容方式
        if (stream.obj.contents && stream.obj.contents.length > 0) {
          rawBytes = stream.obj.contents
        } else if (stream.obj.getContents) {
          rawBytes = stream.obj.getContents()
        } else if (stream.obj.bytes) {
          rawBytes = stream.obj.bytes
        }
      } catch (e) {
        return Promise.resolve(null)
      }

      if (!rawBytes || rawBytes.length === 0) return Promise.resolve(null)

      // 如果图片宽度已经小于 maxWidth，且质量要求高，跳过
      if (stream.width <= maxWidth && quality >= 0.85) {
        return Promise.resolve(null)
      }

      // 尝试通过 canvas 重新压缩
      return new Promise(function (resolve) {
        var blob = new Blob([rawBytes])
        var url = URL.createObjectURL(blob)
        var img = new Image()
        img.onload = function () {
          URL.revokeObjectURL(url)
          var w = stream.width
          var h = stream.height
          // 如果超过最大宽度，等比缩小
          if (w > maxWidth) {
            var scale = maxWidth / w
            w = Math.round(w * scale)
            h = Math.round(h * scale)
          }
          var canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          var ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, w, h)
          canvas.toBlob(function (blob2) {
            if (!blob2) { resolve(null); return }
            var reader = new FileReader()
            reader.onload = function () {
              var arr = new Uint8Array(reader.result)
              // 如果压缩后反而更大，不替换
              if (arr.length >= rawBytes.length && quality >= 0.5) {
                resolve(null)
              } else {
                resolve(arr)
              }
            }
            reader.readAsArrayBuffer(blob2)
          }, 'image/jpeg', quality)
        }
        img.onerror = function () {
          URL.revokeObjectURL(url)
          resolve(null)
        }
        img.src = url
      })
    },
    downloadPdf: function () {
      if (!this.compressedPdfUrl) return
      var a = document.createElement('a')
      a.href = this.compressedPdfUrl
      a.download = (this.fileName || 'document').replace('.pdf', '') + '_compressed.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }
}
</script>
<style scoped>
.pc-toolbar { padding: 6px 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.pc-toolbar-text { line-height: 38px; margin-right: 10px; }
.pc-info { padding: 5px; }
.pc-info-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.pc-info-label { font-size: 13px; color: #666; line-height: 28px; }
.pc-info-val { font-size: 13px; font-weight: bold; color: #333; line-height: 28px; }
.pc-reduced { color: #1aa094; }

.pc-controls { padding: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; }
.pc-control-group { display: inline-flex; align-items: center; gap: 4px; }
.pc-label { line-height: 38px; font-size: 13px; white-space: nowrap; }
.pc-input-num { width: 80px; display: inline-block; }
.pc-unit { line-height: 38px; color: #999; font-size: 12px; }
.pc-range { width: 100px; display: inline-block; vertical-align: middle; }
.pc-range-val { line-height: 38px; font-size: 12px; min-width: 36px; }

.pc-drop-zone { border: 2px dashed #ccc; border-radius: 4px; min-height: 200px; padding: 10px; text-align: center; transition: border-color .2s; margin: 5px; }
.pc-drop-active { border-color: #1aa094; background: rgba(26,160,148,.05); }
.pc-placeholder { color: #999; line-height: 180px; user-select: none; }
.pc-status { padding: 40px 20px; }
.pc-status-text { font-size: 14px; color: #666; }
.pc-progress { height: 8px; background: #eee; border-radius: 4px; margin-top: 12px; max-width: 300px; margin-left: auto; margin-right: auto; overflow: hidden; }
.pc-progress-bar { height: 100%; background: #1aa094; border-radius: 4px; transition: width .3s; width: 0%; }
.pc-preview { width: 100%; height: 500px; border: none; }
.pc-preview-m { width: 100%; height: 400px; border: none; }
.pc-mobile-wrap { padding: 5px; }
.pc-mobile-hint { color: #999; text-align: center; padding: 40px 10px; font-size: 13px; }

@media (max-width: 767px) {
  .pc-toolbar-text { display: block; line-height: 28px; margin-bottom: 4px; }
  .pc-controls { flex-direction: column; align-items: flex-start; gap: 6px; }
  .pc-label { line-height: 30px; }
  .pc-unit { line-height: 30px; }
  .pc-range-val { line-height: 30px; }
}
</style>
