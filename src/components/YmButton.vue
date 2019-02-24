<template>
    <button class="layui-btn" @click="clickHandler">
        <slot></slot>
        <v-icon v-if="icon" :icon="icon" />
    </button>
</template>

<script>
export default {
  name: 'v-button',
  props: ['icon'],
  components: {
    'v-icon': require('./YmIcon')
  },
  data() {
    return {}
  },
  created() {},
  mounted() {},
  methods: {
    clickHandler() {
      this.$emit('click')
    }
  }
}
</script>