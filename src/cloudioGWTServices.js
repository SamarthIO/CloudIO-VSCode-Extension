var cloudioServices = require('./cloudioServices');
var vscode = require('vscode');
var path = require('path');
var cs = cloudioServices.getServices();

const bindings = {
    "Html Template": { datasource: "RAHTMLTemplates", selects: ["templateCode", "templateUid"], name: "$HTML_Templates", content: "templateHtml", extension: "html", code: "HT" },
    "Html Request": { datasource: "RAHTMLRequests", selects: ["uri", "requestUid"], name: "$HTML_Requests", content: "script", extension: "java", code: "HR" },
    "Java Snippets": { datasource: "RaJavaSnippets", selects: ["name", "snippetUid"], name: "$Java_Snippets", content: "script", extension: "java", code: "JS" },
    "Datasource Code": { datasource: "RaObjects", selects: ["objectName", "objectUid"], name: "$Datasources", content: ["preQueryScript", "postQueryScript"], extension: "java", code: "DS" }
};

function getBindings() {
    return JSON.parse(JSON.stringify(bindings));
}

var possibleExtensionType = ['js', 'html', 'data', 'json', 'css', 'java', 'ts'];
var metaDataFileName = '.metaData.json';

function getSelection(templates, name, callback) {
    var options = [];
    templates.forEach(function (v) {
        options.push(v[name]);
    });
    vscode.window.showQuickPick(options, {
        placeHolder: "Please select...",
        ignoreFocusOut: true
    }).then(function (selected) {
        var template = templates.filter(function (el) {
            return el[name] === selected;
        });
        callback(template[0]);
    });
}

function getFileName(name, extension) {
    var _a = name.split('.');
    var _b = _a[_a.length - 1];
    if (possibleExtensionType.indexOf(_b) != -1) {
        return name;
    }
    return name + '.' + extension;
}

function getMetaData(filePath, fileName, type) {
    var code = new String(fileName);
    var folder = path.dirname(filePath);
    if (type === 'DS') {
        if (folder.indexOf("Server Side Validations") !== -1) {
            code = path.basename(path.dirname(folder));
            folder = path.dirname(path.dirname(folder));
        } else {
            code = path.basename(folder);
            folder = path.dirname(folder);
        }
    }
    var metaDataFile = path.join(folder, metaDataFileName);
    var content = cs.readFile(metaDataFile);
    if (content && content != null) {
        var data = JSON.parse(content);
        return data[code];
    }
    return null;
}

function updateMetaData(folder, key, value) {
    var data = {};
    var file = path.join(folder, metaDataFileName);
    var content = cs.readFile(file);
    if (content != null) {
        data = JSON.parse(content);
        data[key] = value;
    } else {
        data[key] = value;
    }
    cs.createFile(JSON.stringify(data, null, 4), folder, metaDataFileName);
}

function getServerSideCode(request, projectDetails, callback) {
    cs.cloudioApiCall(projectDetails.url + "RaObjectValidations", request, function (r) {
        if (r.data && r.data.length > 0) {
            callback(r.data);
        } else {
            callback(null);
            cs.showInformationMessage("No server side validations found!");
        }
    });
}
function openFile(folder, fileName) {
    var file = path.join(folder, fileName);
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file));
}
function processData(sessionId, workspace, projectDetails, requestDetails, result) {
    var folder = cs.createFolder(workspace, requestDetails.name);
    if (requestDetails.datasource === "RaObjects") {
        var _folderDS = cs.createFolder(folder, result['objectName']);
        var fileName;
        requestDetails.content.forEach(function (v) {
            if (result[v] && result[v].length > 0) {
                fileName = v + ".java";
                cs.createFile(result[v], _folderDS, fileName);
            }
        });
        if (!fileName) {
            cs.showInformationMessage("No pre-query or post query script found!");
        }
        updateMetaData(folder, result['objectName'], result[requestDetails.key]);
        var obj = { "sessionId": sessionId, "offset": 0, "limit": 200, "whereClause": "#objectUid# = ? AND ACTIVE='Y'", "whereClauseParams": [result.objectUid] };
        getServerSideCode(obj, projectDetails, function (r) {
            if (!r || r == null) {
                if (fileName) {
                    openFile(_folderDS, fileName);
                } else {
                    cs.removeFolder(_folderDS);
                }
            } else {
                _folderDS = cs.createFolder(_folderDS, "Server Side Validations")
                r.forEach(function (v) {
                    fileName = v.name + ".java";
                    cs.createFile(v.script, _folderDS, fileName);
                });
                openFile(_folderDS, fileName);
            }
        });
    } else {
        var fileName = getFileName(result[requestDetails.selects[0]], requestDetails.extension);
        cs.createFile(result[requestDetails.content], folder, fileName);
        updateMetaData(folder, fileName, result[requestDetails.key]);
        openFile(folder, fileName);
    }
}

