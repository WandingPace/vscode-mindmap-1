/**
 * initial kityminder-editor
 */

// GitHub 图床：自定义确认/提示框（webview 原生 confirm/alert 不可用）
window._ghConfirm = function (msg, onYes) {
	var mask = document.createElement("div");
	mask.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;";
	var box = document.createElement("div");
	box.style.cssText = "background:#fff;color:#333;padding:20px 24px;border-radius:8px;max-width:380px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:13px;line-height:1.6;";
	var t = document.createElement("div"); t.textContent = msg; t.style.cssText = "margin-bottom:16px;";
	var bs = document.createElement("div"); bs.style.cssText = "text-align:right;";
	var no = document.createElement("button"); no.textContent = "不删"; no.style.cssText = "padding:5px 14px;background:#6c757d;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-right:8px;";
	var yes = document.createElement("button"); yes.textContent = "删除远端"; yes.style.cssText = "padding:5px 14px;background:#d9534f;color:#fff;border:none;border-radius:4px;cursor:pointer;";
	bs.appendChild(no); bs.appendChild(yes); box.appendChild(t); box.appendChild(bs); mask.appendChild(box); document.body.appendChild(mask);
	function close() { if (mask.parentNode) document.body.removeChild(mask); }
	yes.onclick = function () { close(); onYes && onYes(); };
	no.onclick = close;
	mask.onclick = function (e) { if (e.target === mask) close(); };
};
window._ghAlert = function (msg) {
	var mask = document.createElement("div");
	mask.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;";
	var box = document.createElement("div");
	box.style.cssText = "background:#fff;color:#333;padding:20px 24px;border-radius:8px;max-width:380px;box-shadow:0 6px 24px rgba(0,0,0,.3);font-size:13px;line-height:1.6;";
	var t = document.createElement("div"); t.textContent = msg; t.style.cssText = "margin-bottom:16px;word-break:break-all;";
	var bs = document.createElement("div"); bs.style.cssText = "text-align:right;";
	var ok = document.createElement("button"); ok.textContent = "确定"; ok.style.cssText = "padding:5px 14px;background:#337ab7;color:#fff;border:none;border-radius:4px;cursor:pointer;";
	bs.appendChild(ok); box.appendChild(t); box.appendChild(bs); mask.appendChild(box); document.body.appendChild(mask);
	ok.onclick = function () { if (mask.parentNode) document.body.removeChild(mask); };
};

