var vscode = require('vscode');
var path = require('path');
var createProject = require('./src/cloudioCreateProject.js');
var commitChanges = require('./src/cloudioCommit.js');
var syncFolder = require('./src/cloudioSync.js');
var createNewPage = require('./src/cloudioNewPage.js');
var cloudioServices = require('./src/cloudioServices');
var completionItems = require('./src/cloudioCompletionItems.js');
var gwtObjects = require('./src/cloudioGWTServices.js');

function activate(context) {
    var cs = cloudioServices.getServices();
    var workspace = cs.getExactFilePath(vscode.workspace.rootPath);
    vscode.workspace.onDidSaveTextDocument(function (event) {
        var fileName = event.fileName;
        if (cs.isProjectFile(fileName, workspace)) {
            if (cs.isGWTFile(fileName)) {
                gwtObjects.save(fileName, workspace);
            } else if (cs.isCloudioPage(fileName)) {
                commitChanges.commit(fileName, workspace);
            } else {
                //
            }
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(function (event) {
        var fileName = event.fileName;
        if (cs.isProjectFile(fileName, workspace)) {
            if (cs.isGWTFile(fileName)) {
                gwtObjects.sync(fileName, workspace);
            } else if (cs.isCloudioPage(fileName)) {
                syncFolder.sync(fileName, workspace);
            } else {
                //
            }
        }
    }, null, context.subscriptions);
    completionItems.addCompleteRegisters();
    var disposable = vscode.commands.registerCommand('extension.cloudio', function (param) {
        if (!workspace) {
            createProject.getProject();
            return;
        }
        var file = path.join(workspace, "project.json");
        var content = cs.readFile(file);
        if (content && content != null) {
            try {
                var obj = JSON.parse(content);
                if (obj.projectFolder === workspace) {
                    var arr = ["New Page", "Sync Current Connection", "New Connection", "Html Template", "Html Request", "Java Snippets", "Datasource Code"];
                    vscode.window.showQuickPick(arr, {
                        placeHolder: "Please select...",
                        ignoreFocusOut: false
                    }).then(function (selected) {
                        if (selected === "New Page") {
                            createNewPage.newPage(workspace);
                        } else if (selected === "Sync Workspace") {
                            syncFolder.syncAll(workspace);
                        } else if (selected === "New Connection") {
                            createProject.getProject();
                        } else if (selected) {
                            gwtObjects.getSnippets(workspace, selected);
                        }
                    });
                } else {
                    createProject.getProject();
                }
            } catch (err) {
                createProject.getProject();
            }
        } else {
            createProject.getProject();
        }
    });
    context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;