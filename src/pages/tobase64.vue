<template>
  <div
    style="width:100%;height:100%;"
    class="layui-tab-brief"
  >
    <div style="width:100%;height:100%;">
      <div class="layui-form-item layui-form-text" style="padding:5px;">
        <div style="height:30px;;line-height:30px;float:left;">粘贴图片或上传图片即可</div>
        <v-upload
          @before="toBase64"
          :beforeShow="true"
          :uploadApi="'/static/data/editorUpload.json'"
          style="height:30px;"
        >
          <v-button style="position: absolute;">
            选择图片
          </v-button>
        </v-upload>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea
          v-model="previewBase64"
          placeholder="Base64图片"
          class="layui-textarea"
        ></textarea>
      </div>
      <div class="layui-form-item layui-form-text">
        <img
          :src="previewBase64"
          v-if="previewBase64"
          style="width:200px;"
        />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  meta: {
    menuName: "图片转base64",
    sort: 203
  },
  data() {
    return {
      previewBase64: ""
    };
  },
  mounted() {
    this.pasteInit();
  },
  methods: {
    toBase64(base64) {
      this.previewBase64 = base64;
    },
    pasteInit() {
      let _this = this;
      document.addEventListener("paste", function(e) {
        if (!(e.clipboardData && e.clipboardData.items)) {
          return;
        }
        for (var i = 0, len = e.clipboardData.items.length; i < len; i++) {
          var item = e.clipboardData.items[i];
          if (item.kind === "string") {
            item.getAsString(function(str) {
              // str 是获取到的字符串
            });
          } else if (item.kind === "file") {
            var pasteFile = item.getAsFile();
            // pasteFile就是获取到的文件
            var reader = new FileReader();
            reader.readAsDataURL(pasteFile);
            reader.onload = function(e) {
              _this.toBase64(e.target.result);
            };
          }
        }
      });
    }
  }
};
</script>