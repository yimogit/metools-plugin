<template>
  <div class="layui-form-item layui-form-text">
    <textarea
      v-keydown-tab
      v-model="currentValue"
      @keyup="e=>$emit('change',e)"
      :placeholder="placeholder"
      class="layui-textarea"
      :class="areaClass"
      :row="row"
    ></textarea>
  </div>
</template>
<script>
export default {
  props: ["value", "label", "placeholder", "areaClass","row"],
  data() {
    return {
      currentValue: this.value
    };
  },
  watch: {
    value(val) {
      this.currentValue = val;
    },
    currentValue(val) {
      this.$emit("input", val);
    }
  }
};
</script>
