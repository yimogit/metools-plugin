<template>
  <v-tab :items="tabItems">
    <!-- === 压缩 Tab === -->
    <div slot="compress">
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

    <!-- === 提取图片 Tab === -->
    <div slot="extract">
      <div class="pc-toolbar">
        <span class="pc-toolbar-text">拖拽 PDF 到下方区域或点击上传</span>
        <v-upload @before="onUploadExtract" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;" accept=".pdf">
          <v-button style="position:absolute;">选择 PDF</v-button>
        </v-upload>
        <v-button v-if="extractImages.length" style="margin-left:10px;" @click="downloadAllImages">下载全部图片</v-button>
        <v-button v-if="extractOriginBytes" style="margin-left:5px;" @click="startExtract" :disabled="extracting">
          <span v-if="extracting">提取中...</span>
          <span v-else>提取图片</span>
        </v-button>
      </div>

      <div class="pc-info" v-if="extractOriginBytes">
        <div class="pc-info-row">
          <span class="pc-info-label">PDF 大小：</span><span class="pc-info-val">{{ formatSize(extractOriginSize) }}</span>
          <span class="pc-info-label" style="margin-left:16px;">页数：</span><span class="pc-info-val">{{ extractPageCount }} 页</span>
          <span v-if="extractImages.length" class="pc-info-label" style="margin-left:16px;">找到：</span>
          <span v-if="extractImages.length" class="pc-info-val pc-reduced">{{ extractImages.length }} 张图片</span>
        </div>
      </div>

      <div class="pc-drop-zone" :class="{'pc-drop-active': extractDragOver}"
        @dragover.prevent="extractDragOver=true" @dragleave.prevent="extractDragOver=false" @drop.prevent="onDropExtract"
        style="min-height:auto; padding:10px;">
        <div v-if="extracting" class="pc-status">
          <span class="pc-status-text">正在提取图片...</span>
          <div class="pc-progress"><div class="pc-progress-bar" :style="{width: extractProgress + '%'}"></div></div>
        </div>

        <div v-else-if="extractImages.length" class="ei-grid">
          <div v-for="(img, idx) in extractImages" :key="idx" class="ei-card">
            <div class="ei-page" v-if="img.pageNum">第 {{ img.pageNum }} 页</div>
            <img :src="img.url" class="ei-thumb" @click="previewImage(img)" />
            <div class="ei-meta">
              <span class="ei-size">{{ img.width }}x{{ img.height }}</span>
              <span class="ei-bytes">{{ formatSize(img.bytes) }}</span>
              <a class="ei-dl" @click="downloadImage(img, idx)">下载</a>
            </div>
          </div>
        </div>

        <div v-else-if="extractOriginBytes" class="pc-placeholder" style="line-height:60px;">PDF 已加载，点击「提取图片」</div>
        <div v-else class="pc-placeholder" style="line-height:60px;">拖拽 PDF 文件到此处</div>
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

var PDFDocument = null
var PDFName = null

