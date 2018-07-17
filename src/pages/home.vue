<template>
  <div class="home-block">
    <blockquote v-for="(item,index) in menus" :key="index" class="layui-elem-quote layui-quote-nm left-block" @click="$options.filters.openRoute(item.menuUrl)">
      <router-link :to="{path:item.menuUrl}" v-if="item.menuUrl && item.menuUrl.indexOf('/')==0 ">{{item.menuName}}</router-link>
      <a :href="item.menuUrl" target="_blank" v-else>{{item.menuName}}</a>
    </blockquote>
  </div>
</template>
<script>
import cacheHelper from '../utils/cacheHelper'
export default {
  meta: {
    indexHide: true,
    menuName: '快速导航',
    sort: -1
  },
  data() {
    return {
      menus: []
    }
  },
  created() {
    this.menus = window.siteMenuItems.filter(e => e.indexHide !== true)
  },
  methods: {}
}
</script>
<style scoped>
.home-block {
  margin-top: 5px;
}
.left-block {
  width: 150px;
  float: left;
  margin-left: 10px;
  cursor: pointer;
}
</style>
