<template>
    <div style="width:100%;height:100%;" class="layui-tab-brief">
        <ul class="layui-tab-title site-demo-title" style="margin-bottom:10px;">
            <li class="layui-this" @click="switchTab(1)">图片转Base64</li>
        </ul>
        <div style="width:100%;height:100%;">
            <div class="layui-form-item layui-form-text">
                <v-upload @before="toBase64" :beforeShow="true" :uploadApi="'/static/data/editorUpload.json'"></v-upload>
            </div>
            <div class="layui-form-item layui-form-text">
                <textarea v-model="previewBase64" placeholder="Base64图片" class="layui-textarea"></textarea>
            </div>
            <div class="layui-form-item layui-form-text">
                <img :src="previewBase64" v-if="previewBase64" style="width:200px;" />
            </div>
        </div>
    </div>
</template>
<script>
export default {
  meta: {
    menuName: '图片转base64',
    sort: 203
  },
  data() {
    return {
      previewBase64: ''
    }
  },
  methods: {
    toBase64(base64) {
      this.previewBase64 = base64
    }
  }
}
</script>