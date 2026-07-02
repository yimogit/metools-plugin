<template>
  <v-tab :items="tabItems">
    <div slot="watermark">
      <div class="layui-form-item" style="padding:5px;">
        <span style="line-height:38px;margin-right:10px;">拖拽图片到下方区域、粘贴或点击上传</span>
        <v-upload @before="onUpload" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'" style="height:30px;">
          <v-button style="position:absolute;">选择图片</v-button>
        </v-upload>
        <v-button v-if="srcImage" style="margin-left:70px;" @click="downloadImage">下载水印图片</v-button>
      </div>

      <div class="layui-form-item" style="padding:5px;">
        <span style="line-height:38px;margin-right:10px;">水印文字</span>
        <input v-model="watermarkText" @input="renderWatermark" placeholder="请输入水印文字" class="layui-input" style="width:200px;display:inline-block;" />
        <span style="margin-left:10px;line-height:38px;">透明度</span>
        <input v-model.number="opacity" @input="renderWatermark" type="range" min="5" max="100" style="width:100px;display:inline-block;vertical-align:middle;" />
        <span style="margin-left:5px;line-height:38px;">{{ opacity }}%</span>
        <span style="margin-left:10px;line-height:38px;">颜色</span>
        <input v-model="color" @input="renderWatermark" type="color" style="width:36px;height:36px;display:inline-block;vertical-align:middle;border:none;cursor:pointer;" />
      </div>

      <div
        class="drop-zone"
        :class="{ 'drop-zone-active': dragOver }"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <img v-if="srcImage" :src="srcImage" ref="previewImg" style="max-width:100%;max-height:400px;display:block;margin:0 auto;" />
        <div v-else class="drop-placeholder">拖拽图片到此处，或 Ctrl+V 粘贴</div>
      </div>
    </div>
  </v-tab>
</template>
<script>
export default {
  meta: {
    menuName: '图片加水印',
    sort: 15
  },
  data() {
    return {
      tabItems: [{ Name: 'watermark', Title: '图片水印' }],
      srcImage: null,
      originalImage: null,
      watermarkText: '',
      opacity: 40,
      color: '#ffffff',
      dragOver: false
    }
  },
  mounted() {
    this.pasteInit()
  },
  methods: {
    onUpload(base64) {
      this.loadImage(base64)
    },
    onDrop(e) {
      this.dragOver = false
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = ev => this.loadImage(ev.target.result)
        reader.readAsDataURL(file)
      }
    },
    pasteInit() {
      document.addEventListener('paste', e => {
        if (!(e.clipboardData && e.clipboardData.items)) return
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i]
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile()
            const reader = new FileReader()
            reader.onload = ev => this.loadImage(ev.target.result)
            reader.readAsDataURL(file)
          }
        }
      })
    },
    loadImage(src) {
      const img = new Image()
      img.onload = () => {
        this.originalImage = img
        this.srcImage = src
        this.$nextTick(() => this.renderWatermark())
      }
      img.src = src
    },
    renderWatermark() {
      if (!this.originalImage || !this.watermarkText) return
      const img = this.originalImage
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const maxFontSize = Math.max(24, Math.floor(Math.min(img.naturalWidth, img.naturalHeight) / 15))
      ctx.font = `bold ${maxFontSize}px "Microsoft YaHei","PingFang SC",sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = this.colorHexToRgba(this.color, this.opacity / 100)

      ctx.fillText(this.watermarkText, img.naturalWidth / 2, img.naturalHeight / 2)

      this.srcImage = canvas.toDataURL('image/png')
      this._lastCanvas = canvas
    },
    colorHexToRgba(hex, alpha) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r},${g},${b},${alpha})`
    },
    downloadImage() {
      const canvas = this._lastCanvas
      if (!canvas) return
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
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
.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 4px;
  min-height: 120px;
  padding: 10px;
  text-align: center;
  transition: border-color .2s;
  margin: 5px;
}
.drop-zone-active {
  border-color: #1aa094;
  background: rgba(26,160,148,.05);
}
.drop-placeholder {
  color: #999;
  line-height: 100px;
  user-select: none;
}
</style>
