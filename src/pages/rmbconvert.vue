<template>
  <v-tab :items="tabItems">
    <div slot="main">
      <div class="layui-form-item layui-form-text">
        <input v-model="beforeTxt" placeholder="数字..." class="layui-input" />
      </div>
      <div class="layui-form-item layui-form-text">
        <v-button @click="convertDxRmb()">
          <span>大写
            <i class="layui-icon">&#xe61a; </i>
          </span>
        </v-button>
        <v-button @click="convertXxRmb()">
          <span>小写
            <i class="layui-icon">&#xe619; </i>
          </span>
        </v-button>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea v-model="afterTxt" placeholder="中文..." class="layui-textarea"></textarea>
      </div>
    </div>
  </v-tab>
</template>
<script>
import rmbHelper from '../utils/rmbHelper'
export default {
  meta: {
    menuName: '人民币转换',
    sort: 207
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'main',
          Title: '人民币转换'
        }
      ],
      beforeTxt: '',
      afterTxt: ''
    }
  },
  mounted() {},
  methods: {
    convertDxRmb() {
      var beforeTxt = this.beforeTxt
      this.afterTxt = rmbHelper.convert(beforeTxt)
    },
    convertXxRmb() {
      var afterTxt = this.afterTxt
      this.beforeTxt = rmbHelper.rmbToNum(afterTxt)
    }
  }
}
</script>