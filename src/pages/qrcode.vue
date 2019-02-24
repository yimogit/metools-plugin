<template>
  <v-tab :items="tabItems">
    <div slot="generatecode">
      <div class="layui-form-item" >
        <v-button @click="addItem">添加新项</v-button>
        <v-button @click="saveData">保存数据</v-button>
        <v-button @click="s=>showMoreBtn=!showMoreBtn" :icon="showMoreBtn?'right':'down'">更多</v-button>
      </div>
      <div class="layui-form-item layui-form-text" v-if="showMoreBtn">
        <label style="float:left">
          <span style="float:left;line-height:38px;">背景色:</span>
          <input
            type="color"
            class="layui-input"
            v-model="form.bgcolor"
            @change="convert"
            style="width:100px;padding-left:0;"
          />
        </label>
        <label style="float:left;margin-left:5px;margin-right:5px;">
          <span style="float:left;line-height:38px;">填充色：</span>
          <input
            type="color"
            class="layui-input"
            v-model="form.color"
            @change="convert"
            style="width:100px;padding-left:0;"
          />
        </label>
      </div>
      <div class="layui-form-item " v-if="showMoreBtn">
        <v-upload
          @before="addImage"
          :beforeShow="true"
          :uploadApi="'/static/data/editorUpload.json'"
          style="height:30px;"
        >
          <v-button style="position: absolute;">
            添加LOGO
          </v-button>
        </v-upload>
        <img
          v-if="form.logoImg"
          :src="form.logoImg"
          style="width:40px;height:40px;"
        />
        <button
          class="layui-btn layui-btn-danger layui-btn-mini"
          @click="e=>{this.form.logoImg=null;this.convert()}"
          v-if="form.logoImg"
        >
          <i class="layui-icon">&#xe640;</i>
        </button>
      </div>
      <fieldset
        class="layui-elem-field"
        v-for="(item,index) in dataList"
        :key="'t_'+index"
      >
        <legend>第{{dataList.length-index}}项
          <button
            class="layui-btn layui-btn-danger layui-btn-mini"
            @click="e=>dataList.splice(dataList.length-index-1,1)"
          >
            <i class="layui-icon">&#xe640;</i>
          </button>
        </legend>
        <div class="layui-field-box">
          <v-input-txt
            label="文本/Url"
            placeholder="将要生成二维码的文本或链接"
            v-model="item.text"
            @change="convert"
            :row="2"
          ></v-input-txt>
          <img
            :src="item.src"
            v-show="item.text"
            :id="'custom-img-'+(dataList.length-index)"
          />
        </div>
      </fieldset>
    </div>
    <div slot="decode">
      <div
        id="qrfile"
        qrCanvas="qr-canvas"
        qrResult="qrcode_content"
      >
        <div title="把您的二维码拖到这儿，即可识别内容">
          <div
            class="browser"
            id="canvas_ext_div"
          >
            <label style="height:30px;line-height:30px;">
              <span>选择要识别的二维码，粘贴剪切板或者拖动图片到面板中</span>
              <input
                type="file"
                name="files"
                accept="image/*"
                id="ewmfile"
                title="选择文件后自动识别"
              >
            </label>
          </div>
        </div>
        <canvas
          style="border: 1px solid #CCC;"
          id="qr-canvas"
        ></canvas>
      </div>
      <div>识别结果：
        <p
          id="qrcode_content"
          style="border: 1px solid #ccc;line-height: 30px;word-break: break-all"
        ></p>
      </div>
    </div>
  </v-tab>
</template>
<script>
// import jrQrcode from "jr-qrcode";
import QrCodeWithLogo from "qr-code-with-logo";
import webqr from "../assets/qrcode/webqr.js";
import common from "../utils/common";
export default {
  meta: {
    menuName: "二维码生成/识别",
    sort: 101
  },
  data() {
    return {
      tabItems: [
        {
          Name: "generatecode",
          Title: "二维码生成"
        },
        {
          Name: "decode",
          Title: "二维码解码"
        }
      ],
      dataList: [],
      form: {
        color: "#1aa094",
        bgcolor: "#ffffff",
        logoImg: null
      },
      dataTxt: "",
      showMoreBtn:false
    };
  },
  created() {
    let self = this;
    window.webqr = webqr;
    if (typeof chrome != undefined && chrome.tabs) {
      chrome.tabs.getSelected(function(tab) {
        self.dataTxt = tab.url;
        self.loadData();
      });
    } else {
      self.dataTxt = location.href;
      self.loadData();
    }
    this.$nextTick(() => {
      layui.jquery("#ewmfile").change(function() {
        // console.log(this.files);
        webqr.handleFiles(this.files);
      });
      this.selectDecode();
      this.pasteInit();
    });
  },
  methods: {
    addItem() {
      this.dataList.splice(0, 0, { text: "", src: "" });
      //   this.dataList.push({ text: "", src: "" });
    },
    addImage(base64) {
      this.form.logoImg = base64;
      this.convert();
    },
    loadData() {
      this.dataList = JSON.parse(
        localStorage.getItem("me_qrcode_list") || "[]"
      ).filter(s => s.text);
      if (this.dataList.length === 0) {
        this.dataList = [{ text: this.dataTxt, src: '' }];
      }
      this.form =
        JSON.parse(localStorage.getItem("me_qrcode_form") || "null") ||
        this.form;
      this.$nextTick(() => {
        this.convert();
      });
    },
    saveData() {
      localStorage.setItem("me_qrcode_list", JSON.stringify(this.dataList));
      localStorage.setItem("me_qrcode_form", JSON.stringify(this.form));
      window.layui.layer.msg("保存成功");
    },
    convert() {
      var list = this.dataList;
      var color = this.color;
      var bgcolor = this.bgcolor;
      let _this = this;
      list.forEach(function(item, index) {
        if (!item.text) return;
        var image = QrCodeWithLogo.toImage({
          image: document.getElementById("custom-img-" + (list.length - index)), // 换成你的canvas节点
          content: item.text,
          width: 256,
          logo: _this.form.logoImg && {
            src: _this.form.logoImg
          },
          nodeQrCodeOptions: {
            color: {
              dark: _this.form.color,
              light: _this.form.bgcolor
            }
          }
        });
      });
    },
    selectDecode() {
      webqr.load("qrfile", 200, 200);
    },
    pasteInit() {
      document.addEventListener("paste", function(e) {
        if (!(e.clipboardData && e.clipboardData.items)) {
          return;
        }
        for (var i = 0, len = e.clipboardData.items.length; i < len; i++) {
          var item = e.clipboardData.items[i];
          if (item.kind === "string") {
            item.getAsString(function(str) {
              // str 是获取到的字符串
            });
          } else if (item.kind === "file") {
            var pasteFile = item.getAsFile();
            // pasteFile就是获取到的文件
            webqr.handleFiles([pasteFile]);
          }
        }
      });
    }
  }
};
</script>