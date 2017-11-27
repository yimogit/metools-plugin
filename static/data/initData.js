window.siteData={
    MenuItems:getMenuItems()
}
function getMenuItems(){
    return [
        {
            Key: '100',
            MenuName: '快速导航',
            MenuUrl: '/home'
        },
        {
            Key: '208',
            MenuName: '在线翻译',
            MenuUrl: '/fanyi'
        },
        {
            Key: '207',
            MenuName: '二维码生成/识别',
            MenuUrl: '/qrcode'
        },
        {
            Key: '206',
            MenuName: 'MD与Html互转',
            MenuUrl: '/mdconvert'
        },
        {
            Key: '201',
            MenuName: '加密/解密',
            MenuUrl: '/encrypt'
        },
        {
            Key: '202',
            MenuName: '编码/解码',
            MenuUrl: '/encode'
        },
        {
            Key: '203',
            MenuName: '图片转base64',
            MenuUrl: '/tobase64'
        },
        {
            Key: '204',
            MenuName: '简单模板替换',
            MenuUrl: '/strsplit'
        },
        {
            Key: '205',
            MenuName: '人民币转换',
            MenuUrl: '/rmbconvert'
        }
    ];
}