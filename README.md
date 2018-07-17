## 这是什么？

> 这是一个使用 vue.js 构建的纯静态工具,包含多种格式的加密/解密，编码/解密，二维码生成/识别,百度/有道的英汉互译,md 与 html 互转，模板替换等功能
> [![Build Status](https://travis-ci.org/yimogit/metools.svg?branch=master)](https://travis-ci.org/yimogit/metools)

### 插件预览

在线访问：https://metools.js.org

![图片](https://dn-coding-net-production-pp.qbox.me/89415c80-dae3-46dc-9abe-94fcad9971f1.png)

## 项目如何启动

0.  还原依赖包: `npm install`
1.  运行：`npm run dev`
1.  打包：`npm run build` //会自动将 manifest.json 与 logo.png 复制到 dist 目录，dist 目录为插件目录

## 插件安装

0.  [商店下载](https://chrome.google.com/webstore/detail/metools/gpmjnakadlflmpekiimgbflnkmkncjie)
1.  [Github 下载](https://github.com/yimogit/metools-plugin/releases/download/v1.0/metools.crx)
2.  打开 chrome 扩展页：chrome://extensions/
3.  将扩展拖到浏览器中。。

## 插件调试

0.  你需要一个 chrome 浏览器
1.  打开扩展列表：[chrome://extensions/](chrome://extensions/)
1.  启用开发着模式，加载 dist 目录即可
    ![图片](https://dn-coding-net-production-pp.qbox.me/c2c608ed-90d3-4dbe-98be-e6dc0c68f5c1.png)
1.  修改后，重新执行`npm run build`，然后重新加载插件即可在右上插件查看效果
1.  在调用 chrome 的 api 时，以`if (typeof chrome != undefined && chrome.tabs) {}`判断是否为插件模式
1.  同时可以将此应用部署到 coding 或者 GitHub 使用 pages 服务访问

## 插件开发

Api 文档：http://open.chrome.360.cn/extension_dev/overview.html
