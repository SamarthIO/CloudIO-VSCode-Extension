var vscode = require('vscode');
var path = require('path');
var createProject = require('./src/cloudioCreateProject.js');
var commitChanges = require('./src/cloudioCommit.js');
var syncFolder = require('./src/cloudioSync.js');
var createNewPage = require('./src/cloudioNewPage.js');
var cloudioServices = require('./src/cloudioServices');
var completionItems = require('./src/cloudioCompletionItems.js');
function activate(context) {
    vscode.workspace.onDidSaveTextDocument(listener = function (event) {
        commitChanges.commit(event.fileName);
    }, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(listener = function (event) {
        syncFolder.sync(event.fileName);
    }, null, context.subscriptions);
    completionItems.addCompleteRegisters();
    var disposable = vscode.commands.registerCommand('extension.cloudio', function (param) {
        var workspace = vscode.workspace.rootPath;
        if (!workspace) {
            createProject.getProject();
            return;
        }
        var file = path.join(workspace, "project.json");
        var cs = cloudioServices.getServices();
        var content = cs.readFile(file);
        if (content && content != null) {
            try {
                var obj = JSON.parse(content);
                if (obj.projectFolder === workspace) {
                    vscode.window.showQuickPick(["New Page", "Sync Workspace", "New Connection"], {
                        placeHolder: "Please select...",
                        ignoreFocusOut: true
                    }).then(function (selected) {
                        if (selected === "New Page") {
                            createNewPage.newPage(workspace);
                        } else {
                            createProject.getProject();
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