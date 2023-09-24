<template>
  <v-tab :items="tabItems">
    <div slot="main">
      <div class="layui-form-item layui-form-text">
        <textarea v-model="beforeTxt" placeholder="压缩后的JSON" class="layui-textarea" wrap="off"></textarea>
      </div>
      <div class="layui-form-item layui-form-text">
        <div style="border: 0;width: 30%;display: inline-block;line-height: 38px;">
          <input v-model="replaceTxt" placeholder="缩进" class="layui-input" type="number" />
        </div>
        <v-button @click="convertFormatJson()">
          <span>格式化
            <i class="layui-icon">&#xe61a; </i>
          </span>
        </v-button>
        <v-button @click="convertMiniJson()">
          <span>压缩
            <i class="layui-icon">&#xe619; </i>
          </span>
        </v-button>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea v-model="afterTxt" placeholder="格式化后端JSON" rows="13" class="layui-textarea" wrap="off"></textarea>
      </div>
    </div>
  </v-tab>
</template>
<script>
export default {
  meta: {
    menuName: 'JSON格式化',
    sort: 31,
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'main',
          Title: 'JSON格式化',
        },
      ],
      replaceTxt: 4,
      beforeTxt: '',
      afterTxt: '',
    }
  },
  created() {
    if (localStorage.JsonFormat_Number)
      this.replaceTxt = Number(localStorage.JsonFormat_Number)
  },
  methods: {
    convertFormatJson() {
      this.saveReplaceTxt()
      var beforeTxt = this.beforeTxt
      try {
        var jsonObj = JSON.parse(beforeTxt)   //把json字符串转为json对象
        this.afterTxt = JSON.stringify(jsonObj, null, Number(this.replaceTxt))
      } catch (e) {
        console.log(e)
        this.afterTxt = 'JSON格式不正确:' + e
      }
    },
    convertMiniJson() {
      this.saveReplaceTxt()
      var afterTxt = this.afterTxt
      try {
        var jsonObj = JSON.parse(afterTxt)   //把json字符串转为json对象
        this.beforeTxt = JSON.stringify(jsonObj, null, 0)
      } catch (e) {
        console.log(e)
        this.afterTxt = 'JSON格式不正确:' + e
      }
    },
    saveReplaceTxt() {
      this.replaceTxt = this.replaceTxt || '4'
      localStorage.JsonFormat_Number = this.replaceTxt
    },
  },
}
</script>
