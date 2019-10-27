var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
//310
var genId = chrome.contextMenus.create({ "title": '生成二维码', contexts: ['link', 'page'], "onclick": genericOnClick });
var sbId = chrome.contextMenus.create({ "title": '识别二维码', contexts: ['image'], "onclick": genericOnClick });
var fanyiId = chrome.contextMenus.create({ "title": '翻译选中文字', contexts: ['selection'], "onclick": genericOnClick });

function genericOnClick(info, tab) {
  var url = ''
  if (info.menuItemId === fanyiId && info.selectionText) {
    url = (localStorage.CUSTOM_FANYIAPI_URL || 'https://fanyi.baidu.com/#auto/zh/') + info.selectionText;
  }
  else if (info.menuItemId === genId) {
    var linkUrl = info.linkUrl || info.pageUrl
    //生成二维码
    url = 'chrome-extension://' + chrome.runtime.id + '/index.html#/qrcode?url=' + encodeURIComponent(linkUrl)
  }
  else if (info.menuItemId === sbId && ['image'].indexOf(info.mediaType) > -1) {
    url = 'chrome-extension://' + chrome.runtime.id + '/index.html#/qrcode?type=decode&url=' + encodeURIComponent(info.srcUrl)
  }
  if (url) {
    window.open(url, '_blank');
  }

}