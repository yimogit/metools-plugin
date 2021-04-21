<template>
  <v-tab :items="tabItems">
    <div slot="main">
      <div class="layui-form-item layui-form-text">
        <input v-model="beforeTxt" placeholder="人类语言" class="layui-input" />
      </div>
      <div class="layui-form-item layui-form-text">
        <button style="border: 0;">
          <input
            v-model="replaceTxt"
            placeholder="非人语"
            class="layui-input"
          />
        </button>
        <v-button @click="convertGossip()">
          <span
            >流言蜚语
            <i class="layui-icon">&#xe61a; </i>
          </span>
        </v-button>
        <v-button @click="convertMan()">
          <span
            >人言可畏
            <i class="layui-icon">&#xe619; </i>
          </span>
        </v-button>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea
          v-model="afterTxt"
          placeholder="非人类语言"
          class="layui-textarea"
        ></textarea>
      </div>
      参考项目：https://github.com/miao-lang/miao-lang
    </div>
  </v-tab>
</template>
<script>
import miaoHelper from '../utils/miaoHelper'
export default {
  meta: {
    menuName: '非人语转换',
    sort: 30,
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'main',
          Title: '非人语转换',
        },
      ],
      replaceTxt: '喵',
      beforeTxt: '',
      afterTxt: '',
    }
  },
  created() {
    if (localStorage.Gossip_Replace_Txt)
      this.replaceTxt = localStorage.Gossip_Replace_Txt
  },
  methods: {
    convertGossip() {
      this.saveReplaceTxt()
      var beforeTxt = this.beforeTxt
      this.afterTxt = miaoHelper.encode(beforeTxt, this.replaceTxt)
    },
    convertMan() {
      this.saveReplaceTxt()
      var afterTxt = this.afterTxt
      this.beforeTxt = miaoHelper.decode(afterTxt)
    },
    saveReplaceTxt() {
      this.replaceTxt = this.replaceTxt || '喵'
      localStorage.Gossip_Replace_Txt = this.replaceTxt
    },
  },
}
</script>
