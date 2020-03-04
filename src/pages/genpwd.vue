<template>
  <v-tab :items="tabItems">
    <div slot="htpasswd">
      <div class="layui-form-item layui-form-text">
        <input
          v-model="model.userName"
          placeholder="用户名"
          class="layui-input"
          @keyup="genHtpasswd"
        />
      </div>
      <div class="layui-form-item layui-form-text">
        <input
          v-model="model.userPwd"
          placeholder="密码"
          class="layui-input"
          @keyup="genHtpasswd"
        />
      </div>
      <div class="layui-form-item layui-form-text">
        <!-- <v-select
          v-model="currentHtpasswdType"
          :options="htpasswdOptions"
        ></v-select> -->
        <v-radio
          v-model="currentHtpasswdType"
          :options="htpasswdOptions"
          :optionsVal="htpasswdOptions.map(s=>s.Value)"
        ></v-radio>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea
          v-model="model.afterTxt"
          rows="3"
          placeholder="生成结果..."
          class="layui-textarea "
        ></textarea>

        <div
          class="well"
        >
          参考：http://tool.oschina.net/htpasswd
          <h4>什么是 htpasswd ?</h4>
          <p>htpasswd 是开源 http 服务器 <a
              href="http://www.oschina.net/p/apache+http+server"
              target="_blank"
            >apache httpd</a> 的一个命令工具，用于生成 http 基本认证的密码文件。</p>
          <h4>加密方式有什么区别？</h4>
          <p><strong>MD5:</strong>使用MD5加密密码。在Windows, Netware 和TPF上，这是默认的加密方式。</p>
          <p><strong>crypt:</strong>使用crypt()加密密码。在除了Windows, Netware和TPF的平台上，这是默认的。 虽然它在所有平台上可以为htpasswd所支持， 但是在Windows, Netware和TPF上不能为httpd服务器所支持。</p>
          <p><strong>SHA:</strong>使用SHA加密密码。 它是为了方便转入或移植到使用LDAP Directory Interchange Format (ldif)的Netscape而设计的。</p>
          <p><strong>plain:</strong>不加密，使用纯文本的密码。虽然在所有平台上 htpasswd 都可以建立这样的密码， 但是httpd后台只在Windows, Netware和TPF上支持纯文本的密码。</p>
        </div>
      </div>
    </div>
    <div slot="sitepwd">
      <div class="layui-form-item layui-form-text">
        <input
          v-model="model.domainName"
          placeholder="网站根域名"
          class="layui-input"
          @keyup="genSitePwd"
        />
      </div>
      <div class="layui-form-item layui-form-text">
        <input
          v-model="model.domainKey"
          placeholder="网站用户名/Key"
          class="layui-input"
          @keyup="genSitePwd"
        />
      </div>
      <div class="layui-form-item layui-form-text">
        <v-button
          icon="down"
          @click="genSitePwd"
        >生成密码</v-button>
      </div>
      <div class="layui-form-item layui-form-text">
        <textarea
          v-model="model.genPwdResult"
          rows="3"
          placeholder="生成密码..."
          class="layui-textarea "
        ></textarea>
      </div>
      <div>
        浏览器访问地址：<a
          href="https://metools.js.org/#/genpwd"
          target="_blank"
        >https://metools.js.org/#/genpwd</a>
      </div>
    </div>
  </v-tab>
