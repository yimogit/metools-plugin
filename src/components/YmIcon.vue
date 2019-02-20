<template>
  <i class="layui-icon">
    <template v-if="icon=='up'">
      &#xe619;
    </template>
    <template v-if="icon=='down'">
      &#xe61a;
    </template>
    <template v-if="icon=='delete'">
      &#xe640;
    </template>
  </i>
</template>

<script>
export default {
  name: 'v-icon',
  props: ['icon'],
  data() {
    return {}
  }
}
</script>