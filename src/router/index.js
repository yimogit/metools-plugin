import Vue from 'vue'
import VueRouter from 'vue-router'
import cacheHelper from '../utils/cacheHelper'

const allpages = getAllPages()
function getAllPages() {
  const files = require.context('../pages', true, /\.vue/)
  const modules = []
  const menus = JSON.parse(localStorage.InsertMenus || '[]').map(e => {
    return Object.assign(e, JSON.parse(localStorage.getItem(e.menuUrl)))
  })
  console.log(menus)
  files.keys().forEach(key => {
    var mk = key.replace(/(^\.\/|\.vue$)/g, '')
    var m = files(key)

    var path = '/' + mk
    modules.push({
      name: mk,
      path: path,
      component: m
    })
    if (m.meta && m.meta.menuName) {
      var defMenu = {
        menuName: m.meta ? m.meta.menuName : mk,
        menuUrl: path,
        sort: m.meta.sort || 0,
        indexHide: m.meta.indexHide === true,
        navHide: m.meta.navHide === true
      }
      var customMenu = Object.assign(
        defMenu,
        JSON.parse(localStorage.getItem(path))
      )
      menus.push(customMenu)
    }
  })
  window.siteMenuItems = menus.sort((a, b) => (a.sort - b.sort > 0 ? 1 : -1))
  return modules
}
Vue.use(VueRouter)
const router = new VueRouter({
  mode: 'hash', //history 打包需要使用hash
  routes: [
    { name: 'index', path: '/', redirect: '/home', meta: {} },
    ...allpages,
    { name: '404', path: '*', redirect: '/home' }
  ]
})

router.beforeEach((to, from, next) => {
  var current_page = cacheHelper.GetCacheByKey('current_page') || '/home'
  if (to.path == '/home' && from.path == '/' && current_page != '/home') {
    //第一次到首页
    next(current_page)
    return
  }
  cacheHelper.SetCacheByKey('prev_page', from.fullPath || '')
  // console.log(`路由开始：${from.path}`)
  // console.log(from)
  next()
})

router.afterEach(route => {
  cacheHelper.SetCacheByKey('current_page', route.fullPath || '')
  // console.log(route);
  // console.log(`路由结束：${route.path}`)
})
export default router