module.exports = {
  meta: { menuName: 'PDF 操作', sort: 12 },
  data: function () {
    var saved = loadConfig()
    return {
      tabItems: [
        { Name: 'compress', Title: '压缩' },
        { Name: 'extract', Title: '提取图片' }
      ],
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

      extractOriginBytes: null,
      extractOriginSize: 0,
      extractPageCount: 0,
      extractImages: [],
      extractDragOver: false,
      extracting: false,
      extractProgress: 0,
      extractFileName: '',

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
      if (bytes == null) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    },
    ensurePdfLib: function () {
      if (!PDFDocument) {
        var pdfLib = require('pdf-lib')
        PDFDocument = pdfLib.PDFDocument
        PDFName = pdfLib.PDFName
      }
    },

    // ==================== 压缩 Tab ====================
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
      this.ensurePdfLib()
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
      this.ensurePdfLib()
      var quality = this.effectiveQuality / 100
      var maxWidth = this.maxImageWidth

      PDFDocument.load(this.originalBytes, { ignoreEncryption: true }).then(function (doc) {
        return self.compressImages(doc, quality, maxWidth).then(function () {
          return doc.save({ useObjectStreams: true, addDefaultPage: false })
        })
      }).then(function (savedBytes) {
        self.compressedBytes = savedBytes
        self.compressedSize = savedBytes.length
        var orig = self.originalSize || self.originalBytes.length
        if (orig > 0) {
          self.reduction = ((1 - savedBytes.length / orig) * 100).toFixed(1)
          if (parseFloat(self.reduction) < 0) self.reduction = '0.0'
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

    // ==================== 提取图片 Tab ====================
    onUploadExtract: function (base64) {
      var bytes = this.base64ToBytes(base64)
      this.loadExtractPdfMain(bytes)
    },
    onDropExtract: function (e) {
      this.extractDragOver = false
      var file = e.dataTransfer.files[0]
      if (!file) return
      this.readExtractFile(file)
    },
    readExtractFile: function (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
      this.extractFileName = file.name
      this.extractOriginSize = file.size
      this.extractImages = []
      var self = this
      var reader = new FileReader()
      reader.onload = function (ev) {
        var bytes = new Uint8Array(ev.target.result)
        self.loadExtractPdfMain(bytes)
      }
      reader.readAsArrayBuffer(file)
    },
    loadExtractPdfMain: function (bytes) {
      this.extractOriginBytes = bytes
      this.extractOriginSize = bytes.length
      this.extractImages = []
      this.loadExtractPdf(bytes)
    },
    loadExtractPdf: function (bytes) {
      var self = this
      this.ensurePdfLib()
      PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (doc) {
        self.extractPageCount = doc.getPageCount()
      }).catch(function () {
        self.extractPageCount = 0
      })
    },
    startExtract: function () {
      if (!this.extractOriginBytes) return
      this.extracting = true
      this.extractProgress = 0
      this.extractImages = []

      var self = this
      this.ensurePdfLib()

      PDFDocument.load(this.extractOriginBytes, { ignoreEncryption: true }).then(function (doc) {
        return self.extractAllImages(doc)
      }).then(function () {
        self.extracting = false
        self.extractProgress = 100
      }).catch(function (err) {
        console.error(err)
        self.extracting = false
        window.layui.layer.msg('提取失败: ' + (err.message || '未知错误'))
      })
    },

    // 遍历页面 XObject 资源，建立 图片对象编号->页码 映射
    buildPageImageMap: function (doc) {
      var context = doc.context
      var pages = doc.getPages()
      var map = {}

      for (var p = 0; p < pages.length; p++) {
        try {
          var resources = null
          if (typeof pages[p].node.Resources === 'function') {
            resources = pages[p].node.Resources()
          } else {
            resources = pages[p].node.dict.get(PDFName.of('Resources'))
          }
          if (!resources) continue
          var xobjVal = resources.get(PDFName.of('XObject'))
          if (!xobjVal) continue

          var xobjDict = xobjVal
          if (!xobjDict.dict) {
            xobjDict = context.lookup(xobjVal)
          }
          if (!xobjDict || !xobjDict.dict) continue

          var entries = Array.from(xobjDict.dict.entries())
          for (var e = 0; e < entries.length; e++) {
            var val = entries[e][1]
            if (val && val.objectNumber !== undefined) {
              map[val.objectNumber] = p + 1
            }
          }
        } catch (e) { /* skip page */ }
      }

      return map
    },

    extractAllImages: function (doc) {
      var self = this
      var context = doc.context
      var pageImageMap = this.buildPageImageMap(doc)

      var entries = []
      try {
        entries = context.enumerateIndirectObjects()
      } catch (e) {
        return Promise.resolve()
      }

      var imageStreams = []
      for (var i = 0; i < entries.length; i++) {
        var ref = entries[i][0]
        var obj = entries[i][1]
        if (!obj || !obj.dict) continue
        try {
          var subtype = obj.dict.get(PDFName.of('Subtype'))
          if (!subtype || subtype.toString() !== '/Image') continue
          var width = obj.dict.get(PDFName.of('Width'))
          var height = obj.dict.get(PDFName.of('Height'))
          if (!width || !height) continue

          var pageNum = 0
          if (ref && ref.objectNumber !== undefined) {
            pageNum = pageImageMap[ref.objectNumber] || 0
          }

          imageStreams.push({
            obj: obj,
            ref: ref,
            width: Number(width),
            height: Number(height),
            pageNum: pageNum
          })
        } catch (e2) { /* skip */ }
      }

      imageStreams.sort(function (a, b) {
        return a.pageNum - b.pageNum
      })

      if (imageStreams.length === 0) {
        window.layui.layer.msg('未找到嵌入图片')
        return Promise.resolve()
      }

      var total = imageStreams.length
      var done = 0

      function processNext(index) {
        if (index >= total) {
          self.extractProgress = 100
          return Promise.resolve()
        }
        self.extractProgress = Math.round((done / total) * 100)
        return self.extractSingleImage(imageStreams[index]).then(function (result) {
          if (result) {
            result.pageNum = imageStreams[index].pageNum
            self.extractImages.push(result)
          }
          done++
          return processNext(index + 1)
        })
      }

      return processNext(0)
    },

    extractSingleImage: function (stream) {
      var rawBytes = null
      try {
        var obj = stream.obj
        if (obj.contents && obj.contents.length > 0) {
          rawBytes = new Uint8Array(obj.contents)
        } else if (typeof obj.getContents === 'function') {
          rawBytes = obj.getContents()
        }
      } catch (e) {
        return Promise.resolve(null)
      }

      if (!rawBytes || rawBytes.length === 0) return Promise.resolve(null)

      var dict = stream.obj.dict
      var filter = null
      try {
        filter = dict.get(PDFName.of('Filter'))
        if (filter) filter = filter.toString()
      } catch (e) { /* skip */ }

      var isJpeg = (filter === '/DCTDecode') || (rawBytes[0] === 0xFF && rawBytes[1] === 0xD8)
      var isPng = rawBytes[0] === 0x89 && rawBytes[1] === 0x50 && rawBytes[2] === 0x4E
      var isJpx = filter === '/JPXDecode'

      if (isJpeg || isPng || isJpx) {
        var mime = isJpeg ? 'image/jpeg' : (isPng ? 'image/png' : 'image/jpeg')
        var blob = new Blob([rawBytes], { type: mime })
        var url = URL.createObjectURL(blob)
        return new Promise(function (resolve) {
          var img = new Image()
          img.onload = function () {
            resolve({
              url: url,
              width: stream.width,
              height: stream.height,
              bytes: rawBytes.length,
              mime: mime,
              dataUrl: null
            })
          }
          img.onerror = function () {
            URL.revokeObjectURL(url)
            resolve(null)
          }
          img.src = url
        })
      }

      return this.extractFlateImage(stream, rawBytes)
    },

    extractFlateImage: function (stream, rawBytes) {
      var dict = stream.obj.dict
      var width = stream.width
      var height = stream.height

      var cs = null
      try { cs = dict.get(PDFName.of('ColorSpace')) } catch (e) { /* skip */ }
      var csStr = cs ? cs.toString() : ''

      var components = 1
      if (csStr === '/DeviceRGB') components = 3
      else if (csStr === '/DeviceCMYK') components = 4
      else if (csStr === '/DeviceGray' || csStr === '/G') components = 1
      else {
        var px = width * height
        if (rawBytes.length >= px * 4) components = 4
        else if (rawBytes.length >= px * 3) components = 3
        else components = 1
      }

      var bpc = 8
      try {
        var bpcVal = dict.get(PDFName.of('BitsPerComponent'))
        if (bpcVal) bpc = Number(bpcVal)
      } catch (e) { /* skip */ }

      var predictor = 1
      try {
        var dp = dict.get(PDFName.of('DecodeParms'))
        if (dp && dp.dict) {
          var pred = dp.dict.get(PDFName.of('Predictor'))
          if (pred) predictor = Number(pred)
        }
      } catch (e) { /* skip */ }

      if (predictor >= 10) {
        rawBytes = this.reversePngFilter(rawBytes, width, height, components)
        if (!rawBytes) return Promise.resolve(null)
      }

      return new Promise(function (resolve) {
        try {
          var canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          var ctx = canvas.getContext('2d')
          var imageData = ctx.createImageData(width, height)
          var data = imageData.data

          if (bpc === 8) {
            if (components === 3) {
              for (var i = 0, j = 0; i + 2 < rawBytes.length && j + 3 < data.length; i += 3, j += 4) {
                data[j] = rawBytes[i]
                data[j + 1] = rawBytes[i + 1]
                data[j + 2] = rawBytes[i + 2]
                data[j + 3] = 255
              }
            } else if (components === 1) {
              for (var i = 0, j = 0; i < rawBytes.length && j + 3 < data.length; i++, j += 4) {
                data[j] = data[j + 1] = data[j + 2] = rawBytes[i]
                data[j + 3] = 255
              }
            } else if (components === 4) {
              for (var i = 0, j = 0; i + 3 < rawBytes.length && j + 3 < data.length; i += 4, j += 4) {
                var c = rawBytes[i] / 255
                var m = rawBytes[i + 1] / 255
                var y = rawBytes[i + 2] / 255
                var k = rawBytes[i + 3] / 255
                data[j] = Math.round(255 * (1 - c) * (1 - k))
                data[j + 1] = Math.round(255 * (1 - m) * (1 - k))
                data[j + 2] = Math.round(255 * (1 - y) * (1 - k))
                data[j + 3] = 255
              }
            }
          }

          ctx.putImageData(imageData, 0, 0)
          var pngUrl = canvas.toDataURL('image/png')
          resolve({
            url: pngUrl,
            width: width,
            height: height,
            bytes: rawBytes.length,
            mime: 'image/png',
            dataUrl: pngUrl
          })
        } catch (e) {
          resolve(null)
        }
      })
    },

    reversePngFilter: function (rawBytes, width, height, components) {
      var stride = width * components
      var rowSize = stride + 1
      if (rawBytes.length < rowSize * height) return null

      var result = new Uint8Array(stride * height)
      var prevRow = new Uint8Array(stride)

      for (var y = 0; y < height; y++) {
        var rowStart = y * rowSize
        var filterType = rawBytes[rowStart]
        var srcStart = rowStart + 1
        var dstStart = y * stride

        for (var x = 0; x < stride; x++) {
          var val = rawBytes[srcStart + x]
          var left = x >= components ? result[dstStart + x - components] : 0
          var up = prevRow[x]
          var upLeft = x >= components ? prevRow[x - components] : 0

          switch (filterType) {
            case 0: break
            case 1: val = (val + left) & 0xFF; break
            case 2: val = (val + up) & 0xFF; break
            case 3: val = (val + ((left + up) >> 1)) & 0xFF; break
            case 4:
              var p = left + up - upLeft
              var pa = Math.abs(p - left)
              var pb = Math.abs(p - up)
              var pc = Math.abs(p - upLeft)
              if (pa <= pb && pa <= pc) val = (val + left) & 0xFF
              else if (pb <= pc) val = (val + up) & 0xFF
              else val = (val + upLeft) & 0xFF
              break
          }
          result[dstStart + x] = val
        }
        prevRow = result.subarray(dstStart, dstStart + stride)
      }

      return result
    },

    previewImage: function (img) {
      window.open(img.url, '_blank')
    },
    downloadImage: function (img, idx) {
      var a = document.createElement('a')
      var prefix = (this.extractFileName || 'pdf').replace(/\.pdf$/i, '')
      var ext = img.mime === 'image/jpeg' ? '.jpg' : '.png'
      var pageTag = img.pageNum ? '_p' + img.pageNum : ''
      a.download = prefix + pageTag + '_img' + (idx + 1) + ext
      a.href = img.dataUrl || img.url
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    },
    downloadAllImages: function () {
      var self = this
      var prefix = (this.extractFileName || 'pdf').replace(/\.pdf$/i, '')
      function downloadSeq(i) {
        if (i >= self.extractImages.length) return
        var img = self.extractImages[i]
        var ext = img.mime === 'image/jpeg' ? '.jpg' : '.png'
        var pageTag = img.pageNum ? '_p' + img.pageNum : ''
        var a = document.createElement('a')
        a.download = prefix + pageTag + '_img' + (i + 1) + ext
        a.href = img.dataUrl || img.url
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(function () { downloadSeq(i + 1) }, 500)
      }
      if (self.extractImages.length > 0) downloadSeq(0)
    },

    // ==================== 压缩逻辑 ====================
    compressImages: function (doc, quality, maxWidth) {
      var self = this
      var context = doc.context
      var entries = []

      try {
        entries = context.enumerateIndirectObjects()
      } catch (e) {
        return Promise.resolve()
      }

      var imageStreams = []
      for (var i = 0; i < entries.length; i++) {
        var ref = entries[i][0]
        var obj = entries[i][1]
        if (!obj || !obj.dict) continue
        try {
          var subtype = obj.dict.get(PDFName.of('Subtype'))
          if (!subtype || subtype.toString() !== '/Image') continue
          var width = obj.dict.get(PDFName.of('Width'))
          var height = obj.dict.get(PDFName.of('Height'))
          if (!width || !height) continue
          imageStreams.push({
            ref: ref,
            obj: obj,
            width: Number(width),
            height: Number(height)
          })
        } catch (e2) { /* skip */ }
      }

      if (imageStreams.length === 0) return Promise.resolve()

      var total = imageStreams.length
      var done = 0

      function processNext(index) {
        if (index >= total) {
          self.progress = 100
          return Promise.resolve()
        }
        self.progress = Math.round((done / total) * 90)
        return self.compressStreamImage(imageStreams[index], quality, maxWidth).then(function (newBytes) {
          if (newBytes) {
            try {
              imageStreams[index].obj.contents = newBytes
              var d = imageStreams[index].obj.dict
              d.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
              d.delete(PDFName.of('DecodeParms'))
              d.delete(PDFName.of('SMask'))
            } catch (e) { /* skip */ }
          }
          done++
          return processNext(index + 1)
        })
      }

      return processNext(0)
    },

    compressStreamImage: function (stream, quality, maxWidth) {
      var rawBytes = null
      try {
        if (stream.obj.contents && stream.obj.contents.length > 0) {
          rawBytes = new Uint8Array(stream.obj.contents)
        } else if (typeof stream.obj.getContents === 'function') {
          rawBytes = stream.obj.getContents()
        }
      } catch (e) {
        return Promise.resolve(null)
      }

      if (!rawBytes || rawBytes.length === 0) return Promise.resolve(null)
      if (stream.width <= maxWidth && quality >= 0.85) return Promise.resolve(null)

      var self = this
      var dict = stream.obj.dict
      var filter = null
      try { filter = dict.get(PDFName.of('Filter')); if (filter) filter = filter.toString() } catch (e) {}

      var isJpeg = (filter === '/DCTDecode') || (rawBytes[0] === 0xFF && rawBytes[1] === 0xD8)
      var isPng = rawBytes[0] === 0x89 && rawBytes[1] === 0x50 && rawBytes[2] === 0x4E

      if (isJpeg || isPng || filter === '/JPXDecode') {
        return self.compressViaImage(rawBytes, stream, quality, maxWidth)
      }

      if (filter === '/FlateDecode' || !filter) {
        return self.compressViaRawPixels(rawBytes, stream, quality, maxWidth)
      }

      return Promise.resolve(null)
    },

    compressViaImage: function (rawBytes, stream, quality, maxWidth) {
      return new Promise(function (resolve) {
        var blob = new Blob([rawBytes])
        var url = URL.createObjectURL(blob)
        var img = new Image()
        img.onload = function () {
          URL.revokeObjectURL(url)
          var w = stream.width, h = stream.height
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
              if (arr.length >= rawBytes.length && quality >= 0.5) {
                resolve(null)
              } else {
                resolve(arr)
              }
            }
            reader.readAsArrayBuffer(blob2)
          }, 'image/jpeg', quality)
        }
        img.onerror = function () { URL.revokeObjectURL(url); resolve(null) }
        img.src = url
      })
    },

    compressViaRawPixels: function (rawBytes, stream, quality, maxWidth) {
      var self = this
      var dict = stream.obj.dict
      var width = stream.width
      var height = stream.height

      var cs = null
      try { cs = dict.get(PDFName.of('ColorSpace')) } catch (e) {}
      var csStr = cs ? cs.toString() : ''
      var components = 1
      if (csStr === '/DeviceRGB') components = 3
      else if (csStr === '/DeviceCMYK') components = 4
      else {
        var px = width * height
        if (rawBytes.length >= px * 4) components = 4
        else if (rawBytes.length >= px * 3) components = 3
        else components = 1
      }

      var bpc = 8
      try {
        var bpcVal = dict.get(PDFName.of('BitsPerComponent'))
        if (bpcVal) bpc = Number(bpcVal)
      } catch (e) {}

      var predictor = 1
      try {
        var dp = dict.get(PDFName.of('DecodeParms'))
        if (dp && dp.dict) {
          var pred = dp.dict.get(PDFName.of('Predictor'))
          if (pred) predictor = Number(pred)
        }
      } catch (e) {}

      if (predictor >= 10) {
        rawBytes = self.reversePngFilter(rawBytes, width, height, components)
        if (!rawBytes) return Promise.resolve(null)
      }

      return new Promise(function (resolve) {
        try {
          var srcCanvas = document.createElement('canvas')
          srcCanvas.width = width
          srcCanvas.height = height
          var srcCtx = srcCanvas.getContext('2d')
          var imageData = srcCtx.createImageData(width, height)
          var data = imageData.data

          if (bpc === 8) {
            if (components === 3) {
              for (var i = 0, j = 0; i + 2 < rawBytes.length && j + 3 < data.length; i += 3, j += 4) {
                data[j] = rawBytes[i]
                data[j + 1] = rawBytes[i + 1]
                data[j + 2] = rawBytes[i + 2]
                data[j + 3] = 255
              }
            } else if (components === 1) {
              for (var i = 0, j = 0; i < rawBytes.length && j + 3 < data.length; i++, j += 4) {
                data[j] = data[j + 1] = data[j + 2] = rawBytes[i]
                data[j + 3] = 255
              }
            } else if (components === 4) {
              for (var i = 0, j = 0; i + 3 < rawBytes.length && j + 3 < data.length; i += 4, j += 4) {
                var c = rawBytes[i] / 255
                var m = rawBytes[i + 1] / 255
                var y = rawBytes[i + 2] / 255
                var k = rawBytes[i + 3] / 255
                data[j] = Math.round(255 * (1 - c) * (1 - k))
                data[j + 1] = Math.round(255 * (1 - m) * (1 - k))
                data[j + 2] = Math.round(255 * (1 - y) * (1 - k))
                data[j + 3] = 255
              }
            }
          }

          srcCtx.putImageData(imageData, 0, 0)

          var w = width, h = height
          if (w > maxWidth) {
            var scale = maxWidth / w
            w = Math.round(w * scale)
            h = Math.round(h * scale)
          }
          var canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          var ctx = canvas.getContext('2d')
          ctx.drawImage(srcCanvas, 0, 0, w, h)

          canvas.toBlob(function (blob2) {
            if (!blob2) { resolve(null); return }
            var reader = new FileReader()
            reader.onload = function () {
              resolve(new Uint8Array(reader.result))
            }
            reader.readAsArrayBuffer(blob2)
          }, 'image/jpeg', quality)
        } catch (e) {
          resolve(null)
        }
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

.ei-grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: 5px; }
.ei-card { width: 140px; border: 1px solid #e8e8e8; border-radius: 4px; overflow: hidden; background: #fff; }
.ei-card:hover { border-color: #1aa094; }
.ei-page { font-size: 11px; color: #1aa094; font-weight: bold; padding: 2px 6px; background: rgba(26,160,148,.08); text-align: center; }
.ei-thumb { width: 100%; height: 100px; object-fit: contain; cursor: pointer; background: #fafafa; display: block; }
.ei-meta { padding: 4px 6px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; font-size: 11px; color: #999; }
.ei-size { color: #666; }
.ei-bytes { color: #aaa; }
.ei-dl { color: #1aa094; cursor: pointer; text-decoration: none; font-weight: bold; }
.ei-dl:hover { text-decoration: underline; }

@media (max-width: 767px) {
  .pc-toolbar-text { display: block; line-height: 28px; margin-bottom: 4px; }
  .pc-controls { flex-direction: column; align-items: flex-start; gap: 6px; }
  .pc-label { line-height: 30px; }
  .pc-unit { line-height: 30px; }
  .pc-range-val { line-height: 30px; }
  .ei-card { width: 110px; }
  .ei-thumb { height: 80px; }
}
</style>
