import qrcode from "./llqrcode";

export default webqr()
function webqr() {
	var gCtx = null;
	var gCanvas = null;
	var c = 0;
	var stype = 0;
	var gUM = false;
	var webkit = false;
	var moz = false;
	var v = null;
	var qrCanvas=null;
	var qrResult=null;
	function dragenter(e) {
		e.stopPropagation();
		e.preventDefault()
	}
	function dragover(e) {
		e.stopPropagation();
		e.preventDefault()
	}
	function drop(e) {
		e.stopPropagation();
		e.preventDefault();
		var dt = e.dataTransfer;
		var files = dt.files;
		if (files.length > 0) {
			handleFiles(files)
		} else {
			if (dt.getData("URL")) {
				qrcode.decode(dt.getData("URL"))
			}
		}
	}
	/**
	 *  解析二维码
	 * @param {*} f 
	 */
	function handleFiles(f) {
		var o = [];
		for (var i = 0; i < f.length; i++) {
			var reader = new FileReader();
			reader.onload = (function (theFile) {
				return function (e) {
					gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
					var img = new Image();
					img.onload = function () {
						setTimeout(function () {
							gCtx.drawImage(img, 0, 0, gCanvas.width, gCanvas.height)
						}, 0)
					};
					img.src = e.target.result;
					qrcode.decode(e.target.result)
				}
			})(f[i]);
			reader.readAsDataURL(f[i])
		}
	}
	function initCanvas(w, h) {
		gCanvas = document.getElementById(qrCanvas);
		gCanvas.style.width = w + "px";
		gCanvas.style.height = h + "px";
		gCanvas.width = w;
		gCanvas.height = h;
		gCtx = gCanvas.getContext("2d");
		gCtx.clearRect(0, 0, w, h)
	}
	function captureToCanvas() {
		if (stype != 1) {
			return
		}
		if (gUM) {
			try {
				gCtx.drawImage(v, 0, 0);
				try {
					qrcode.decode()
				} catch (e) {
					setTimeout(captureToCanvas, 500)
				}
			} catch (e) {
				console.log(e);
				setTimeout(captureToCanvas, 500)
			}
		}
	}
	function htmlEntities(str) {
		return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
	}
	function read(a) {
		var html = "";
		if (a.indexOf("http://") === 0 || a.indexOf("https://") === 0) {
			html += "<a target='_blank' href='" + a + "'>" + a + "</a><br>"
		}
		else {
			html += "<bdi>" + htmlEntities(a) + "</bdi>";
		}
		document.getElementById(qrResult).innerHTML = html
	}
	function isCanvasSupported() {
		var elem = document.createElement("canvas");
		return !!(elem.getContext && elem.getContext("2d"))
	}
	function success(stream) {
		if (webkit) {
			v.src = window.webkitURL.createObjectURL(stream)
		} else {
			if (moz) {
				v.mozSrcObject = stream;
				v.play()
			} else {
				v.src = stream
			}
		}
		gUM = true;
		setTimeout(captureToCanvas, 500)
	}
	function error(error) {
		gUM = false;
		return
	}
	/**
	 * 初始化
	 * @param {String} qrfile 初始化的区域，id值， qrCanvas：canvas的Id，qrResult分析结果区块的ID
	 * @param {*} width canvas宽度
	 * @param {*} heigth canvas高度
	 */
	function load(qrfile,width, heigth) {
		if (isCanvasSupported() && window.File && window.FileReader) {
			initR(qrfile)
			initCanvas(width || 200, heigth || 200);
			qrcode.callback = read;
		} else { }
	}
	function initR(qr) {
		var qrfile = document.getElementById(qr);
		qrCanvas=qrfile.getAttribute('qrCanvas');
		qrResult=qrfile.getAttribute('qrResult');
		qrfile.addEventListener("dragenter", dragenter, false);
		qrfile.addEventListener("dragover", dragover, false);
		qrfile.addEventListener("drop", drop, false)
	};
	return {
		load,
		handleFiles
	}
}