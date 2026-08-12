<template>
  <v-tab :items="tabItems">
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
          <span class="pc-info-label">原始大小：</span><span class="pc-info-val">{{ formatSize(originalSize) }}</span>
          <span class="pc-info-label" style="margin-left:16px;">页数：</span><span class="pc-info-val">{{ pageCount }} 页</span>
          <span v-if="compressedSize != null" class="pc-info-label" style="margin-left:16px;">压缩后：</span>
          <span v-if="compressedSize != null" class="pc-info-val pc-reduced">{{ formatSize(compressedSize) }}</span>
          <span v-if="reduction != null" class="pc-info-label" style="margin-left:8px;">减小：</span>
          <span v-if="reduction != null" class="pc-info-val pc-reduced">{{ reduction }}%</span>
        </div>
      </div>
      <div class="pc-controls" v-if="originalBytes">
        <div class="pc-control-group"><label class="pc-label">画质</label>
          <v-select v-model="qualityLevel" :options="qualityOptions" style="width:100px;display:inline-block;"></v-select>
        </div>
        <div class="pc-control-group" v-if="qualityLevel === 'custom'"><label class="pc-label">JPEG 质量</label>
          <input v-model.number="jpegQuality" type="range" min="10" max="100" class="pc-range" /><span class="pc-range-val">{{ jpegQuality }}%</span>
        </div>
        <div class="pc-control-group"><label class="pc-label">图片最大宽度</label>
          <input v-model.number="maxImageWidth" type="number" min="200" max="4000" step="100" class="layui-input pc-input-num" /><span class="pc-unit">px</span>
        </div>
      </div>
      <div v-if="!isMobile" class="pc-drop-zone" :class="{'pc-drop-active': dragOver}"
        @dragover.prevent="dragOver=true" @dragleave.prevent="dragOver=false" @drop.prevent="onDrop">
        <div v-if="processing" class="pc-status"><span class="pc-status-text">压缩处理中...</span>
          <div class="pc-progress"><div class="pc-progress-bar" :style="{width: progress + '%'}"></div></div></div>
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
    <div slot="extract">
      <div class="pc-toolbar">
        <span class="pc-toolbar-text">拖拽 PDF 到下方区域或点击上传</span>
        <v-upload @before="onUploadExtract" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;" accept=".pdf">
          <v-button style="position:absolute;">选择 PDF</v-button>
        </v-upload>
        <v-button v-if="extractImages.length" style="margin-left:10px;" @click="downloadAllImages">下载全部图片</v-button>
        <v-button v-if="extractOriginBytes" style="margin-left:5px;" @click="startExtract" :disabled="extracting">
          <span v-if="extracting">提取中...</span><span v-else>提取图片</span>
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
        @dragover.prevent="extractDragOver=true" @dragleave.prevent="extractDragOver=false" @drop.prevent="onDropExtract" style="min-height:auto; padding:10px;">
        <div v-if="extracting" class="pc-status"><span class="pc-status-text">正在提取图片...</span>
          <div class="pc-progress"><div class="pc-progress-bar" :style="{width: extractProgress + '%'}"></div></div></div>
        <div v-else-if="extractImages.length" class="ei-grid">
          <div v-for="(img, idx) in extractImages" :key="idx" class="ei-card">
            <img :src="img.url" class="ei-thumb" @click="previewImage(img)" />
            <div class="ei-meta"><span class="ei-size">{{ img.width }}x{{ img.height }}</span>
              <span class="ei-bytes">{{ formatSize(img.bytes) }}</span>
              <a class="ei-dl" @click="downloadImage(img, idx)">下载</a></div>
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
function loadConfig() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch (e) { return {} } }
function saveConfig(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
var PDFDocument = null
var PDFName = null

module.exports = {
  meta: { menuName: 'PDF 操作', sort: 12 },
  data: function () {
    var saved = loadConfig()
    return {
      tabItems: [{ Name: 'compress', Title: '压缩' }, { Name: 'extract', Title: '提取图片' }],
      originalBytes: null, originalSize: 0, pageCount: 0,
      compressedBytes: null, compressedSize: null, compressedPdfUrl: null, reduction: null,
      qualityLevel: saved.qualityLevel || 'medium',
      qualityOptions: [{ Text: '高画质', Value: 'high' }, { Text: '中等', Value: 'medium' }, { Text: '高压缩', Value: 'low' }, { Text: '自定义', Value: 'custom' }],
      jpegQuality: saved.jpegQuality || 60, maxImageWidth: saved.maxImageWidth || 1200,
      dragOver: false, processing: false, progress: 0, fileName: '',
      extractOriginBytes: null, extractOriginSize: 0, extractPageCount: 0, extractImages: [],
      extractDragOver: false, extracting: false, extractProgress: 0, extractFileName: '',
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200
    }
  },
  computed: {
    isMobile: function () { return this.windowWidth < 768 },
    effectiveQuality: function () {
      var map = { high: 85, medium: 60, low: 30 }
      return this.qualityLevel === 'custom' ? this.jpegQuality : (map[this.qualityLevel] || 60)
    }
  },
  mounted: function () { var self = this; window.addEventListener('resize', function () { self.windowWidth = window.innerWidth }) },
  methods: {
    saveSettings: function () { saveConfig({ qualityLevel: this.qualityLevel, jpegQuality: this.jpegQuality, maxImageWidth: this.maxImageWidth }) },
    formatSize: function (bytes) {
      if (bytes == null) return '0 B'
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / 1048576).toFixed(2) + ' MB'
    },
    ensurePdfLib: function () { if (!PDFDocument) { var lib = require('pdf-lib'); PDFDocument = lib.PDFDocument; PDFName = lib.PDFName } },
    onUpload: function (base64) { this.loadPdf(this.base64ToBytes(base64)) },
    onDrop: function (e) { this.dragOver = false; var f = e.dataTransfer.files[0]; if (f) this.readFile(f) },
    readFile: function (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
      this.fileName = file.name; this.originalSize = file.size
      this.compressedBytes = null; this.compressedSize = null; this.compressedPdfUrl = null; this.reduction = null
      var self = this; var r = new FileReader()
      r.onload = function (ev) { self.loadPdf(new Uint8Array(ev.target.result)) }
      r.readAsArrayBuffer(file)
    },
    base64ToBytes: function (base64) { var raw = atob(base64.split(',')[1] || base64); var b = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) b[i] = raw.charCodeAt(i); return b },
    loadPdf: function (bytes) {
      this.originalBytes = bytes; if (!this.originalSize) this.originalSize = bytes.length
      if (!this.extractOriginBytes) { this.extractOriginBytes = bytes; this.extractOriginSize = bytes.length; this.extractFileName = this.fileName; this.loadExtractPdf(bytes) }
      var self = this; this.ensurePdfLib()
      PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (d) { self.pageCount = d.getPageCount() }).catch(function () { self.pageCount = 0 })
    },
    compressPdf: function () {
      if (!this.originalBytes) return; this.saveSettings(); this.processing = true; this.progress = 0
      this.compressedBytes = null; this.compressedSize = null; this.reduction = null
      var self = this; this.ensurePdfLib(); var q = this.effectiveQuality / 100; var mw = this.maxImageWidth
      PDFDocument.load(this.originalBytes, { ignoreEncryption: true }).then(function (doc) {
        return self.compressImages(doc, q, mw).then(function () { return doc.save({ useObjectStreams: true, addDefaultPage: false }) })
      }).then(function (saved) {
        self.compressedBytes = saved; self.compressedSize = saved.length
        var orig = self.originalSize || self.originalBytes.length
        if (orig > 0) { self.reduction = ((1 - saved.length / orig) * 100).toFixed(1); if (parseFloat(self.reduction) < 0) self.reduction = '0.0' }
        var blob = new Blob([saved], { type: 'application/pdf' })
        if (self.compressedPdfUrl) URL.revokeObjectURL(self.compressedPdfUrl)
        self.compressedPdfUrl = URL.createObjectURL(blob); self.processing = false; self.progress = 100
      }).catch(function (err) { console.error(err); self.processing = false; window.layui.layer.msg('压缩失败: ' + (err.message || '未知错误')) })
    },
    onUploadExtract: function (base64) { this.loadExtractPdfMain(this.base64ToBytes(base64)) },
    onDropExtract: function (e) { this.extractDragOver = false; var f = e.dataTransfer.files[0]; if (f) this.readExtractFile(f) },
    readExtractFile: function (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
      this.extractFileName = file.name; this.extractOriginSize = file.size; this.extractImages = []
      var self = this; var r = new FileReader()
      r.onload = function (ev) { self.loadExtractPdfMain(new Uint8Array(ev.target.result)) }
      r.readAsArrayBuffer(file)
    },
    loadExtractPdfMain: function (bytes) { this.extractOriginBytes = bytes; this.extractOriginSize = bytes.length; this.extractImages = []; this.loadExtractPdf(bytes) },
    loadExtractPdf: function (bytes) { var self = this; this.ensurePdfLib(); PDFDocument.load(bytes, { ignoreEncryption: true }).then(function (d) { self.extractPageCount = d.getPageCount() }).catch(function () { self.extractPageCount = 0 }) },
    startExtract: function () {
      if (!this.extractOriginBytes) return; this.extracting = true; this.extractProgress = 0; this.extractImages = []
      var self = this; this.ensurePdfLib()
      PDFDocument.load(this.extractOriginBytes, { ignoreEncryption: true }).then(function (doc) { return self.extractAllImages(doc) })
        .then(function () { self.extracting = false; self.extractProgress = 100 })
        .catch(function (err) { console.error(err); self.extracting = false; window.layui.layer.msg('提取失败: ' + (err.message || '未知错误')) })
    },
    // 核心：提取所有嵌入图片，双方法回退
    extractAllImages: function (doc) {
      var self = this; var imageStreams = []
      // 方法1: pdf-lib API — enumerateIndirectObjects 返回 [ref, obj] 元组数组
      try {
        var entries = doc.context.enumerateIndirectObjects()
        for (var i = 0; i < entries.length; i++) {
          var info = self.parseImageObject(entries[i][1])
          if (info) imageStreams.push(info)
        }
      } catch (e) { console.warn('pdf-lib API 提取失败', e) }
      // 方法2: 原始字节解析回退
      if (imageStreams.length === 0) imageStreams = self.extractImagesFromRawBytes(this.extractOriginBytes)
      if (imageStreams.length === 0) { window.layui.layer.msg('未找到嵌入图片（该 PDF 可能使用矢量图形）'); return Promise.resolve() }
      return self.processImageStreams(imageStreams)
    },
    parseImageObject: function (obj) {
      var self = this; var dict = obj.dict
      if (!dict) return null
      try {
        if (self.getDictValue(dict, 'Subtype') !== '/Image') return null
        var w = parseInt(self.getDictValue(dict, 'Width'), 10)
        var h = parseInt(self.getDictValue(dict, 'Height'), 10)
        if (!w || !h) return null
        var filter = self.getDictValue(dict, 'Filter')
        var cs = self.getDictValue(dict, 'ColorSpace')
        var bpc = self.getDictValue(dict, 'BitsPerComponent')
        var raw = null
        if (obj.contents && obj.contents.length > 0) raw = new Uint8Array(obj.contents)
        else if (typeof obj.getContents === 'function') { var c = obj.getContents(); raw = c ? new Uint8Array(c) : null }
        if (!raw || raw.length === 0) return null
        return { rawBytes: raw, width: w, height: h, filter: filter, colorSpace: cs, bitsPerComponent: bpc ? parseInt(bpc, 10) : 8 }
      } catch (e) { return null }
    },
    getDictValue: function (dict, name) { try { var v = dict.get(PDFName.of(name)); return v ? v.toString() : null } catch (e) { return null } },
    // 原始字节解析：搜索 PDF 中的 image XObject
    extractImagesFromRawBytes: function (pdfBytes) {
      var results = []
      var chunks = []; var cs = 65536
      for (var i = 0; i < pdfBytes.length; i += cs) chunks.push(String.fromCharCode.apply(null, pdfBytes.subarray(i, Math.min(i + cs, pdfBytes.length))))
      var str = chunks.join('')
      var objRegex = /(\d+)[\s]+(\d+)[\s]+obj([\s\S]*?)endobj/g
      var match
      while ((match = objRegex.exec(str)) !== null) {
        var body = match[3]
        if (body.indexOf('/Image') === -1) continue
        var wM = body.match(/\/Width\s+(\d+)/); var hM = body.match(/\/Height\s+(\d+)/)
        var fM = body.match(/\/Filter\s*\/(\w+)/); var csM = body.match(/\/ColorSpace\s*\/(\w+)/)
        var bpcM = body.match(/\/BitsPerComponent\s+(\d+)/)
        if (!wM || !hM) continue
        var w = parseInt(wM[1], 10); var h = parseInt(hM[1], 10)
        var filter = fM ? '/' + fM[1] : null
        var colorSpace = csM ? '/' + csM[1] : '/DeviceRGB'
        var bpc = bpcM ? parseInt(bpcM[1], 10) : 8
        var sM = body.match(/stream\r?\n([\s\S]*?)\r?\n?endstream/)
        if (!sM) continue
        var rawStr = sM[1]; var raw = new Uint8Array(rawStr.length)
        for (var j = 0; j < rawStr.length; j++) raw[j] = rawStr.charCodeAt(j)
        if (filter === '/DCTDecode' || (raw[0] === 0xFF && raw[1] === 0xD8)) {
          results.push({ rawBytes: raw, width: w, height: h, filter: '/DCTDecode', colorSpace: colorSpace, bitsPerComponent: bpc })
        } else if (filter === '/JPXDecode') {
          results.push({ rawBytes: raw, width: w, height: h, filter: '/JPXDecode', colorSpace: colorSpace, bitsPerComponent: bpc })
        } else if (filter === '/FlateDecode' || filter === '/Fl') {
          try { var pako = require('pako'); var dec = pako.inflate(raw); results.push({ rawBytes: new Uint8Array(dec), width: w, height: h, filter: '/FlateDecode', colorSpace: colorSpace, bitsPerComponent: bpc }) } catch (e) {}
        }
      }
      return results
    },
    processImageStreams: function (streams) {
      var self = this; var total = streams.length; var done = 0
      function next(idx) {
        if (idx >= total) { self.extractProgress = 100; return Promise.resolve() }
        self.extractProgress = Math.round((done / total) * 100)
        return self.streamToImage(streams[idx]).then(function (r) { if (r) self.extractImages.push(r); done++; return next(idx + 1) })
      }
      return next(0)
    },
    streamToImage: function (stream) {
      var self = this; var raw = stream.rawBytes; var filter = stream.filter || ''
      var w = stream.width; var h = stream.height
      if (filter === '/DCTDecode' || (raw[0] === 0xFF && raw[1] === 0xD8)) {
        return self.imageFromUrl(URL.createObjectURL(new Blob([raw], { type: 'image/jpeg' })), w, h, raw.length)
      }
      if (filter === '/JPXDecode') { return self.imageFromUrl(URL.createObjectURL(new Blob([raw], { type: 'image/jpeg2000' })), w, h, raw.length) }
      if (raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4E && raw[3] === 0x47) {
        return self.imageFromUrl(URL.createObjectURL(new Blob([raw], { type: 'image/png' })), w, h, raw.length)
      }
      return self.tryDirectLoad(raw, w, h).then(function (r) { if (r) return r; return self.rebuildFromPixels(raw, w, h, stream.colorSpace, stream.bitsPerComponent) })
    },
    tryDirectLoad: function (raw, w, h) {
      return new Promise(function (resolve) {
        var url = URL.createObjectURL(new Blob([raw])); var img = new Image()
        img.onload = function () { resolve({ url: url, width: w, height: h, bytes: raw.length, dataUrl: null }) }
        img.onerror = function () { URL.revokeObjectURL(url); resolve(null) }
        img.src = url
      })
    },
    rebuildFromPixels: function (raw, w, h, colorSpace, bpc) {
      return new Promise(function (resolve) {
        bpc = bpc || 8; var ch = 3
        if (colorSpace && colorSpace.indexOf('Gray') !== -1) ch = 1
        else if (colorSpace && colorSpace.indexOf('CMYK') !== -1) ch = 4
        try {
          var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
          var ctx = canvas.getContext('2d'); var id = ctx.createImageData(w, h); var d = id.data; var pc = w * h
          if (ch === 1) { for (var i = 0; i < pc; i++) { var v = raw[i] || 0; d[i*4]=v; d[i*4+1]=v; d[i*4+2]=v; d[i*4+3]=255 } }
          else if (ch === 3) { for (var i = 0; i < pc; i++) { d[i*4]=raw[i*3]||0; d[i*4+1]=raw[i*3+1]||0; d[i*4+2]=raw[i*3+2]||0; d[i*4+3]=255 } }
          else if (ch === 4) { for (var i = 0; i < pc; i++) { var c=raw[i*4]||0,m=raw[i*4+1]||0,y=raw[i*4+2]||0,k=raw[i*4+3]||0; d[i*4]=255-Math.min(255,c+k); d[i*4+1]=255-Math.min(255,m+k); d[i*4+2]=255-Math.min(255,y+k); d[i*4+3]=255 } }
          ctx.putImageData(id, 0, 0); var url = canvas.toDataURL('image/png')
          resolve({ url: url, width: w, height: h, bytes: raw.length, dataUrl: url })
        } catch (e) { resolve(null) }
      })
    },
    imageFromUrl: function (url, w, h, bytes) {
      return new Promise(function (resolve) { var img = new Image(); img.onload = function () { resolve({ url: url, width: w, height: h, bytes: bytes, dataUrl: null }) }; img.onerror = function () { URL.revokeObjectURL(url); resolve(null) }; img.src = url })
    },
    previewImage: function (img) { window.open(img.url, '_blank') },
    downloadImage: function (img, idx) { var a = document.createElement('a'); a.download = (this.extractFileName||'pdf').replace(/\.pdf$/i,'') + '_img' + (idx+1) + '.png'; a.href = img.dataUrl || img.url; document.body.appendChild(a); a.click(); document.body.removeChild(a) },
    downloadAllImages: function () { var self = this; var prefix = (this.extractFileName||'pdf').replace(/\.pdf$/i,''); function seq(i) { if (i >= self.extractImages.length) return; var img = self.extractImages[i]; var a = document.createElement('a'); a.download = prefix + '_img' + (i+1) + '.png'; a.href = img.dataUrl || img.url; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function(){seq(i+1)}, 500) }; if (self.extractImages.length > 0) seq(0) },
    compressImages: function (doc, quality, maxWidth) {
      var self = this; var entries = []
      try { entries = doc.context.enumerateIndirectObjects() } catch (e) { return Promise.resolve() }
      var imageStreams = []
      for (var i = 0; i < entries.length; i++) {
        var obj = entries[i][1]; var dict = obj.dict
        if (!dict) continue
        try {
          if (self.getDictValue(dict, 'Subtype') !== '/Image') continue
          var w = parseInt(self.getDictValue(dict, 'Width'), 10); var h = parseInt(self.getDictValue(dict, 'Height'), 10)
          if (!w || !h) continue
          var raw = null
          if (obj.contents && obj.contents.length > 0) raw = new Uint8Array(obj.contents)
          else if (typeof obj.getContents === 'function') { var c = obj.getContents(); raw = c ? new Uint8Array(c) : null }
          if (!raw || raw.length === 0) continue
          imageStreams.push({ obj: obj, dict: dict, width: w, height: h, rawBytes: raw })
        } catch (e2) {}
      }
      if (imageStreams.length === 0) return Promise.resolve()
      var total = imageStreams.length; var done = 0
      function next(idx) {
        if (idx >= total) { self.progress = 100; return Promise.resolve() }
        self.progress = Math.round((done / total) * 90)
        var s = imageStreams[idx]
        return self.compressStreamImage(s, quality, maxWidth).then(function (nb) {
          if (nb) { try { s.obj.contents = nb; s.dict.set(PDFName.of('Filter'), doc.context.obj('DCTDecode')); s.dict.delete(PDFName.of('DecodeParms')); s.dict.delete(PDFName.of('SMask')) } catch (e) {} }
          done++; return next(idx + 1)
        })
      }
      return next(0)
    },
    compressStreamImage: function (stream, quality, maxWidth) {
      var raw = stream.rawBytes
      if (!raw || raw.length === 0) return Promise.resolve(null)
      if (stream.width <= maxWidth && quality >= 0.85) return Promise.resolve(null)
      return new Promise(function (resolve) {
        var url = URL.createObjectURL(new Blob([raw])); var img = new Image()
        img.onload = function () {
          URL.revokeObjectURL(url); var w = stream.width, h = stream.height
          if (w > maxWidth) { var s = maxWidth / w; w = Math.round(w * s); h = Math.round(h * s) }
          var canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
          var ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h)
          canvas.toBlob(function (b2) {
            if (!b2) { resolve(null); return }
            var r = new FileReader(); r.onload = function () { var arr = new Uint8Array(r.result); if (arr.length >= raw.length && quality >= 0.5) resolve(null); else resolve(arr) }; r.readAsArrayBuffer(b2)
          }, 'image/jpeg', quality)
        }
        img.onerror = function () { URL.revokeObjectURL(url); resolve(null) }
        img.src = url
      })
    },
    downloadPdf: function () { if (!this.compressedPdfUrl) return; var a = document.createElement('a'); a.href = this.compressedPdfUrl; a.download = (this.fileName||'document').replace('.pdf','') + '_compressed.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a) }
  }
}
</script>
<style scoped>
.pc-toolbar{padding:6px 5px;display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.pc-toolbar-text{line-height:38px;margin-right:10px}
.pc-info{padding:5px}.pc-info-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
.pc-info-label{font-size:13px;color:#666;line-height:28px}
.pc-info-val{font-size:13px;font-weight:bold;color:#333;line-height:28px}
.pc-reduced{color:#1aa094}
.pc-controls{padding:5px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px}
.pc-control-group{display:inline-flex;align-items:center;gap:4px}
.pc-label{line-height:38px;font-size:13px;white-space:nowrap}
.pc-input-num{width:80px;display:inline-block}
.pc-unit{line-height:38px;color:#999;font-size:12px}
.pc-range{width:100px;display:inline-block;vertical-align:middle}
.pc-range-val{line-height:38px;font-size:12px;min-width:36px}
.pc-drop-zone{border:2px dashed #ccc;border-radius:4px;min-height:200px;padding:10px;text-align:center;transition:border-color .2s;margin:5px}
.pc-drop-active{border-color:#1aa094;background:rgba(26,160,148,.05)}
.pc-placeholder{color:#999;line-height:180px;user-select:none}
.pc-status{padding:40px 20px}
.pc-status-text{font-size:14px;color:#666}
.pc-progress{height:8px;background:#eee;border-radius:4px;margin-top:12px;max-width:300px;margin-left:auto;margin-right:auto;overflow:hidden}
.pc-progress-bar{height:100%;background:#1aa094;border-radius:4px;transition:width .3s;width:0%}
.pc-preview{width:100%;height:500px;border:none}
.pc-preview-m{width:100%;height:400px;border:none}
.pc-mobile-wrap{padding:5px}
.pc-mobile-hint{color:#999;text-align:center;padding:40px 10px;font-size:13px}
.ei-grid{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:5px}
.ei-card{width:140px;border:1px solid #e8e8e8;border-radius:4px;overflow:hidden;background:#fff}
.ei-card:hover{border-color:#1aa094}
.ei-thumb{width:100%;height:100px;object-fit:contain;cursor:pointer;background:#fafafa;display:block}
.ei-meta{padding:4px 6px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;font-size:11px;color:#999}
.ei-size{color:#666}.ei-bytes{color:#aaa}
.ei-dl{color:#1aa094;cursor:pointer;text-decoration:none;font-weight:bold}
.ei-dl:hover{text-decoration:underline}
@media(max-width:767px){.pc-toolbar-text{display:block;line-height:28px;margin-bottom:4px}.pc-controls{flex-direction:column;align-items:flex-start;gap:6px}.pc-label{line-height:30px}.pc-unit{line-height:30px}.pc-range-val{line-height:30px}.ei-card{width:110px}.ei-thumb{height:80px}}
</style>
