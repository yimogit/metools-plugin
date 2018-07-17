<template>
  <v-tab :items="items">
    <div slot="common">
      <div class="layui-form-item">
        <label class="layui-form-label">输入框</label>
        <div class="layui-input-block">
          <input type="text" name="title" required lay-verify="required" placeholder="请输入标题" autocomplete="off" class="layui-input">
        </div>
      </div>
    </div>
    <div slot="menus">
      <div class="layui-form-item layui-form-text">
        <v-select v-model="selectValue" :options="menuOptions" :hasNull="true" @change="changeSelect"></v-select>
      </div>
      <div class="layui-form-item layui-form-text">
        <input type="text" v-model="selectMenu.menuName" placeholder="菜单名称" class="layui-input">
      </div>
      <div class="layui-form-item layui-form-text">
        <input type="text" v-model="selectMenu.menuUrl" placeholder="菜单链接" class="layui-input">
      </div>
      <div class="layui-form-item layui-form-text">
        <input type="number" v-model="selectMenu.sort" placeholder="菜单排序" class="layui-input">
      </div>
      <div class="layui-form-item layui-form-text">
        显示状态
        <v-checkbox v-model="selectMenu.indexHide" text="首页隐藏" />
        <v-checkbox v-model="selectMenu.navHide" text="导航隐藏" />
      </div>
      <div class="layui-form-item layui-form-text" v-if="selectValue">
        <v-button @click="saveSetting">保存设置</v-button>
        <v-button @click="removeCustomMenu" v-if="selectMenu.custom">删除</v-button>
      </div>
      <div class="layui-form-item layui-form-text" v-else>
        <v-button @click="addCustomMenu">添加菜单</v-button>
      </div>
    </div>
  </v-tab>
</template>

<script>
export default {
  meta: {
    navHide: true,
    menuName: '设置',
    sort: 999
  },
  data() {
    return {
      items: [
        {
          Title: '菜单设置',
          Name: 'menus'
        }
      ],
      setting: localStorage.CustomSetting || {},
      menus: [],
      selectValue: null,
      menuOptions: [],
      selectMenu: {}
    }
  },
  created() {
    this.menus = window.siteMenuItems
    this.menuOptions = window.siteMenuItems.map(e => {
      return {
        Text: e.menuName,
        Value: e.menuUrl
      }
    })
  },
  methods: {
    changeSelect(item) {
      this.selectMenu = this.menus.find(e => e.menuUrl === item) || {}
    },
    checkForm() {
      if (!this.selectMenu.menuName || !this.selectMenu.menuUrl) {
        window.layui.layer.msg('菜单名称，菜单链接必须填写')
        return false
      }
      return true
    },
    saveSetting() {
      if (!this.checkForm()) return
      localStorage.setItem(
        this.selectMenu.menuUrl,
        JSON.stringify(Object.assign({ sort: 0 }, this.selectMenu))
      )
      this.reload()
    },
    addCustomMenu() {
      if (!this.checkForm()) return
      var customMenus = JSON.parse(localStorage.InsertMenus || '[]')
      if (
        customMenus.find(
          e =>
            e.menuName === this.selectMenu.menuName ||
            e.menuUrl === this.selectMenu.menuUrl
        )
      ) {
        return layui.msg('不能添加重复的名称或Url')
      }
      customMenus.push(
        Object.assign({ custom: true, sort: 0 }, this.selectMenu)
      )
      localStorage.setItem('InsertMenus', JSON.stringify(customMenus))
      this.reload()
    },
    removeCustomMenu() {
      var customMenus = JSON.parse(localStorage.InsertMenus || '[]')
      customMenus = customMenus.filter(
        e =>
          e.menuName !== this.selectMenu.menuName &&
          e.menuUrl !== this.selectMenu.menuUrl
      )
      localStorage.setItem('InsertMenus', JSON.stringify(customMenus))
      localStorage.removeItem(this.selectMenu.menuUrl)
      this.reload()
    },
    reload() {
      location.reload()
    }
  }
}
</script>

<style>
</style>
