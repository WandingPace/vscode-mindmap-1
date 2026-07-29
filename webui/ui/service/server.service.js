/**
 * @fileOverview
 *
 *  与后端交互的服务
 *
 * @author: zhangbobell
 * @email : zhangbobell@163.com
 *
 * @copyright: Baidu FEX, 2015
 */
angular.module('kityminderEditor')
    .service('server', ['config', '$http', function (config, $http) {
        return {
            uploadImage: function (file) {
                // GitHub 图床直传配置（从 config 读，由 extension 注入）
                var GH = {
                    owner: config.get('githubOwner'),
                    repo: config.get('githubRepo'),
                    token: config.get('githubToken'),
                    branch: config.get('githubBranch'),
                    path: config.get('githubPath'),
                    cdn: config.get('githubCdn')
                };
                function ghCdnUrl(fp) {
                    return GH.cdn === 'raw'
                        ? 'https://raw.githubusercontent.com/' + GH.owner + '/' + GH.repo + '/' + GH.branch + '/' + fp
                        : 'https://cdn.jsdelivr.net/gh/' + GH.owner + '/' + GH.repo + '@' + GH.branch + '/' + fp;
                }
                return new Promise(function (resolve) {
                    var reader = new FileReader();
                    reader.onload = function () {
                        var buf = new Uint8Array(reader.result);
                        var binary = '';
                        for (var i = 0; i < buf.length; i += 8192) {
                            binary += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
                        }
                        var content = btoa(binary);
                        // 内容 hash（cyrb53）：内容相同→文件名相同→GitHub PUT 触发 422 自动复用，实现内容去重
                        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
                        for (var k = 0; k < binary.length; k++) {
                            var ch = binary.charCodeAt(k);
                            h1 = Math.imul(h1 ^ ch, 2654435761);
                            h2 = Math.imul(h2 ^ ch, 1597334677);
                        }
                        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507); h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
                        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507); h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
                        var shortHash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
                        var baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'image';
                        var ext = (file.name.match(/\.[^.]+$/) || ['.png'])[0].toLowerCase();
                        var filename = shortHash + '_' + baseName + ext;
                        var filePath = GH.path + '/' + filename;
                        var api = 'https://api.github.com/repos/' + GH.owner + '/' + GH.repo + '/contents/' + filePath;
                        $http.put(api, {
                            message: 'Upload image: ' + filename,
                            content: content,
                            branch: GH.branch
                        }, { headers: { 'Authorization': 'token ' + GH.token } }).then(function () {
                            resolve({ data: { errno: 0, msg: 'ok', data: { url: ghCdnUrl(filePath) } } });
                        }, function (err) {
                            if (err.status === 422) {
                                resolve({ data: { errno: 0, msg: 'exists', data: { url: ghCdnUrl(filePath) } } });
                            } else {
                                resolve({ data: { errno: 1, msg: 'github ' + err.status, data: {} } });
                            }
                        });
                    };
                    reader.readAsArrayBuffer(file);
                });
            },
            deleteImage: function (url) {
                var m = url && url.match(/cdn\.jsdelivr\.net\/gh\/([^\/]+)\/([^@]+)@([^\/]+)\/(.+)$/);
                if (!m) return Promise.resolve({ ok: false, msg: 'not jsdelivr url' });
                var owner = m[1], repo = m[2], branch = m[3], filePath = m[4];
                var token = config.get('githubToken');
                if (!token) return Promise.resolve({ ok: false, msg: 'no githubToken config' });
                var api = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + filePath;
                return $http.get(api, { headers: { 'Authorization': 'token ' + token } }).then(function (r) {
                    var sha = r.data.sha;
                    return $http({
                        method: 'DELETE', url: api,
                        headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
                        data: { message: 'Delete image: ' + filePath, sha: sha, branch: branch }
                    }).then(function () { return { ok: true }; }, function (e) { return { ok: false, msg: 'delete ' + e.status }; });
                }, function (e) { return { ok: false, msg: 'get ' + e.status }; });
            }
        }
    }]);


