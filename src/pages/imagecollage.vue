<template>
  <v-tab :items="tabItems">
    <div slot="imagecollage">
      <!-- 工具栏 -->
      <div class="ic-toolbar">
        <v-upload @before="onUpload" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;">
          <v-button style="position:absolute;">添加图片</v-button>
        </v-upload>
        <v-button @click="downloadImage" :disabled="!images.length" style="margin-left:10px;">下载</v-button>
        <v-button @click="copyToClipboard" :disabled="!images.length" style="margin-left:5px;">复制到剪贴板</v-button>
        <v-button v-if="selectedId != null" @click="deleteSelected" style="margin-left:5px;">删除选中</v-button>
        <span v-if="copyMsg" class="ic-copy-msg">{{ copyMsg }}</span>
      </div>

      <!-- 画布配置 -->
      <div class="ic-controls">
        <span class="ic-label">画布</span>
        <v-select v-model="preset" :options="presetOptions" @change="onPresetChange" style="width:100px;display:inline-block;"></v-select>
        <template v-if="preset === 'custom'">
          <input v-model.number="canvasWidth" type="number" min="100" max="8000" class="layui-input ic-input-num" @change="updateCanvas" />
          <span class="ic-unit">×</span>
          <input v-model.number="canvasHeight" type="number" min="100" max="8000" class="layui-input ic-input-num" @change="updateCanvas" />
          <span class="ic-unit">px</span>
        </template>
        <span class="ic-label" style="margin-left:16px;">背景</span>
        <input v-model="bgColor" type="color" class="ic-color" @change="renderCanvas" />
      </div>

      <!-- 画布区域 -->
      <div class="ic-canvas-wrap" ref="wrap"
        @dragover.prevent="dragOver=true" @dragleave.prevent="dragOver=false" @drop.prevent="onDrop"
        :class="{'ic-drag-over': dragOver}">
        <canvas ref="canvas" class="ic-canvas"
          @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
          @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd"
          @wheel.prevent="onWheel"></canvas>
        <div v-if="!images.length && !dragOver" class="ic-placeholder">拖拽图片到此处、点击「添加图片」上传或 Ctrl+V 粘贴</div>
        <div v-else-if="dragOver" class="ic-placeholder ic-drag-hint">释放以添加图片</div>
      </div>

      <!-- 图层列表 -->
      <div v-if="images.length" class="ic-layers">
        <div class="ic-layers-title">图层（点击选中）</div>
        <div class="ic-layer-list">
          <div v-for="(item, index) in imagesReversed" :key="item.id"
            class="ic-layer-item" :class="{'ic-layer-active': item.id === selectedId}"
            @click="selectImage(item.id)">
            <img :src="item.src" class="ic-layer-thumb" />
            <span class="ic-layer-idx">{{ images.length - index }}</span>
          </div>
        </div>
      </div>
    </div>
  </v-tab>
</template>
<script>
var CANVAS_PRESETS = {
  a4: { label: 'A4', w: 2480, h: 3508 },
  a3: { label: 'A3', w: 3508, h: 4960 },
  a5: { label: 'A5', w: 1748, h: 2480 },
  letter: { label: 'Letter', w: 2550, h: 3300 },
  custom: { label: '自定义', w: 2480, h: 3508 }
}

var HANDLE_SIZE = 10
var MIN_IMG_SIZE = 20

