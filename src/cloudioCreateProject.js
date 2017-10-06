var vscode = require('vscode');
var os = require('os');
var fs = require('fs');
var cs = require('./cloudioServices.js');
var cloudioServices = cs.getServices();

function createMetaFiles(data) {
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
}

function openProjectFolder(data) {
    cloudioServices.showInformationMessage("Project '" + data.projectName + "' is created successfully!");
    vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.parse(data.projectFolder));
}

function createWorkspace(data) {
    cloudioServices.getSessionId(data.url, data.username, data.password, function (sessionId) {
        data.projectFolder = cloudioServices.createFolder(data.workspace, data.projectName);
        createMetaFiles(data);
        cloudioServices.getPageMetaData(data.url, sessionId, null, function (metaData) {
            if (metaData !== null) {
                metaData.forEach(function (md) {
                    cloudioServices.createPageFolder(md, cloudioServices.createFolder(data.projectFolder, md.pageCode));
                });
                openProjectFolder(data);
            } else {
                cloudioServices.showInformationMessage("No IO Pages found!");
                openProjectFolder(data);
            }
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
            if (projectDetails.url.substr(0, 4) !== 'http') {
                projectDetails.url = 'http://' + projectDetails.url;
            }
            createWorkspace(projectDetails);
            return;
        }
        getValuesFromInputbox(params[i], callback);
        i++;
    }
    getValuesFromInputbox(params[0], callback);
}