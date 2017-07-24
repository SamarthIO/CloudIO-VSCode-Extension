var vscode = require('vscode');
var createProject = require('./cloudioCreateProject.js');
var commitChanges = require('./cloudioCommit.js');
var syncFolder = require('./cloudioSync.js');

function activate(context) {
    vscode.workspace.onDidSaveTextDocument(listener = function (event) {
        commitChanges.commit(event.fileName);
    }, null, context.subscriptions);
    vscode.workspace.onDidOpenTextDocument(listener = function (event) {
        syncFolder.sync(event.fileName);
    }, null, context.subscriptions);
    var disposable = vscode.commands.registerCommand('extension.cloudio', function (param) {
        createProject.getProject();
    });
    context.subscriptions.push(disposable);
    var sessionLanguageD = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems() {
            return [new vscode.CompletionItem('get()', 2)];
        }
    }, 'Session.');
    context.subscriptions.push(sessionLanguageD);
    var sessionPropertyLanguageD = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems() {
            var completionItem = [];
            var attrs = ["userName", "userId", "sessionId", "displayName", "emailAddress"];
            attrs.forEach(function (v) {
                completionItem.push(new vscode.CompletionItem(v, 9));
            });
            return completionItem;
        }
    }, 'Session.get().');
    context.subscriptions.push(sessionPropertyLanguageD);
    var loggerLanguageD = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems() {
            var completionItem = [];
            var attrs = ['showAlert(message, title)', 'showConfirm(message, confirmCallback, title)', 'confirm(message, title).then(callback)'];
            attrs.forEach(function (v) {
                completionItem.push(new vscode.CompletionItem(v, 2));
            });
            return completionItem;
        }
    }, 'Logger.');
    context.subscriptions.push(loggerLanguageD);
    var cacheLanguageD = vscode.languages.registerCompletionItemProvider('javascript', {
        provideCompletionItems() {
            var completionItem = [];
            var attrs = ['get(key)', 'put(key, value)'];
            attrs.forEach(function (v) {
                completionItem.push(new vscode.CompletionItem(v, 2));
            });
            return completionItem;
        }
    }, 'Cache.');
    context.subscriptions.push(cacheLanguageD);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;