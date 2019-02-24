<template>
  <div class="layui-form-item custom-input-txt layui-form-text">
    <textarea
      v-keydown-tab
      v-model="currentValue"
      @keyup="e=>$emit('change',e)"
      :placeholder="placeholder"
      class="layui-textarea"
      :class="areaClass"
      :rows="rows"
    ></textarea>
  </div>
</template>
<script>
export default {
  props: ["value", "label", "placeholder", "areaClass", "rows"],
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
<style>
.custom-input-txt .layui-textarea {
  min-height: auto;
}
</style>
