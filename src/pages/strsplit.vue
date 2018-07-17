<template>
  <v-tab :items="tabItems">
    <div slot="main">
      <div class="layui-form-item layui-form-text">
        <textarea v-model="beforeTxt" placeholder="待处理字符串..." class="layui-textarea" rows="15"></textarea>
      </div>
      <div class="layui-form-item layui-form-text">
        <v-button @click="addRule()">
          <span>
            <i class="layui-icon">&#xe654; </i>添加规则</span>
        </v-button>
      </div>
      <div class="layui-form-item layui-form-text " v-for="(item,index) in ruleA" :key="index">
        <input v-model="ruleA[index]" class="layui-input" placeholder="替换字符串/规则" />
        <span style="height:38px;line-height:38px;">→_→</span>
        <input type="text" class="layui-input" v-model="ruleB[index]" placeholder="替换字符串" />
        <i class="layui-icon editicon" @click="removeRule(index)">&#xe640;</i>
      </div>
      <div class="layui-form-item layui-form-text">
        <v-button @click="replaceTxt()">
          <span>替换
            <i class="layui-icon">&#xe61a; </i>
          </span>
        </v-button>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea v-model="afterTxt" placeholder="处理后字符串..." class="layui-textarea" rows="15"></textarea>
      </div>
    </div>
  </v-tab>
</template>
<style>
.editicon {
  font-size: 30px;
  color: #2f4056;
  cursor: pointer;
}
</style>

<script>
export default {
  meta: {
    menuName: '字符串模板替换',
    sort: 204
  },
  data() {
    return {
      tabItems: [
        {
          Name: 'main',
          Title: '字符串替换'
        }
      ],
      beforeTxt: '',
      afterTxt: '',
      selectRule: [''],
      ruleA: [''],
      ruleB: ['']
    }
  },
  methods: {
    replaceTxt() {
      var str = this.beforeTxt
      var r1 = this.ruleA
      var r2 = this.ruleB

      for (var i = 0; i < r1.length; i++) {
        str = str.replace(new RegExp(r1[i], 'g'), r2[i])
      }
      this.afterTxt = str
    },
    addRule() {
      this.ruleA.push('')
      this.ruleB.push('')
    },
    removeRule(index) {
      this.ruleB.splice(index, 1)
      this.ruleA.splice(index, 1)
    }
  }
}
</script>