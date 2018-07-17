<template>
  <div class="custom-select-single layui-unselect layui-form-select" :class="{'layui-form-selected':selectShow}">
    <div class="layui-select-title">
      <input type="text" placeholder="--------请选择--------" @click.stop="changeSelect" readonly :value="currentValue.Text" class="layui-input layui-unselect">
      <i class="layui-edge" @click.stop="changeSelect"></i>
    </div>
    <dl class="layui-anim layui-anim-upbit" v-show="selectShow">
      <dd v-for="(item,index) in currentOptions" :key="index" :class="{'layui-this':currentValue.Value==item.Value}" @click="currentSelect(item)" value="item.Value">{{item.Text}}</dd>
    </dl>
  </div>
</template>
<script>
export default {
  props: ['value', 'options', 'hasNull'],
  data() {
    return {
      selectShow: false,
      currentValue: {
        Text: '',
        Value: null
      },
      currentOptions: []
    }
  },
  watch: {
    value: {
      handler(val) {
        this.currentValue = this.options.find(e => e.Value === val) || {
          Text: '',
          Value: null
        }
      },
      immediate: true
    }
  },
  created() {
    if (this.hasNull) {
      this.currentOptions.push({ Text: '--------请选择--------', Value: '' })
    }
    this.currentOptions = this.currentOptions.concat(this.options)
  },
  methods: {
    currentSelect(item) {
      let self = this
      self.currentValue = item
      this.changeSelect()
      this.$emit('input', item.Value)
      this.$emit('change', item.Value)
    },
    changeSelect() {
      this.selectShow = !this.selectShow
    }
  }
}
</script>