</template>
<script>
import common from "../utils/common";
export default {
  meta: {
    menuName: "密码生成器",
    sort: 80
  },
  data() {
    return {
      tabItems: [
        {
          Name: "sitepwd",
          Title: "网站密码生成"
        },
        {
          Name: "htpasswd",
          Title: "htpasswd"
        }
      ],
      model: {
        userName: "",
        userPwd: "",
        afterTxt: "",
        genPwdResult: "",
        domainName: "",
        domainKey: ""
      },
      currentHtpasswdType: "plain",
      htpasswdOptions: [
        {
          Text: "plain (Windows &amp; TPF servers)",
          Value: "plain"
        },
        {
          Text: "Crypt (all Unix servers)",
          Value: "crypt"
        },
        {
          Text: "MD5 (Apache servers only)",
          Value: "md5"
        },
        {
          Text: "SHA-1 (Netscape-LDIF/Apache servers)",
          Value: "sha1"
        }
      ]
    };
  },
  created() {
    var _this = this;
    if (_this.$route.query.type === 'htpasswd') {
      this.tabItems = this.tabItems.reverse();
    }
    if (typeof chrome != undefined && chrome.tabs) {
      chrome.tabs.getSelected(function(tab) {
        _this.model.domainName = _this.getDomain(tab.url);
      });
    } else {
      _this.model.domainName = location.host;
    }
  },
  watch: {
    currentHtpasswdType(val) {
      this.genHtpasswd();
    }
  },
  methods: {
    getDomain(weburl) {
      var urlReg = /http[s]:\/\/([^\/]+)/i;
      var domain = weburl.match(urlReg);
      return domain != null && domain.length > 1 ? domain[1] : "";
    },
    genSitePwd() {
      this.model.genPwdResult = this.htpasswd(
        "",
        this.model.domainName + this.model.domainKey,
        "sha1"
      )
        .replace(":{SHA}", "")
        .replace("/", "")
        .replace("=", "")
        .replace("+", "")
        .substr(0, 8);
      console.log(this.model.genPwdResult);
    },
    genHtpasswd() {
      this.model.afterTxt = this.htpasswd(
        this.model.userName,
        this.model.userPwd,
        this.currentHtpasswdType
      );
    },
    htpasswd(user, pw, type) {
      var cpw = "";
      var AP_SHA1PW_ID = "{SHA}";
      var AP_MD5PW_ID = "$apr1$";
      switch (type) {
        case "plain":
          cpw = pw;
          break;
        case "crypt":
          var salt = this.getMd5Salt();
          cpw = this.getCrypt().displayPassword(pw, salt);
          break;
        case "md5":
          var salt = this.getMd5Salt();
          var msg = pw; // On commence par le mot de passe en clair
          msg += AP_MD5PW_ID; // puis le petit mot magique
          msg += salt; // et un peu de sel.

          var md5 = require("apache-md5");
          cpw = md5(pw + salt + pw);
          break;
        case "sha1":
          //   var sha1 = require("crypto-js/sha1");
          cpw = AP_SHA1PW_ID + this.sha1(pw);
          break;
      }

      if (user.length + 1 + cpw.length > 255) return "用户+生成密码长度超过255";
      else return user + ":" + cpw;
    },
    getMd5Salt() {
      var itoa64 =
        "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; /* 0 ... 63 => ASCII - 64 */
      function ap_to64(v, n) {
        var s = "";
        while (--n >= 0) {
          s += itoa64.charAt(v & 0x3f); // prend les 6 bits les plus à droite.
          v >>>= 6; // décale de 6 bits.
        }
        return s;
      }
      var salt =
        ap_to64(Math.floor(Math.random() * 16777215), 4) + // 2^24-1 : 4 * 6 bits.
        ap_to64(Math.floor(Math.random() * 16777215), 4); // 2^24-1 : 4 * 6 bits.

      return salt;
    },
    sha1(str) {
      /*
       * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
       * in FIPS PUB 180-1
       * Version 2.1-BETA Copyright Paul Johnston 2000 - 2002.
       * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
       * Distributed under the BSD License
       * See http://pajhome.org.uk/crypt/md5 for details.
       */

      /*
       * Configurable variables. You may need to tweak these to be compatible with
       * the server-side, but the defaults work in most cases.
       */
      var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
      var b64pad =
        "="; /* base-64 pad character. "=" for strict RFC compliance   */
      var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode      */

      /*
       * These are the functions you'll usually want to call
       * They take string arguments and return either hex or base-64 encoded strings
       */
      function hex_sha1(s) {
        return binb2hex(core_sha1(str2binb(s), s.length * chrsz));
      }
      function b64_sha1(s) {
        return binb2b64(core_sha1(str2binb(s), s.length * chrsz));
      }
      function str_sha1(s) {
        return binb2str(core_sha1(str2binb(s), s.length * chrsz));
      }
      function hex_hmac_sha1(key, data) {
        return binb2hex(core_hmac_sha1(key, data));
      }
      function b64_hmac_sha1(key, data) {
        return binb2b64(core_hmac_sha1(key, data));
      }
      function str_hmac_sha1(key, data) {
        return binb2str(core_hmac_sha1(key, data));
      }

      /*
       * Perform a simple self-test to see if the VM is working
       */
      function sha1_vm_test() {
        return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
      }

      /*
       * Calculate the SHA-1 of an array of big-endian words, and a bit length
       */
      function core_sha1(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << (24 - (len % 32));
        x[(((len + 64) >> 9) << 4) + 15] = len;

        var w = Array(80);
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        var e = -1009589776;

        for (var i = 0; i < x.length; i += 16) {
          var olda = a;
          var oldb = b;
          var oldc = c;
          var oldd = d;
          var olde = e;

          for (var j = 0; j < 80; j++) {
            if (j < 16) w[j] = x[i + j];
            else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            var t = safe_add(
              safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
              safe_add(safe_add(e, w[j]), sha1_kt(j))
            );
            e = d;
            d = c;
            c = rol(b, 30);
            b = a;
            a = t;
          }

          a = safe_add(a, olda);
          b = safe_add(b, oldb);
          c = safe_add(c, oldc);
          d = safe_add(d, oldd);
          e = safe_add(e, olde);
        }
        return Array(a, b, c, d, e);
      }

      /*
       * Perform the appropriate triplet combination function for the current
       * iteration
       */
      function sha1_ft(t, b, c, d) {
        if (t < 20) return (b & c) | (~b & d);
        if (t < 40) return b ^ c ^ d;
        if (t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
      }

      /*
       * Determine the appropriate additive constant for the current iteration
       */
      function sha1_kt(t) {
        return t < 20
          ? 1518500249
          : t < 40
          ? 1859775393
          : t < 60
          ? -1894007588
          : -899497514;
      }

      /*
       * Calculate the HMAC-SHA1 of a key and some data
       */
      function core_hmac_sha1(key, data) {
        var bkey = str2binb(key);
        if (bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

        var ipad = Array(16),
          opad = Array(16);
        for (var i = 0; i < 16; i++) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5c5c5c5c;
        }

        var hash = core_sha1(
          ipad.concat(str2binb(data)),
          512 + data.length * chrsz
        );
        return core_sha1(opad.concat(hash), 512 + 160);
      }

      /*
       * Add integers, wrapping at 2^32. This uses 16-bit operations internally
       * to work around bugs in some JS interpreters.
       */
      function safe_add(x, y) {
        var lsw = (x & 0xffff) + (y & 0xffff);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xffff);
      }

      /*
       * Bitwise rotate a 32-bit number to the left.
       */
      function rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
      }

      /*
       * Convert an 8-bit or 16-bit string to an array of big-endian words
       * In 8-bit function, characters >255 have their hi-byte silently ignored.
       */
      function str2binb(str) {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for (var i = 0; i < str.length * chrsz; i += chrsz)
          bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
        return bin;
      }

      /*
       * Convert an array of big-endian words to a string
       */
      function binb2str(bin) {
        var str = "";
        var mask = (1 << chrsz) - 1;
        for (var i = 0; i < bin.length * 32; i += chrsz)
          str += String.fromCharCode((bin[i >> 5] >>> (24 - (i % 32))) & mask);
        return str;
      }

      /*
       * Convert an array of big-endian words to a hex string.
       */
      function binb2hex(binarray) {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i++) {
          str +=
            hex_tab.charAt(
              (binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf
            ) + hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
        }
        return str;
      }

      /*
       * Convert an array of big-endian words to a base-64 string
       */
      function binb2b64(binarray) {
        var tab =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var str = "";
        for (var i = 0; i < binarray.length * 4; i += 3) {
          var triplet =
            (((binarray[i >> 2] >> (8 * (3 - (i % 4)))) & 0xff) << 16) |
            (((binarray[(i + 1) >> 2] >> (8 * (3 - ((i + 1) % 4)))) & 0xff) <<
              8) |
            ((binarray[(i + 2) >> 2] >> (8 * (3 - ((i + 2) % 4)))) & 0xff);
          for (var j = 0; j < 4; j++) {
            if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
            else str += tab.charAt((triplet >> (6 * (3 - j))) & 0x3f);
          }
        }
        return str;
      }
      return b64_sha1(str);
    },
    getCrypt() {
      function init() {
        function dP(pw, salt) {
          var pw_salt = this.crypt(salt, pw);
          return pw_salt[0]; // L'élément 1 est le salt utilisé (que la fonction cript() limite à 2 caractères).
        }

        function bTU(b) {
          var value = Math.floor(b);
          return value >= 0 ? value : value + 256;
        }
        function fBTI(b, offset) {
          var value = this.byteToUnsigned(b[offset++]);
          value |= this.byteToUnsigned(b[offset++]) << 8;
          value |= this.byteToUnsigned(b[offset++]) << 16;
          value |= this.byteToUnsigned(b[offset++]) << 24;
          return value;
        }
        function iTFB(iValue, b, offset) {
          b[offset++] = iValue & 0xff;
          b[offset++] = (iValue >>> 8) & 0xff;
          b[offset++] = (iValue >>> 16) & 0xff;
          b[offset++] = (iValue >>> 24) & 0xff;
        }
        function P_P(a, b, n, m, results) {
          var t = ((a >>> n) ^ b) & m;
          a ^= t << n;
          b ^= t;
          results[0] = a;
          results[1] = b;
        }
        function H_P(a, n, m) {
          var t = ((a << (16 - n)) ^ a) & m;
          a = a ^ t ^ (t >>> (16 - n));
          return a;
        }
        function d_s_k(key) {
          var schedule = new Array(
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          );
          var c = this.fourBytesToInt(key, 0);
          var d = this.fourBytesToInt(key, 4);
          var results = new Array(0, 0);
          this.PERM_OP(d, c, 4, 0x0f0f0f0f, results);
          d = results[0];
          c = results[1];
          c = this.HPERM_OP(c, -2, 0xcccc0000);
          d = this.HPERM_OP(d, -2, 0xcccc0000);
          this.PERM_OP(d, c, 1, 0x55555555, results);
          d = results[0];
          c = results[1];
          this.PERM_OP(c, d, 8, 0x00ff00ff, results);
          c = results[0];
          d = results[1];
          this.PERM_OP(d, c, 1, 0x55555555, results);
          d = results[0];
          c = results[1];
          d =
            ((d & 0x000000ff) << 16) |
            (d & 0x0000ff00) |
            ((d & 0x00ff0000) >>> 16) |
            ((c & 0xf0000000) >>> 4);
          c &= 0x0fffffff;
          var s = 0;
          var t = 0;
          var j = 0;
          for (var i = 0; i < this.ITERATIONS; i++) {
            if (this.shifts2[i]) {
              c = (c >>> 2) | (c << 26);
              d = (d >>> 2) | (d << 26);
            } else {
              c = (c >>> 1) | (c << 27);
              d = (d >>> 1) | (d << 27);
            }
            c &= 0x0fffffff;
            d &= 0x0fffffff;
            s =
              this.skb[0][c & 0x3f] |
              this.skb[1][((c >>> 6) & 0x03) | ((c >>> 7) & 0x3c)] |
              this.skb[2][((c >>> 13) & 0x0f) | ((c >>> 14) & 0x30)] |
              this.skb[3][
                ((c >>> 20) & 0x01) | ((c >>> 21) & 0x06) | ((c >>> 22) & 0x38)
              ];
            t =
              this.skb[4][d & 0x3f] |
              this.skb[5][((d >>> 7) & 0x03) | ((d >>> 8) & 0x3c)] |
              this.skb[6][(d >>> 15) & 0x3f] |
              this.skb[7][((d >>> 21) & 0x0f) | ((d >>> 22) & 0x30)];
            schedule[j++] = ((t << 16) | (s & 0x0000ffff)) & 0xffffffff;
            s = (s >>> 16) | (t & 0xffff0000);
            s = (s << 4) | (s >>> 28);
            schedule[j++] = s & 0xffffffff;
          }
          return schedule;
        }
        function D_E(L, R, S, E0, E1, s) {
          var v = R ^ (R >>> 16);
          var u = v & E0;
          v = v & E1;
          u = u ^ (u << 16) ^ R ^ s[S];
          var t = v ^ (v << 16) ^ R ^ s[S + 1];
          t = (t >>> 4) | (t << 28);
          L ^=
            this.SPtrans[1][t & 0x3f] |
            this.SPtrans[3][(t >>> 8) & 0x3f] |
            this.SPtrans[5][(t >>> 16) & 0x3f] |
            this.SPtrans[7][(t >>> 24) & 0x3f] |
            this.SPtrans[0][u & 0x3f] |
            this.SPtrans[2][(u >>> 8) & 0x3f] |
            this.SPtrans[4][(u >>> 16) & 0x3f] |
            this.SPtrans[6][(u >>> 24) & 0x3f];
          return L;
        }
        function bdy(schedule, Eswap0, Eswap1) {
          var left = 0;
          var right = 0;
          var t = 0;
          for (var j = 0; j < 25; j++) {
            for (var i = 0; i < this.ITERATIONS * 2; i += 4) {
              left = this.D_ENCRYPT(left, right, i, Eswap0, Eswap1, schedule);
              right = this.D_ENCRYPT(
                right,
                left,
                i + 2,
                Eswap0,
                Eswap1,
                schedule
              );
            }
            t = left;
            left = right;
            right = t;
          }
          t = right;
          right = (left >>> 1) | (left << 31);
          left = (t >>> 1) | (t << 31);
          left &= 0xffffffff;
          right &= 0xffffffff;
          var results = new Array(0, 0);
          this.PERM_OP(right, left, 1, 0x55555555, results);
          right = results[0];
          left = results[1];
          this.PERM_OP(left, right, 8, 0x00ff00ff, results);
          left = results[0];
          right = results[1];
          this.PERM_OP(right, left, 2, 0x33333333, results);
          right = results[0];
          left = results[1];
          this.PERM_OP(left, right, 16, 0x0000ffff, results);
          left = results[0];
          right = results[1];
          this.PERM_OP(right, left, 4, 0x0f0f0f0f, results);
          right = results[0];
          left = results[1];
          var out = new Array(0, 0);
          out[0] = left;
          out[1] = right;
          return out;
        }
        function rC() {
          return this.GOODCHARS[Math.floor(64 * Math.random())];
        }
        function cript(salt, original) {
          if (salt.length >= 2) salt = salt.substring(0, 2);
          while (salt.length < 2) salt += this.randChar();
          var re = new RegExp("[^./a-zA-Z0-9]", "g");
          if (re.test(salt)) salt = this.randChar() + this.randChar();
          var charZero = salt.charAt(0) + "";
          var charOne = salt.charAt(1) + "";
          var ccZ = charZero.charCodeAt(0);
          var ccO = charOne.charCodeAt(0);
          var buffer = charZero + charOne + "       ";
          var Eswap0 = this.con_salt[ccZ];
          var Eswap1 = this.con_salt[ccO] << 4;
          var key = new Array(0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0);
          for (var i = 0; i < key.length && i < original.length; i++) {
            var iChar = original.charCodeAt(i);
            key[i] = iChar << 1;
          }
          var schedule = this.des_set_key(key);
          var out = this.body(schedule, Eswap0, Eswap1);
          var b = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
          this.intToFourBytes(out[0], b, 0);
          this.intToFourBytes(out[1], b, 4);
          b[8] = 0;
          for (var i = 2, y = 0, u = 0x80; i < 13; i++) {
            for (var j = 0, c = 0; j < 6; j++) {
              c <<= 1;
              if ((b[y] & u) != 0) c |= 1;
              u >>>= 1;
              if (u == 0) {
                y++;
                u = 0x80;
              }
              buffer =
                buffer.substring(0, i) +
                String.fromCharCode(this.cov_2char[c]) +
                buffer.substring(i + 1, buffer.length);
            }
          }
          var ret = new Array(buffer, salt);
          return ret;
        }

        function Crypt() {
          this.ITERATIONS = 16;
          this.GOODCHARS = new Array(
            ".",
            "/",
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "T",
            "U",
            "V",
            "W",
            "X",
            "Y",
            "Z",
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q",
            "r",
            "s",
            "t",
            "u",
            "v",
            "w",
            "x",
            "y",
            "z"
          );
          this.con_salt = new Array(
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x01,
            0x02,
            0x03,
            0x04,
            0x05,
            0x06,
            0x07,
            0x08,
            0x09,
            0x0a,
            0x0b,
            0x05,
            0x06,
            0x07,
            0x08,
            0x09,
            0x0a,
            0x0b,
            0x0c,
            0x0d,
            0x0e,
            0x0f,
            0x10,
            0x11,
            0x12,
            0x13,
            0x14,
            0x15,
            0x16,
            0x17,
            0x18,
            0x19,
            0x1a,
            0x1b,
            0x1c,
            0x1d,
            0x1e,
            0x1f,
            0x20,
            0x21,
            0x22,
            0x23,
            0x24,
            0x25,
            0x20,
            0x21,
            0x22,
            0x23,
            0x24,
            0x25,
            0x26,
            0x27,
            0x28,
            0x29,
            0x2a,
            0x2b,
            0x2c,
            0x2d,
            0x2e,
            0x2f,
            0x30,
            0x31,
            0x32,
            0x33,
            0x34,
            0x35,
            0x36,
            0x37,
            0x38,
            0x39,
            0x3a,
            0x3b,
            0x3c,
            0x3d,
            0x3e,
            0x3f,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00
          );
          this.shifts2 = new Array(
            false,
            false,
            true,
            true,
            true,
            true,
            true,
            true,
            false,
            true,
            true,
            true,
            true,
            true,
            true,
            false
          );
          this.skb = new Array(0, 0, 0, 0, 0, 0, 0, 0);
          this.skb[0] = new Array(
            0x00000000,
            0x00000010,
            0x20000000,
            0x20000010,
            0x00010000,
            0x00010010,
            0x20010000,
            0x20010010,
            0x00000800,
            0x00000810,
            0x20000800,
            0x20000810,
            0x00010800,
            0x00010810,
            0x20010800,
            0x20010810,
            0x00000020,
            0x00000030,
            0x20000020,
            0x20000030,
            0x00010020,
            0x00010030,
            0x20010020,
            0x20010030,
            0x00000820,
            0x00000830,
            0x20000820,
            0x20000830,
            0x00010820,
            0x00010830,
            0x20010820,
            0x20010830,
            0x00080000,
            0x00080010,
            0x20080000,
            0x20080010,
            0x00090000,
            0x00090010,
            0x20090000,
            0x20090010,
            0x00080800,
            0x00080810,
            0x20080800,
            0x20080810,
            0x00090800,
            0x00090810,
            0x20090800,
            0x20090810,
            0x00080020,
            0x00080030,
            0x20080020,
            0x20080030,
            0x00090020,
            0x00090030,
            0x20090020,
            0x20090030,
            0x00080820,
            0x00080830,
            0x20080820,
            0x20080830,
            0x00090820,
            0x00090830,
            0x20090820,
            0x20090830
          );
          this.skb[1] = new Array(
            0x00000000,
            0x02000000,
            0x00002000,
            0x02002000,
            0x00200000,
            0x02200000,
            0x00202000,
            0x02202000,
            0x00000004,
            0x02000004,
            0x00002004,
            0x02002004,
            0x00200004,
            0x02200004,
            0x00202004,
            0x02202004,
            0x00000400,
            0x02000400,
            0x00002400,
            0x02002400,
            0x00200400,
            0x02200400,
            0x00202400,
            0x02202400,
            0x00000404,
            0x02000404,
            0x00002404,
            0x02002404,
            0x00200404,
            0x02200404,
            0x00202404,
            0x02202404,
            0x10000000,
            0x12000000,
            0x10002000,
            0x12002000,
            0x10200000,
            0x12200000,
            0x10202000,
            0x12202000,
            0x10000004,
            0x12000004,
            0x10002004,
            0x12002004,
            0x10200004,
            0x12200004,
            0x10202004,
            0x12202004,
            0x10000400,
            0x12000400,
            0x10002400,
            0x12002400,
            0x10200400,
            0x12200400,
            0x10202400,
            0x12202400,
            0x10000404,
            0x12000404,
            0x10002404,
            0x12002404,
            0x10200404,
            0x12200404,
            0x10202404,
            0x12202404
          );
          this.skb[2] = new Array(
            0x00000000,
            0x00000001,
            0x00040000,
            0x00040001,
            0x01000000,
            0x01000001,
            0x01040000,
            0x01040001,
            0x00000002,
            0x00000003,
            0x00040002,
            0x00040003,
            0x01000002,
            0x01000003,
            0x01040002,
            0x01040003,
            0x00000200,
            0x00000201,
            0x00040200,
            0x00040201,
            0x01000200,
            0x01000201,
            0x01040200,
            0x01040201,
            0x00000202,
            0x00000203,
            0x00040202,
            0x00040203,
            0x01000202,
            0x01000203,
            0x01040202,
            0x01040203,
            0x08000000,
            0x08000001,
            0x08040000,
            0x08040001,
            0x09000000,
            0x09000001,
            0x09040000,
            0x09040001,
            0x08000002,
            0x08000003,
            0x08040002,
            0x08040003,
            0x09000002,
            0x09000003,
            0x09040002,
            0x09040003,
            0x08000200,
            0x08000201,
            0x08040200,
            0x08040201,
            0x09000200,
            0x09000201,
            0x09040200,
            0x09040201,
            0x08000202,
            0x08000203,
            0x08040202,
            0x08040203,
            0x09000202,
            0x09000203,
            0x09040202,
            0x09040203
          );
          this.skb[3] = new Array(
            0x00000000,
            0x00100000,
            0x00000100,
            0x00100100,
            0x00000008,
            0x00100008,
            0x00000108,
            0x00100108,
            0x00001000,
            0x00101000,
            0x00001100,
            0x00101100,
            0x00001008,
            0x00101008,
            0x00001108,
            0x00101108,
            0x04000000,
            0x04100000,
            0x04000100,
            0x04100100,
            0x04000008,
            0x04100008,
            0x04000108,
            0x04100108,
            0x04001000,
            0x04101000,
            0x04001100,
            0x04101100,
            0x04001008,
            0x04101008,
            0x04001108,
            0x04101108,
            0x00020000,
            0x00120000,
            0x00020100,
            0x00120100,
            0x00020008,
            0x00120008,
            0x00020108,
            0x00120108,
            0x00021000,
            0x00121000,
            0x00021100,
            0x00121100,
            0x00021008,
            0x00121008,
            0x00021108,
            0x00121108,
            0x04020000,
            0x04120000,
            0x04020100,
            0x04120100,
            0x04020008,
            0x04120008,
            0x04020108,
            0x04120108,
            0x04021000,
            0x04121000,
            0x04021100,
            0x04121100,
            0x04021008,
            0x04121008,
            0x04021108,
            0x04121108
          );
          this.skb[4] = new Array(
            0x00000000,
            0x10000000,
            0x00010000,
            0x10010000,
            0x00000004,
            0x10000004,
            0x00010004,
            0x10010004,
            0x20000000,
            0x30000000,
            0x20010000,
            0x30010000,
            0x20000004,
            0x30000004,
            0x20010004,
            0x30010004,
            0x00100000,
            0x10100000,
            0x00110000,
            0x10110000,
            0x00100004,
            0x10100004,
            0x00110004,
            0x10110004,
            0x20100000,
            0x30100000,
            0x20110000,
            0x30110000,
            0x20100004,
            0x30100004,
            0x20110004,
            0x30110004,
            0x00001000,
            0x10001000,
            0x00011000,
            0x10011000,
            0x00001004,
            0x10001004,
            0x00011004,
            0x10011004,
            0x20001000,
            0x30001000,
            0x20011000,
            0x30011000,
            0x20001004,
            0x30001004,
            0x20011004,
            0x30011004,
            0x00101000,
            0x10101000,
            0x00111000,
            0x10111000,
            0x00101004,
            0x10101004,
            0x00111004,
            0x10111004,
            0x20101000,
            0x30101000,
            0x20111000,
            0x30111000,
            0x20101004,
            0x30101004,
            0x20111004,
            0x30111004
          );
          this.skb[5] = new Array(
            0x00000000,
            0x08000000,
            0x00000008,
            0x08000008,
            0x00000400,
            0x08000400,
            0x00000408,
            0x08000408,
            0x00020000,
            0x08020000,
            0x00020008,
            0x08020008,
            0x00020400,
            0x08020400,
            0x00020408,
            0x08020408,
            0x00000001,
            0x08000001,
            0x00000009,
            0x08000009,
            0x00000401,
            0x08000401,
            0x00000409,
            0x08000409,
            0x00020001,
            0x08020001,
            0x00020009,
            0x08020009,
            0x00020401,
            0x08020401,
            0x00020409,
            0x08020409,
            0x02000000,
            0x0a000000,
            0x02000008,
            0x0a000008,
            0x02000400,
            0x0a000400,
            0x02000408,
            0x0a000408,
            0x02020000,
            0x0a020000,
            0x02020008,
            0x0a020008,
            0x02020400,
            0x0a020400,
            0x02020408,
            0x0a020408,
            0x02000001,
            0x0a000001,
            0x02000009,
            0x0a000009,
            0x02000401,
            0x0a000401,
            0x02000409,
            0x0a000409,
            0x02020001,
            0x0a020001,
            0x02020009,
            0x0a020009,
            0x02020401,
            0x0a020401,
            0x02020409,
            0x0a020409
          );
          this.skb[6] = new Array(
            0x00000000,
            0x00000100,
            0x00080000,
            0x00080100,
            0x01000000,
            0x01000100,
            0x01080000,
            0x01080100,
            0x00000010,
            0x00000110,
            0x00080010,
            0x00080110,
            0x01000010,
            0x01000110,
            0x01080010,
            0x01080110,
            0x00200000,
            0x00200100,
            0x00280000,
            0x00280100,
            0x01200000,
            0x01200100,
            0x01280000,
            0x01280100,
            0x00200010,
            0x00200110,
            0x00280010,
            0x00280110,
            0x01200010,
            0x01200110,
            0x01280010,
            0x01280110,
            0x00000200,
            0x00000300,
            0x00080200,
            0x00080300,
            0x01000200,
            0x01000300,
            0x01080200,
            0x01080300,
            0x00000210,
            0x00000310,
            0x00080210,
            0x00080310,
            0x01000210,
            0x01000310,
            0x01080210,
            0x01080310,
            0x00200200,
            0x00200300,
            0x00280200,
            0x00280300,
            0x01200200,
            0x01200300,
            0x01280200,
            0x01280300,
            0x00200210,
            0x00200310,
            0x00280210,
            0x00280310,
            0x01200210,
            0x01200310,
            0x01280210,
            0x01280310
          );
          this.skb[7] = new Array(
            0x00000000,
            0x04000000,
            0x00040000,
            0x04040000,
            0x00000002,
            0x04000002,
            0x00040002,
            0x04040002,
            0x00002000,
            0x04002000,
            0x00042000,
            0x04042000,
            0x00002002,
            0x04002002,
            0x00042002,
            0x04042002,
            0x00000020,
            0x04000020,
            0x00040020,
            0x04040020,
            0x00000022,
            0x04000022,
            0x00040022,
            0x04040022,
            0x00002020,
            0x04002020,
            0x00042020,
            0x04042020,
            0x00002022,
            0x04002022,
            0x00042022,
            0x04042022,
            0x00000800,
            0x04000800,
            0x00040800,
            0x04040800,
            0x00000802,
            0x04000802,
            0x00040802,
            0x04040802,
            0x00002800,
            0x04002800,
            0x00042800,
            0x04042800,
            0x00002802,
            0x04002802,
            0x00042802,
            0x04042802,
            0x00000820,
            0x04000820,
            0x00040820,
            0x04040820,
            0x00000822,
            0x04000822,
            0x00040822,
            0x04040822,
            0x00002820,
            0x04002820,
            0x00042820,
            0x04042820,
            0x00002822,
            0x04002822,
            0x00042822,
            0x04042822
          );
          this.SPtrans = new Array(0, 0, 0, 0, 0, 0, 0, 0);
          this.SPtrans[0] = new Array(
            0x00820200,
            0x00020000,
            0x80800000,
            0x80820200,
            0x00800000,
            0x80020200,
            0x80020000,
            0x80800000,
            0x80020200,
            0x00820200,
            0x00820000,
            0x80000200,
            0x80800200,
            0x00800000,
            0x00000000,
            0x80020000,
            0x00020000,
            0x80000000,
            0x00800200,
            0x00020200,
            0x80820200,
            0x00820000,
            0x80000200,
            0x00800200,
            0x80000000,
            0x00000200,
            0x00020200,
            0x80820000,
            0x00000200,
            0x80800200,
            0x80820000,
            0x00000000,
            0x00000000,
            0x80820200,
            0x00800200,
            0x80020000,
            0x00820200,
            0x00020000,
            0x80000200,
            0x00800200,
            0x80820000,
            0x00000200,
            0x00020200,
            0x80800000,
            0x80020200,
            0x80000000,
            0x80800000,
            0x00820000,
            0x80820200,
            0x00020200,
            0x00820000,
            0x80800200,
            0x00800000,
            0x80000200,
            0x80020000,
            0x00000000,
            0x00020000,
            0x00800000,
            0x80800200,
            0x00820200,
            0x80000000,
            0x80820000,
            0x00000200,
            0x80020200
          );
          this.SPtrans[1] = new Array(
            0x10042004,
            0x00000000,
            0x00042000,
            0x10040000,
            0x10000004,
            0x00002004,
            0x10002000,
            0x00042000,
            0x00002000,
            0x10040004,
            0x00000004,
            0x10002000,
            0x00040004,
            0x10042000,
            0x10040000,
            0x00000004,
            0x00040000,
            0x10002004,
            0x10040004,
            0x00002000,
            0x00042004,
            0x10000000,
            0x00000000,
            0x00040004,
            0x10002004,
            0x00042004,
            0x10042000,
            0x10000004,
            0x10000000,
            0x00040000,
            0x00002004,
            0x10042004,
            0x00040004,
            0x10042000,
            0x10002000,
            0x00042004,
            0x10042004,
            0x00040004,
            0x10000004,
            0x00000000,
            0x10000000,
            0x00002004,
            0x00040000,
            0x10040004,
            0x00002000,
            0x10000000,
            0x00042004,
            0x10002004,
            0x10042000,
            0x00002000,
            0x00000000,
            0x10000004,
            0x00000004,
            0x10042004,
            0x00042000,
            0x10040000,
            0x10040004,
            0x00040000,
            0x00002004,
            0x10002000,
            0x10002004,
            0x00000004,
            0x10040000,
            0x00042000
          );
          this.SPtrans[2] = new Array(
            0x41000000,
            0x01010040,
            0x00000040,
            0x41000040,
            0x40010000,
            0x01000000,
            0x41000040,
            0x00010040,
            0x01000040,
            0x00010000,
            0x01010000,
            0x40000000,
            0x41010040,
            0x40000040,
            0x40000000,
            0x41010000,
            0x00000000,
            0x40010000,
            0x01010040,
            0x00000040,
            0x40000040,
            0x41010040,
            0x00010000,
            0x41000000,
            0x41010000,
            0x01000040,
            0x40010040,
            0x01010000,
            0x00010040,
            0x00000000,
            0x01000000,
            0x40010040,
            0x01010040,
            0x00000040,
            0x40000000,
            0x00010000,
            0x40000040,
            0x40010000,
            0x01010000,
            0x41000040,
            0x00000000,
            0x01010040,
            0x00010040,
            0x41010000,
            0x40010000,
            0x01000000,
            0x41010040,
            0x40000000,
            0x40010040,
            0x41000000,
            0x01000000,
            0x41010040,
            0x00010000,
            0x01000040,
            0x41000040,
            0x00010040,
            0x01000040,
            0x00000000,
            0x41010000,
            0x40000040,
            0x41000000,
            0x40010040,
            0x00000040,
            0x01010000
          );
          this.SPtrans[3] = new Array(
            0x00100402,
            0x04000400,
            0x00000002,
            0x04100402,
            0x00000000,
            0x04100000,
            0x04000402,
            0x00100002,
            0x04100400,
            0x04000002,
            0x04000000,
            0x00000402,
            0x04000002,
            0x00100402,
            0x00100000,
            0x04000000,
            0x04100002,
            0x00100400,
            0x00000400,
            0x00000002,
            0x00100400,
            0x04000402,
            0x04100000,
            0x00000400,
            0x00000402,
            0x00000000,
            0x00100002,
            0x04100400,
            0x04000400,
            0x04100002,
            0x04100402,
            0x00100000,
            0x04100002,
            0x00000402,
            0x00100000,
            0x04000002,
            0x00100400,
            0x04000400,
            0x00000002,
            0x04100000,
            0x04000402,
            0x00000000,
            0x00000400,
            0x00100002,
            0x00000000,
            0x04100002,
            0x04100400,
            0x00000400,
            0x04000000,
            0x04100402,
            0x00100402,
            0x00100000,
            0x04100402,
            0x00000002,
            0x04000400,
            0x00100402,
            0x00100002,
            0x00100400,
            0x04100000,
            0x04000402,
            0x00000402,
            0x04000000,
            0x04000002,
            0x04100400
          );
          this.SPtrans[4] = new Array(
            0x02000000,
            0x00004000,
            0x00000100,
            0x02004108,
            0x02004008,
            0x02000100,
            0x00004108,
            0x02004000,
            0x00004000,
            0x00000008,
            0x02000008,
            0x00004100,
            0x02000108,
            0x02004008,
            0x02004100,
            0x00000000,
            0x00004100,
            0x02000000,
            0x00004008,
            0x00000108,
            0x02000100,
            0x00004108,
            0x00000000,
            0x02000008,
            0x00000008,
            0x02000108,
            0x02004108,
            0x00004008,
            0x02004000,
            0x00000100,
            0x00000108,
            0x02004100,
            0x02004100,
            0x02000108,
            0x00004008,
            0x02004000,
            0x00004000,
            0x00000008,
            0x02000008,
            0x02000100,
            0x02000000,
            0x00004100,
            0x02004108,
            0x00000000,
            0x00004108,
            0x02000000,
            0x00000100,
            0x00004008,
            0x02000108,
            0x00000100,
            0x00000000,
            0x02004108,
            0x02004008,
            0x02004100,
            0x00000108,
            0x00004000,
            0x00004100,
            0x02004008,
            0x02000100,
            0x00000108,
            0x00000008,
            0x00004108,
            0x02004000,
            0x02000008
          );

          this.SPtrans[5] = new Array(
            0x20000010,
            0x00080010,
            0x00000000,
            0x20080800,
            0x00080010,
            0x00000800,
            0x20000810,
            0x00080000,
            0x00000810,
            0x20080810,
            0x00080800,
            0x20000000,
            0x20000800,
            0x20000010,
            0x20080000,
            0x00080810,
            0x00080000,
            0x20000810,
            0x20080010,
            0x00000000,
            0x00000800,
            0x00000010,
            0x20080800,
            0x20080010,
            0x20080810,
            0x20080000,
            0x20000000,
            0x00000810,
            0x00000010,
            0x00080800,
            0x00080810,
            0x20000800,
            0x00000810,
            0x20000000,
            0x20000800,
            0x00080810,
            0x20080800,
            0x00080010,
            0x00000000,
            0x20000800,
            0x20000000,
            0x00000800,
            0x20080010,
            0x00080000,
            0x00080010,
            0x20080810,
            0x00080800,
            0x00000010,
            0x20080810,
            0x00080800,
            0x00080000,
            0x20000810,
            0x20000010,
            0x20080000,
            0x00080810,
            0x00000000,
            0x00000800,
            0x20000010,
            0x20000810,
            0x20080800,
            0x20080000,
            0x00000810,
            0x00000010,
            0x20080010
          );
          this.SPtrans[6] = new Array(
            0x00001000,
            0x00000080,
            0x00400080,
            0x00400001,
            0x00401081,
            0x00001001,
            0x00001080,
            0x00000000,
            0x00400000,
            0x00400081,
            0x00000081,
            0x00401000,
            0x00000001,
            0x00401080,
            0x00401000,
            0x00000081,
            0x00400081,
            0x00001000,
            0x00001001,
            0x00401081,
            0x00000000,
            0x00400080,
            0x00400001,
            0x00001080,
            0x00401001,
            0x00001081,
            0x00401080,
            0x00000001,
            0x00001081,
            0x00401001,
            0x00000080,
            0x00400000,
            0x00001081,
            0x00401000,
            0x00401001,
            0x00000081,
            0x00001000,
            0x00000080,
            0x00400000,
            0x00401001,
            0x00400081,
            0x00001081,
            0x00001080,
            0x00000000,
            0x00000080,
            0x00400001,
            0x00000001,
            0x00400080,
            0x00000000,
            0x00400081,
            0x00400080,
            0x00001080,
            0x00000081,
            0x00001000,
            0x00401081,
            0x00400000,
            0x00401080,
            0x00000001,
            0x00001001,
            0x00401081,
            0x00400001,
            0x00401080,
            0x00401000,
            0x00001001
          );
          this.SPtrans[7] = new Array(
            0x08200020,
            0x08208000,
            0x00008020,
            0x00000000,
            0x08008000,
            0x00200020,
            0x08200000,
            0x08208020,
            0x00000020,
            0x08000000,
            0x00208000,
            0x00008020,
            0x00208020,
            0x08008020,
            0x08000020,
            0x08200000,
            0x00008000,
            0x00208020,
            0x00200020,
            0x08008000,
            0x08208020,
            0x08000020,
            0x00000000,
            0x00208000,
            0x08000000,
            0x00200000,
            0x08008020,
            0x08200020,
            0x00200000,
            0x00008000,
            0x08208000,
            0x00000020,
            0x00200000,
            0x00008000,
            0x08000020,
            0x08208020,
            0x00008020,
            0x08000000,
            0x00000000,
            0x00208000,
            0x08200020,
            0x08008020,
            0x08008000,
            0x00200020,
            0x08208000,
            0x00000020,
            0x00200020,
            0x08008000,
            0x08208020,
            0x00200000,
            0x08200000,
            0x08000020,
            0x00208000,
            0x00008020,
            0x08008020,
            0x08200000,
            0x00000020,
            0x08208000,
            0x00208020,
            0x00000000,
            0x08000000,
            0x08200020,
            0x00008000,
            0x00208020
          );
          this.cov_2char = new Array(
            0x2e,
            0x2f,
            0x30,
            0x31,
            0x32,
            0x33,
            0x34,
            0x35,
            0x36,
            0x37,
            0x38,
            0x39,
            0x41,
            0x42,
            0x43,
            0x44,
            0x45,
            0x46,
            0x47,
            0x48,
            0x49,
            0x4a,
            0x4b,
            0x4c,
            0x4d,
            0x4e,
            0x4f,
            0x50,
            0x51,
            0x52,
            0x53,
            0x54,
            0x55,
            0x56,
            0x57,
            0x58,
            0x59,
            0x5a,
            0x61,
            0x62,
            0x63,
            0x64,
            0x65,
            0x66,
            0x67,
            0x68,
            0x69,
            0x6a,
            0x6b,
            0x6c,
            0x6d,
            0x6e,
            0x6f,
            0x70,
            0x71,
            0x72,
            0x73,
            0x74,
            0x75,
            0x76,
            0x77,
            0x78,
            0x79,
            0x7a
          );
          this.byteToUnsigned = bTU;
          this.fourBytesToInt = fBTI;
          this.intToFourBytes = iTFB;
          this.PERM_OP = P_P;
          this.HPERM_OP = H_P;
          this.des_set_key = d_s_k;
          this.D_ENCRYPT = D_E;
          this.body = bdy;
          this.randChar = rC;
          this.crypt = cript;
          this.displayPassword = dP;
        }
        return new Crypt();
      }
      return init();
    }
  }
};
</script>