<template>
     <div id="app">
         <v-select v-model="currentOption" :options="menuOptions" @change="changeMenu"></v-select>
         <router-view></router-view>
    </div>
</template>
<script>
import cacheHelper from './utils/cacheHelper';
export default {
  data() {
    return {
      currentOption: null,
      menuOptions: []
    };
  },
  methods: {
    changeMenu(value) {
      this.$router.push(value);
    }
  },
  created() {
    var menuItems = window.siteData.MenuItems;
    let self = this;
    var current_page = cacheHelper.GetCacheByKey("current_page");
    self.currentOption=current_page
    menuItems.forEach(item => {
      self.menuOptions.push({
        Text: item.MenuName,
        Value: item.MenuUrl
      });
    });
  }
};
</script>