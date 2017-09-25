var vscode = require('vscode');
var os = require('os');
var fs = require('fs');
var cs = require('./cloudioServices.js');
var cloudioServices = cs.getServices();

function createWorkspace(data) {
    cloudioServices.getSessionId(data.url, data.username, data.password, function (sessionId) {
        cloudioServices.getPageMetaData(data.url, sessionId, null, function (metaData) {
            var projectName = data.projectName;
            var folder = cloudioServices.createFolder(data.workspace, projectName);
            if (folder === null) {
                return;
            }
            data.projectFolder = folder;
            var prjectFolder = data.projectFolder;
            metaData.forEach(function (md) {
                var pageCode = md.pageCode;
                var folder = cloudioServices.createFolder(prjectFolder, pageCode);
                if (folder !== null) {
                    cloudioServices.createPageFolder(md, folder);
                }
            });
            cloudioServices.createFile(JSON.stringify(data, null, 4), data.projectFolder, "project.json");
            var vsCodeFolder = cloudioServices.createFolder(data.projectFolder, ".vscode");
            var excluseFiles = {
                "files.exclude": {
                    "**/other.json": true,
                    "project.json": true,
                    "**/.metaData.json": true
                }
            }
            cloudioServices.createFile(JSON.stringify(excluseFiles, null, 4), vsCodeFolder, "settings.json");
            cloudioServices.showInformationMessage("Project '" + projectName + "' is created successfully!");
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(prjectFolder));
        });
    });
}

this.syncProject = function (data) {
    createWorkspace(data);
}

function getValuesFromInputbox(param, callback) {
    param.options.ignoreFocusOut = true;
    param.options.prompt = param.options.placeHolder;
    vscode.window.showInputBox(param.options).then(function (val) {
        if (val) {
            if (param.key === 'workspace') {
                if (!fs.existsSync(val)) {
                    cloudioServices.showErrorMessage("Workspace location not found. Please try again.");
                    return;
                }
            }
            callback(param.key, val);
        }
    });
}

this.getProject = function () {
    var projectDetails = {};
    var i = 1;
    var params = [
        { key: "projectName", options: { placeHolder: "Enter Connection Name", value: "Untitled" } },
        { key: "workspace", options: { placeHolder: "Enter Workspace Location", value: os.homedir() } },
        { key: "url", options: { placeHolder: "Enter Application Url", value: "http://192.168.10.112:3480" } },
        { key: "username", options: { placeHolder: "Enter Username", value: "admin" } },
        { key: "password", options: { placeHolder: "Enter Password", password: true } }
    ]
    function callback(key, val) {
        projectDetails[key] = val;
        if (i === params.length) {
            if (projectDetails.url[projectDetails.url.length - 1] !== '/') {
                projectDetails.url += '/';
            }
            projectDetails.url += "api/";
            createWorkspace(projectDetails);
            return;
        }
        getValuesFromInputbox(params[i], callback);
        i++;
    }
    getValuesFromInputbox(params[0], callback);
}