function getSelectedFileDSRow(filePath, workspace, callback) {
    var projectDetails = cs.getProjectDetails(workspace);
    var fileName = path.basename(filePath);
    var arr = ["Html Template", "Java Snippets", "Html Request", "Datasource Code"];
    var names = ["$HTML_Templates", "$Java_Snippets", "$HTML_Requests", "$Datasources"];
    var details;
    for (var i = 0; i < 4; i++) {
        if (filePath.indexOf(names[i]) !== -1) {
            var b = getBindings();
            details = b[arr[i]];
            break;
        }
    }
    details.uid = getMetaData(filePath, fileName, details.code);
    if (details.uid && details.uid !== null) {
        if (details.code !== 'DS') {
            var requestDetails = {
                datasource: details.datasource,
                key: details.selects[1],
                value: details.uid
            };
            cs.getSessionId(projectDetails.url, projectDetails.username, projectDetails.password, function (sessionId) {
                cs.getGWTSelectedRow(projectDetails.url, sessionId, requestDetails, function (result) {
                    result.sessionId = sessionId;
                    callback(details, projectDetails, result);
                });
            });
        } else {
            if (filePath.indexOf("Server Side Validations") != -1) {
                var name = fileName.replace(".java", "");
                cs.getSessionId(projectDetails.url, projectDetails.username, projectDetails.password, function (sessionId) {
                    var obj = {
                        "sessionId": sessionId,
                        "offset": 0,
                        "limit": 1,
                        "whereClause": "#objectUid# = ? AND ACTIVE='Y' AND NAME = ? ",
                        "whereClauseParams": [details.uid, name]
                    };
                    getServerSideCode(obj, projectDetails, function (r) {
                        r[0].sessionId = sessionId;
                        callback(details, projectDetails, r[0]);
                    });
                });
            } else {
                var requestDetails = {
                    datasource: details.datasource,
                    key: details.selects[1],
                    value: details.uid
                };
                cs.getSessionId(projectDetails.url, projectDetails.username, projectDetails.password, function (sessionId) {
                    cs.getGWTSelectedRow(projectDetails.url, sessionId, requestDetails, function (result) {
                        result.sessionId = sessionId;
                        callback(details, projectDetails, result);
                    });
                });
            }
        }
    }
}

this.save = function (filePath, workspace) {
    getSelectedFileDSRow(filePath, workspace, function (details, projectDetails, result) {
        var oldContent, code = details.content;
        var newContent = cs.readFile(filePath);
        if (details.code === 'DS') {
            if (filePath.indexOf("Server Side Validations") != -1) {
                oldContent = result.script;
                details.datasource = "RaObjectValidations";
                code = 'script';
            } else {
                if (filePath.indexOf('preQueryScript') !== -1) {
                    oldContent = result.preQueryScript;
                    code = 'preQueryScript';
                } else if (filePath.indexOf('postQueryScript') !== -1) {
                    oldContent = result.postQueryScript;
                    code = 'postQueryScript';
                }
            }
        }
        if (newContent != oldContent) {
            result[code] = newContent;
            cs.updateGWTFile(details, projectDetails, result);
        }
    });
}

this.sync = function (filePath, workspace) {
    getSelectedFileDSRow(filePath, workspace, function (details, projectDetails, result) {
        var newContent = cs.readFile(filePath);
        if (newContent != result[details.content]) {
            if (details.code === 'DS') {
                if (filePath.indexOf("Server Side Validations") != -1) {
                    cs.updateFile(filePath, result.script);
                } else {
                    if (filePath.indexOf('preQueryScript') !== -1) {
                        cs.updateFile(filePath, result.preQueryScript);
                    } else if (filePath.indexOf('postQueryScript') !== -1) {
                        cs.updateFile(filePath, result.postQueryScript);
                    }
                }
            } else {
                cs.updateFile(filePath, result[details.content]);
            }
        }
    });
}
this.getSnippets = function (workspace, type) {
    var projectDetails = cs.getProjectDetails(workspace);
    var url = projectDetails.url;
    var b = getBindings();
    var requestDetails = b[type];
    cs.getSessionId(url, projectDetails.username, projectDetails.password, function (sessionId) {
        cs.getGWTTemplates(url, sessionId, requestDetails, function (templates) {
            if (templates === null) {
                cs.showInformationMessage("No " + type + " found!");
                return;
            }
            getSelection(templates, requestDetails.selects[0], function (selected) {
                requestDetails.key = requestDetails.selects[1];
                requestDetails.value = selected[requestDetails.key];
                cs.getGWTSelectedRow(url, sessionId, requestDetails, function (result) {
                    processData(sessionId, workspace, projectDetails, requestDetails, result);
                });
            });
        });
    });
}