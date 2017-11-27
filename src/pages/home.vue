<template>
    <div class="home-block">
            <blockquote v-for="item in menus" :key="item.Key" v-if="item.Key!='100'" class="layui-elem-quote layui-quote-nm left-block" @click="$options.filters.openRoute(item.MenuUrl)" >
                <router-link :to="{path:item.MenuUrl}" v-if="item.MenuUrl && item.MenuUrl.indexOf('/')==0 ">{{item.MenuName}}</router-link>
                <a :href="item.MenuUrl" target="_blank" v-else>{{item.MenuName}}</a>
            </blockquote>
    </div>
</template>
<script>
import cacheHelper from "../utils/cacheHelper";
export default {
  data() {
    return {
      menus: []
    };
  },
  created() {
    let self = this;
    self.menus = [];
    window.siteData.MenuItems.forEach(item => {
      if (item.ChildrenMenu && item.ChildrenMenu.length > 0) {
        item.ChildrenMenu.forEach(item2 => {
          self.menus.push(item2);
        });
      } else {
        self.menus.push(item);
      }
    });
  },
  methods: {}
};
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
