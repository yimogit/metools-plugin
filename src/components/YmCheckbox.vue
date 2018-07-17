<template>
    <div class="layui-unselect layui-form-checkbox" :class="{'layui-form-checked':currentValue}" @click="changeCheckd">
        <span>{{text}}</span>
        <i class="layui-icon"></i>
    </div>
</template>
<script>
export default {
  props: ['value', 'text'],
  data() {
    return {
      selectShow: false,
      currentValue: this.value
    }
  },
  watch: {
    value(val) {
      this.currentValue = val
    }
  },
  created() {},
  methods: {
    changeCheckd() {
      this.currentValue = !this.currentValue
      this.$emit('input', this.currentValue)
    }
  }
}
</script>