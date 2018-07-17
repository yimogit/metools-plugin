import router from '../router'
export default {
  openRoute(route) {
    if (typeof route === 'string' && route.indexOf('http') == 0) {
      this.openRedirect(route)
      return
    }
    router.push(route)
  },
  openRedirect(url) {
    window.open(url)
  },
  openLayer(url, title) {
    window.layui.layer.open({
      type: 2,
      shade: 0,
      skin: 'layui-layer-molv',
      anim: 4,
      offset: 'rb',
      area: ['400px', '500px'],
      title: title,
      content: url
    })
  }
}
