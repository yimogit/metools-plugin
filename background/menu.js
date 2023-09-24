var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];
//310
var genId = 'scewm';
chrome.contextMenus.create({ id: genId, "title": '生成二维码', contexts: ['link', 'page'] });
var sbId = 'sbewm';
chrome.contextMenus.create({ id: sbId, "title": '识别二维码', contexts: ['image'] });
var fanyiId = 'fyxzwz';
chrome.contextMenus.create({ id: fanyiId, "title": '翻译选中文字', contexts: ['selection'] });

function genericOnClick(info, tab) {
  var url = ''
  if (info.menuItemId === fanyiId && info.selectionText) {
    url = ('https://fanyi.baidu.com/#auto/zh/') + info.selectionText;
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
    chrome.tabs.create({ url: url });
  }

}

chrome.contextMenus.onClicked.addListener(genericOnClick)