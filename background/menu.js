var MENU_IDS = {
  qrcodeGenerate: 'scewm',
  qrcodeDecode: 'sbewm',
  translateSelection: 'fyxzwz'
};

var MENU_ITEMS = [
  {
    id: MENU_IDS.qrcodeGenerate,
    title: '生成二维码',
    contexts: ['link', 'page']
  },
  {
    id: MENU_IDS.qrcodeDecode,
    title: '识别二维码',
    contexts: ['image']
  },
  {
    id: MENU_IDS.translateSelection,
    title: '翻译选中文字',
    contexts: ['selection']
  }
];

function createContextMenus() {
  chrome.contextMenus.removeAll(function () {
    MENU_ITEMS.forEach(function (item) {
      chrome.contextMenus.create(item);
    });
  });
}

function getExtensionUrl(path) {
  return chrome.runtime.getURL(path);
}

function handleContextMenuClick(info) {
  var url = '';

  if (info.menuItemId === MENU_IDS.translateSelection && info.selectionText) {
    url = 'https://fanyi.baidu.com/#auto/zh/' + encodeURIComponent(info.selectionText);
  } else if (info.menuItemId === MENU_IDS.qrcodeGenerate) {
    var linkUrl = info.linkUrl || info.pageUrl;
    url = getExtensionUrl('index.html#/qrcode?url=' + encodeURIComponent(linkUrl));
  } else if (info.menuItemId === MENU_IDS.qrcodeDecode && info.mediaType === 'image') {
    url = getExtensionUrl('index.html#/qrcode?type=decode&url=' + encodeURIComponent(info.srcUrl));
  }

  if (url) {
    chrome.tabs.create({ url: url });
  }
}

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