angular
	.module("kityminderDemo", ["kityminderEditor"])
	.config(function (configProvider) {
		let state = window.vscode.getState();
		if (state.lang) {
			configProvider.set("lang", state.lang);
		}
		if (state.upload_url) {
			configProvider.set("imageUpload", state.upload_url);
		}
		if (state.github_token) {
			configProvider.set("githubToken", state.github_token);
		}
		if (state.github_owner) {
			configProvider.set("githubOwner", state.github_owner);
		}
		if (state.github_repo) {
			configProvider.set("githubRepo", state.github_repo);
		}
		if (state.github_branch) {
			configProvider.set("githubBranch", state.github_branch);
		}
		if (state.github_path) {
			configProvider.set("githubPath", state.github_path);
		}
		if (state.github_cdn) {
			configProvider.set("githubCdn", state.github_cdn);
		}
	})
	.controller("MainController", function ($scope) {
		function listenContentChange() {
			if (listenContentChange.listened) return;
			window.minder.on("contentchange", (e) => {
				if (window.fileExtName === ".svg") {
					window.minder.exportData("svg").then((data) => {
						window.vscode.postMessage({
							command: "draft",
							exportData: data,
						});
					});
				} else {
					window.vscode.postMessage({
						command: "draft",
						exportData: JSON.stringify(window.minder.exportJson(), null, 4),
					});
				}
			});
			listenContentChange.listened = true;
		}
		$scope.initEditor = function (editor, minder) {
			window.editor = editor;
			window.minder = minder;

			// 拦截删除节点：若被删节点含 GitHub 图床图片，弹窗询问是否删除远端
			window.minder.on("beforeExecCommand", function (e) {
				if (e.commandName !== "removenode") return;
				var nodes = window.minder.getSelectedNodes();
				var imgs = [];
				nodes.forEach(function (n) {
					if (n.data && n.data.image && /cdn\.jsdelivr\.net\/gh\//.test(n.data.image)) {
						imgs.push(n.data.image);
					}
				});
				if (!imgs.length) return;
				setTimeout(function () {
					window._ghConfirm(
						"删除的节点含 " + imgs.length + " 张 GitHub 图床图片，是否同时删除远端图片？",
						function () {
							var sv = angular.element(document.body).injector().get("server");
							imgs.forEach(function (u) {
								sv.deleteImage(u).then(function (r) {
									window._ghAlert((r.ok ? "已删除" : "删除失败") + ": " + u + (r.ok ? "" : " (" + r.msg + ")"));
								});
							});
						}
					);
				}, 50);
			});

			/**
			 * receive message event from extension
			 */
			window.addEventListener("message", function (event) {
				window.message = event.data;
				const { command, extName } = window.message;
				window.fileExtName = extName;

				switch (command) {
					case "import": {
						let importTask = Promise.resolve();
						try {
							importTask = importTask.then(() => {
								const importData = window.message.importData;
								if (extName === ".svg") {
									return new Promise((resolve) => {
										// 可能出现格式不正确内部抛异常
										window.minder
											.importData("svg", importData)
											.then(resolve, resolve);
									});
								} else {
									// 可能出现格式不正确内部抛异常
									window.minder.importJson(
										JSON.parse(importData || "{}")
									);
								}
							});
						} catch (ex) {
							console.error(ex);
						}
						importTask.then(listenContentChange, listenContentChange);
						break;
					}
				}
			});

			window.addEventListener("keydown", (e) => {
				const keyCode = e.keyCode || e.which || e.charCode;
				const ctrlKey = e.ctrlKey || e.metaKey;
				if (ctrlKey && keyCode === 83) {
					window.vscode.postMessage({
						command: "save",
						exportData: JSON.stringify(window.minder.exportJson(), null, 4),
					});
				}
			});

			window.minder.on("click", (e) => {
				try {
					const link = e.minder.queryCommandValue("HyperLink");
					if (
						link &&
						link.url &&
						e.kityEvent.targetShape.container.getType() === "HyperLink"
					) {
						window.vscode.postMessage({
							command: "clicklink",
							link: link.url,
						});
					}
					// 捕获不到markdown中的链接点击,可能监听window可以做到
				} catch (e) {}
			});

			window.vscode.postMessage({
				command: "loaded",
			});
		};
	});

(function () {
	$(document).on("click", ".nav-tabs a", function (event) {
		event.preventDefault();
	});

	$(document).on("click", ".export", function (event) {
		event.preventDefault();
		var $this = $(this),
			type = $this.data("type"),
			exportType;
		switch (type) {
			case "km":
				exportType = "json";
				break;
			case "xmind":
				exportType = "json";
				break;
			case "md":
				exportType = "markdown";
				break;
			case "svg":
				exportType = "svg";
				break;
			case "txt":
				exportType = "text";
				break;
			case "png":
				exportType = "svg";
				break;
			default:
				exportType = type;
				break;
		}

		editor.minder.exportData(exportType).then(function (content) {
			window.vscode.postMessage({
				command: "export",
				filename: $("#node_text1").text(),
				type: type,
				content,
			});
		});
	});

	// 导入
	$(document).on("click", ".import", function (event) {
		window.vscode.postMessage({
			command: "importFile",
		});
	});

	window.addEventListener("message", function (event) {
		let command = event.data.command;
		let content = event.data.content;
		let basename = event.data.basename;

		if (command == "importNewData") {
			var fileType = "";
			switch (basename) {
				case ".md":
					fileType = "markdown";
					break;
				case ".txt":
					fileType = "text";
					break;
				case ".km":
				case ".json":
					fileType = "json";
					break;
				case ".xmind":
					fileType = "json";
					break;
				default:
					fileType = "";
					break;
			}
			if (typeof content != "string") {
				content = JSON.stringify(content);
			}
			fileType &&
				editor.minder.importData(fileType, content).then(function (data) {
					var fileInput = document.getElementById("fileInput");
					fileInput && $(fileInput).val("");
				});
		}
	});
})();

//base64转换为图片blob
function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(",");
	//注意base64的最后面中括号和引号是不转译的
	var _arr = arr[1].substring(0, arr[1].length - 2);
	var mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(_arr),
		n = bstr.length,
		u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {
		type: mime,
	});
}
