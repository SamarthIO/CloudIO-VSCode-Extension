var path = require('path');
var vscode = require('vscode');
var cs = require('./cloudioServices');
var cloudioServices = cs.getServices();

function createPage(url, sessionId, pageCode, roleUid, workspace) {
    cloudioServices.createNewPage(url, sessionId, pageCode, roleUid, function (page) {
        var folder = cloudioServices.createFolder(workspace, pageCode);
        cloudioServices.createPageFolder(page, folder);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(path.join(folder, 'details.json')));
    });
}

this.newPage = function (param) {
    var fsPath = param.replace(param.charAt(0), param.charAt(0).toUpperCase());
    var workspace = path.normalize(fsPath);
    var projectFile = path.resolve(workspace, "project.json");
    var data = cloudioServices.readFile(projectFile);
    if (data != null) {
        var obj = JSON.parse(data);
        cloudioServices.getSessionId(obj.url, obj.username, obj.password, function (sessionId) {
            cloudioServices.getRoles(obj.url, sessionId, function (roles) {
                vscode.window.showInputBox({
                    placeHolder: "Enter Page Code",
                    value: "NewPage",
                    prompt: "Please Enter Page Code",
                    ignoreFocusOut: true
                }).then(function (pageCode) {
                    if (pageCode) {
                        pageCode = pageCode.replace(/\s/g, '');
                        if (pageCode && pageCode.length > 0) {
                            var options = [];
                            roles.forEach(function (v) {
                                options.push(v.roleName);
                            });
                            vscode.window.showQuickPick(options, {
                                placeHolder: "Please select a role",
                                ignoreFocusOut: true
                            }).then(function (selected) {
                                var role = roles.filter(function (el) {
                                    return el.roleName === selected;
                                });
                                createPage(obj.url, sessionId, pageCode, role[0].roleUid, workspace);
                            });
                        }
                    }
                });
            });
        });
    }
}