var STORAGE_KEY = 'me_imagecollage_config'
function loadConfig() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch (e) { return {} }
}
function saveConfig(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

var gid = 0
function nextId() { return ++gid }

module.exports = {
  meta: { menuName: '图片拼接', sort: 13 },
  data: function () {
    var saved = loadConfig()
    return {
      tabItems: [{ Name: 'imagecollage', Title: '图片拼接' }],
      images: [],
      selectedId: null,
      preset: saved.preset || 'a4',
      presetOptions: [
        { Text: 'A4', Value: 'a4' },
        { Text: 'A3', Value: 'a3' },
        { Text: 'A5', Value: 'a5' },
        { Text: 'Letter', Value: 'letter' },
        { Text: '自定义', Value: 'custom' }
      ],
      canvasWidth: saved.canvasWidth || 2480,
      canvasHeight: saved.canvasHeight || 3508,
      bgColor: saved.bgColor || '#ffffff',
      dragOver: false,
      copyMsg: '',
      // 交互状态
      dragging: false,
      resizing: false,
      resizeHandle: null,
      dragStartX: 0,
      dragStartY: 0,
      dragOrigX: 0,
      dragOrigY: 0,
      dragOrigW: 0,
      dragOrigH: 0,
      scaleX: 1,
      scaleY: 1,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
      _copyTimer: null
    }
  },
  computed: {
    isMobile: function () {
      return this.windowWidth < 768
    },
    imagesReversed: function () {
      var list = this.images.slice()
      list.sort(function (a, b) { return a.zIndex - b.zIndex })
      return list
    }
  },
  watch: {
    images: {
      deep: true,
      handler: function () { this.renderCanvas() }
    },
    selectedId: function () { this.renderCanvas() },
    bgColor: function () { this.saveSettings(); this.renderCanvas() }
  },
  mounted: function () {
    var self = this
    this.$nextTick(function () {
      self.updateScale()
      self.renderCanvas()
    })
    window.addEventListener('resize', function () {
      self.windowWidth = window.innerWidth
      self.$nextTick(function () { self.updateScale(); self.renderCanvas() })
    })
    this.pasteInit()
  },
  methods: {
    saveSettings: function () {
      saveConfig({
        preset: this.preset,
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight,
        bgColor: this.bgColor
      })
    },
    updateScale: function () {
      var canvas = this.$refs.canvas
      if (!canvas) return
      this.scaleX = canvas.width / (canvas.clientWidth || 1)
      this.scaleY = canvas.height / (canvas.clientHeight || 1)
    },
    updateCanvas: function () {
      this.saveSettings()
      var canvas = this.$refs.canvas
      canvas.width = this.canvasWidth
      canvas.height = this.canvasHeight
      var self = this
      this.$nextTick(function () {
        self.updateScale()
        self.renderCanvas()
      })
    },
    onPresetChange: function () {
      this.saveSettings()
      if (this.preset !== 'custom') {
        var p = CANVAS_PRESETS[this.preset]
        this.canvasWidth = p.w
        this.canvasHeight = p.h
      }
      var self = this
      this.$nextTick(function () {
        self.updateCanvas()
      })
    },
    renderCanvas: function () {
      var canvas = this.$refs.canvas
      if (!canvas) return
      var ctx = canvas.getContext('2d')
      // 背景
      ctx.fillStyle = this.bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      var self = this
      var sorted = this.images.slice().sort(function (a, b) { return a.zIndex - b.zIndex })
      sorted.forEach(function (item) {
        self.drawImageOnCanvas(ctx, item)
      })

      var sel = this.getSelected()
      if (sel) {
        this.drawSelectionHandles(ctx, sel)
      }
    },
    drawImageOnCanvas: function (ctx, item) {
      if (!item.img) return
      ctx.save()
      ctx.beginPath()
      ctx.rect(item.x, item.y, item.w, item.h)
      ctx.clip()
      ctx.drawImage(item.img, item.x, item.y, item.w, item.h)
      ctx.restore()
    },
    drawSelectionHandles: function (ctx, item) {
      var x = item.x, y = item.y, w = item.w, h = item.h
      ctx.strokeStyle = '#1aa094'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.strokeRect(x, y, w, h)
      ctx.setLineDash([])

      // 四个角
      ctx.fillStyle = '#1aa094'
      var hs = HANDLE_SIZE
      var handles = [
        [x - hs / 2, y - hs / 2],
        [x + w - hs / 2, y - hs / 2],
        [x - hs / 2, y + h - hs / 2],
        [x + w - hs / 2, y + h - hs / 2]
      ]
      for (var i = 0; i < handles.length; i++) {
        ctx.fillRect(handles[i][0], handles[i][1], hs, hs)
      }
    },
    screenToCanvas: function (sx, sy) {
      var rect = this.$refs.canvas.getBoundingClientRect()
      return {
        x: (sx - rect.left) * this.scaleX,
        y: (sy - rect.top) * this.scaleY
      }
    },
    hitTest: function (cx, cy) {
      var sel = this.getSelected()
      if (sel) {
        var h = this.getHandleAt(cx, cy, sel)
        if (h) return { type: 'handle', id: sel.id, handle: h }
      }
      var sorted = this.images.slice().sort(function (a, b) { return b.zIndex - a.zIndex })
      for (var i = 0; i < sorted.length; i++) {
        var item = sorted[i]
        if (cx >= item.x && cx <= item.x + item.w && cy >= item.y && cy <= item.y + item.h) {
          return { type: 'image', id: item.id }
        }
      }
      return null
    },
    getHandleAt: function (cx, cy, item) {
      var x = item.x, y = item.y, w = item.w, h = item.h
      var hs = HANDLE_SIZE + 4
      var handles = {
        tl: [x - hs / 2, y - hs / 2, hs, hs],
        tr: [x + w - hs / 2, y - hs / 2, hs, hs],
        bl: [x - hs / 2, y + h - hs / 2, hs, hs],
        br: [x + w - hs / 2, y + h - hs / 2, hs, hs]
      }
      for (var key in handles) {
        var r = handles[key]
        if (cx >= r[0] && cx <= r[0] + r[2] && cy >= r[1] && cy <= r[1] + r[3]) {
          return key
        }
      }
      return null
    },
    getSelected: function () {
      if (this.selectedId == null) return null
      for (var i = 0; i < this.images.length; i++) {
        if (this.images[i].id === this.selectedId) return this.images[i]
      }
      return null
    },
    selectImage: function (id) {
      this.selectedId = id
      var maxZ = 0
      for (var i = 0; i < this.images.length; i++) {
        if (this.images[i].zIndex > maxZ) maxZ = this.images[i].zIndex
      }
      for (var j = 0; j < this.images.length; j++) {
        if (this.images[j].id === id) {
          this.images[j].zIndex = maxZ + 1
          break
        }
      }
      this.renderCanvas()
    },
    deleteSelected: function () {
      if (this.selectedId == null) return
      for (var i = 0; i < this.images.length; i++) {
        if (this.images[i].id === this.selectedId) {
          this.images.splice(i, 1)
          break
        }
      }
      this.selectedId = null
      this.renderCanvas()
    },

    // === 鼠标事件 ===
    onMouseDown: function (e) {
      var pos = this.screenToCanvas(e.clientX, e.clientY)
      var hit = this.hitTest(pos.x, pos.y)
      if (hit && hit.type === 'handle') {
        this.resizing = true
        this.resizeHandle = hit.handle
        this.selectedId = hit.id
        var item = this.getSelected()
        this.dragStartX = pos.x
        this.dragStartY = pos.y
        this.dragOrigX = item.x
        this.dragOrigY = item.y
        this.dragOrigW = item.w
        this.dragOrigH = item.h
      } else if (hit && hit.type === 'image') {
        this.dragging = true
        this.selectedId = hit.id
        var item = this.getSelected()
        this.dragStartX = pos.x
        this.dragStartY = pos.y
        this.dragOrigX = item.x
        this.dragOrigY = item.y
      } else {
        this.selectedId = null
        this.renderCanvas()
      }
    },
    onMouseMove: function (e) {
      var pos = this.screenToCanvas(e.clientX, e.clientY)
      if (this.dragging) {
        var dx = pos.x - this.dragStartX
        var dy = pos.y - this.dragStartY
        var item = this.getSelected()
        if (item) {
          item.x = this.dragOrigX + dx
          item.y = this.dragOrigY + dy
          this.renderCanvas()
        }
      } else if (this.resizing && this.resizeHandle) {
        var dx = pos.x - this.dragStartX
        var dy = pos.y - this.dragStartY
        var item = this.getSelected()
        if (item) {
          this.applyResize(item, dx, dy)
          this.renderCanvas()
        }
      } else {
        var hit = this.hitTest(pos.x, pos.y)
        var canvas = this.$refs.canvas
        if (hit && hit.type === 'handle') {
          var cursors = { tl: 'nwse-resize', br: 'nwse-resize', tr: 'nesw-resize', bl: 'nesw-resize' }
          canvas.style.cursor = cursors[hit.handle] || 'move'
        } else if (hit && hit.type === 'image') {
          canvas.style.cursor = 'move'
        } else {
          canvas.style.cursor = 'default'
        }
      }
    },
    onMouseUp: function () {
      this.dragging = false
      this.resizing = false
      this.resizeHandle = null
    },
    applyResize: function (item, dx, dy) {
      var ox = this.dragOrigX, oy = this.dragOrigY
      var ow = this.dragOrigW, oh = this.dragOrigH
      var aspect = ow / oh
      var newX = ox, newY = oy, newW = ow, newH = oh

      if (this.resizeHandle === 'br') {
        var adx = Math.abs(dx), ady = Math.abs(dy)
        if (adx / aspect > ady) {
          newW = ow + dx
          newH = newW / aspect
        } else {
          newH = oh + dy
          newW = newH * aspect
        }
      } else if (this.resizeHandle === 'tl') {
        var adx2 = Math.abs(dx), ady2 = Math.abs(dy)
        if (adx2 / aspect > ady2) {
          newW = ow - dx
          newH = newW / aspect
        } else {
          newH = oh - dy
          newW = newH * aspect
        }
        newX = ox + ow - newW
        newY = oy + oh - newH
      } else if (this.resizeHandle === 'tr') {
        var adx3 = Math.abs(dx), ady3 = Math.abs(dy)
        if (adx3 / aspect > ady3) {
          newW = ow + dx
          newH = newW / aspect
        } else {
          newH = oh - dy
          newW = newH * aspect
        }
        newX = ox
        newY = oy + oh - newH
      } else if (this.resizeHandle === 'bl') {
        var adx4 = Math.abs(dx), ady4 = Math.abs(dy)
        if (adx4 / aspect > ady4) {
          newW = ow - dx
          newH = newW / aspect
        } else {
          newH = oh + dy
          newW = newH * aspect
        }
        newX = ox + ow - newW
        newY = oy
      }

      if (newW < MIN_IMG_SIZE) { newW = MIN_IMG_SIZE; newH = newW / aspect }
      if (newH < MIN_IMG_SIZE) { newH = MIN_IMG_SIZE; newW = newH * aspect }

      item.x = newX
      item.y = newY
      item.w = newW
      item.h = newH
    },
    onWheel: function (e) {
      if (this.selectedId == null) return
      var item = this.getSelected()
      if (!item) return
      var pos = this.screenToCanvas(e.clientX, e.clientY)
      var scale = e.deltaY < 0 ? 1.05 : 0.95
      var cx = pos.x, cy = pos.y
      var relX = (cx - item.x) / item.w
      var relY = (cy - item.y) / item.h
      var newW = item.w * scale
      var newH = item.h * scale
      if (newW < MIN_IMG_SIZE || newH < MIN_IMG_SIZE) return
      item.w = newW
      item.h = newH
      item.x = cx - relX * newW
      item.y = cy - relY * newH
      this.renderCanvas()
    },

    // === 触摸事件（移动端） ===
    onTouchStart: function (e) {
      if (e.touches.length !== 1) return
      var t = e.touches[0]
      var pos = this.screenToCanvas(t.clientX, t.clientY)
      var hit = this.hitTest(pos.x, pos.y)
      if (hit) {
        this.selectedId = hit.id
        var item = this.getSelected()
        this.dragging = true
        this.dragStartX = pos.x
        this.dragStartY = pos.y
        this.dragOrigX = item.x
        this.dragOrigY = item.y
      } else {
        this.selectedId = null
        this.renderCanvas()
      }
    },
    onTouchMove: function (e) {
      if (!this.dragging || e.touches.length !== 1) return
      var t = e.touches[0]
      var pos = this.screenToCanvas(t.clientX, t.clientY)
      var dx = pos.x - this.dragStartX
      var dy = pos.y - this.dragStartY
      var item = this.getSelected()
      if (item) {
        item.x = this.dragOrigX + dx
        item.y = this.dragOrigY + dy
        this.renderCanvas()
      }
    },
    onTouchEnd: function () {
      this.dragging = false
    },

    // === 上传 / 拖拽 / 粘贴 ===
    onUpload: function (base64) {
      this.addImage(base64)
    },
    onDrop: function (e) {
      this.dragOver = false
      var files = e.dataTransfer.files
      for (var i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          this.readFileAsImage(files[i])
        }
      }
    },
    pasteInit: function () {
      var self = this
      document.addEventListener('paste', function (e) {
        if (!(e.clipboardData && e.clipboardData.items)) return
        for (var i = 0; i < e.clipboardData.items.length; i++) {
          var item = e.clipboardData.items[i]
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            var file = item.getAsFile()
            self.readFileAsImage(file)
          }
        }
      })
    },
    readFileAsImage: function (file) {
      var self = this
      var reader = new FileReader()
      reader.onload = function (ev) {
        self.addImage(ev.target.result)
      }
      reader.readAsDataURL(file)
    },
    addImage: function (dataUrl) {
      var self = this
      var img = new Image()
      img.onload = function () {
        var cw = self.$refs.canvas.width
        var ch = self.$refs.canvas.height
        var maxW = cw * 0.8
        var maxH = ch * 0.8
        var iw = img.naturalWidth
        var ih = img.naturalHeight
        var scale = Math.min(maxW / iw, maxH / ih, 1)
        var w = iw * scale
        var h = ih * scale

        var maxZ = 0
        for (var i = 0; i < self.images.length; i++) {
          if (self.images[i].zIndex > maxZ) maxZ = self.images[i].zIndex
        }

        var newItem = {
          id: nextId(),
          src: dataUrl,
          img: img,
          x: (cw - w) / 2,
          y: (ch - h) / 2,
          w: w,
          h: h,
          zIndex: maxZ + 1
        }
        self.images.push(newItem)
        self.selectedId = newItem.id
        self.renderCanvas()
      }
      img.src = dataUrl
    },

    // === 导出 ===
    getMergedCanvas: function () {
      return this.$refs.canvas
    },
    downloadImage: function () {
      var canvas = this.getMergedCanvas()
      if (!canvas) return
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob)
        var a = document.createElement('a')
        a.href = url
        a.download = 'collage.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 'image/png')
    },
    copyToClipboard: function () {
      var canvas = this.getMergedCanvas()
      if (!canvas) return
      var self = this
      canvas.toBlob(function (blob) {
        try {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(function () {
            self.copyMsg = '已复制到剪贴板'
            if (self._copyTimer) clearTimeout(self._copyTimer)
            self._copyTimer = setTimeout(function () { self.copyMsg = '' }, 2000)
          }).catch(function () {
            self.copyMsg = '复制失败（权限不足）'
            if (self._copyTimer) clearTimeout(self._copyTimer)
            self._copyTimer = setTimeout(function () { self.copyMsg = '' }, 2000)
          })
        } catch (e) {
          self.copyMsg = '复制失败'
          if (self._copyTimer) clearTimeout(self._copyTimer)
          self._copyTimer = setTimeout(function () { self.copyMsg = '' }, 2000)
        }
      }, 'image/png')
    }
  }
}
</script>
<style scoped>
.ic-toolbar { padding: 6px 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
.ic-copy-msg { color: #1aa094; font-size: 12px; line-height: 30px; }
.ic-controls { padding: 5px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ic-label { line-height: 38px; font-size: 13px; white-space: nowrap; }
.ic-input-num { width: 70px; display: inline-block; }
.ic-unit { line-height: 38px; color: #999; font-size: 12px; }
.ic-color { width: 30px; height: 30px; display: inline-block; vertical-align: middle; border: none; cursor: pointer; padding: 0; border-radius: 3px; }

.ic-canvas-wrap { position: relative; border: 2px dashed #ccc; border-radius: 4px; overflow: auto; max-height: 450px; margin: 5px; background: #f5f5f5; }
.ic-canvas-wrap.ic-drag-over { border-color: #1aa094; background: rgba(26,160,148,.05); }
.ic-canvas { display: block; margin: 0 auto; max-width: 100%; height: auto; }
.ic-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: #999; font-size: 13px; user-select: none; pointer-events: none; white-space: nowrap; }
.ic-drag-hint { color: #1aa094; }

.ic-layers { padding: 5px; }
.ic-layers-title { font-size: 12px; color: #666; margin-bottom: 4px; }
.ic-layer-list { display: flex; gap: 6px; flex-wrap: wrap; }
.ic-layer-item { width: 48px; height: 48px; border: 2px solid transparent; border-radius: 3px; overflow: hidden; cursor: pointer; position: relative; }
.ic-layer-item:hover { border-color: #aaa; }
.ic-layer-active { border-color: #1aa094 !important; }
.ic-layer-thumb { width: 100%; height: 100%; object-fit: cover; }
.ic-layer-idx { position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; padding: 0 3px; border-radius: 2px 0 0 0; }

@media (max-width: 767px) {
  .ic-controls { flex-direction: column; align-items: flex-start; gap: 6px; }
  .ic-canvas-wrap { max-height: 300px; }
}
</style>
