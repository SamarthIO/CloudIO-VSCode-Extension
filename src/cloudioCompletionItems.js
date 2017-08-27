var vscode = require('vscode');

function getLoggerCompletionList() {
    var loggerCompletionList = [];

    var showAlert = new vscode.CompletionItem('showAlert(message, title);', vscode.CompletionItemKind.Method);
    showAlert.documentation = "Method : \nLogger.showAlert(message, title)";
    loggerCompletionList.push(showAlert);

    var showConfirm = new vscode.CompletionItem('showConfirm(message, callback, title)', vscode.CompletionItemKind.Method);
    showConfirm.insertText = ['showConfirm(message, function(){', '\t//After Confirm', '}, title);\n'].join('\n'),
        showConfirm.documentation = "Method : \nLogger.showConfirm(message, confirmCallback, title)";
    loggerCompletionList.push(showConfirm);

    var confirm = new vscode.CompletionItem('confirm(message, callback): Thenable<function, function>', vscode.CompletionItemKind.Method);
    confirm.insertText = ['confirm(message, title).then( function okCallback() {',
        '\t// this callback will be called asynchronously',
        '}, function cancelCallback() {', '\t// called asynchronously if an error occurs', '});'].join('\n');
    confirm.documentation = "Method : \nLogger." + confirm.insertText;
    loggerCompletionList.push(confirm);

    var showConfirmWithButtons = new vscode.CompletionItem('showConfirmWithButtons(message, confirmCallback, title, buttonLabels);', vscode.CompletionItemKind.Method);
    showConfirmWithButtons.documentation = "Method : \nLogger.showConfirmWithButtons(message, confirmCallback, title, buttonLabels)";
    loggerCompletionList.push(showConfirmWithButtons);

    return loggerCompletionList;
}

function getCacheCompletionList() {
    cacheCompletionList = [];

    var getCache = new vscode.CompletionItem('get(key)', vscode.CompletionItemKind.Method);
    getCache.documentation = "Method : \nCache.get(key) returns values";
    cacheCompletionList.push(getCache);

    var putCache = new vscode.CompletionItem('put(key, value)', vscode.CompletionItemKind.Method);
    putCache.documentation = "Method : \nCache.put(key, value) returns value";
    cacheCompletionList.push(putCache);

    var removeCahce = new vscode.CompletionItem('remove(key)', vscode.CompletionItemKind.Method);
    removeCahce.documentation = "Method : \nCache.remove(key)";
    cacheCompletionList.push(removeCahce);

    var clearCache = new vscode.CompletionItem('clear()', vscode.CompletionItemKind.Method);
    clearCache.documentation = "Method : \nCache.clear()";
    cacheCompletionList.push(clearCache);

    return cacheCompletionList;
}

function getSessionCompletionList(){
    var sessionCompletionList = [];

    var getSession = new vscode.CompletionItem('get()', vscode.CompletionItemKind.Method);
    getSession.documentation = "Method : \nSession.get() returns Session object";
    sessionCompletionList.push(getSession);

    var validateSession = new vscode.CompletionItem('validate(callback)', vscode.CompletionItemKind.Method);
    validateSession.insertText = ["validate(function(result) {", "\t//session is valid", "});"].join("\n");
    validateSession.documentation = "Method : \nSession.validate(function(result: Object){/n//session is valid})";
    sessionCompletionList.push(validateSession);

    var showLoginSession = new vscode.CompletionItem('showLogin()', vscode.CompletionItemKind.Method);
    showLoginSession.documentation = "Method : \nSession.showLogin() /nPage will be rendered to login screen.";
    sessionCompletionList.push(showLoginSession);

    var isActiveSession = new vscode.CompletionItem('isActive()', vscode.CompletionItemKind.Method);
    isActiveSession.documentation = "Method : \nSession.isActive() /nReturns if the session is active.";
    sessionCompletionList.push(isActiveSession);

    var signOffSession = new vscode.CompletionItem('signOff(force)', vscode.CompletionItemKind.Method);
    signOffSession.documentation = "Method : \nSession.signOff(force : String) /n sigoff from application";
    sessionCompletionList.push(signOffSession);

    return sessionCompletionList;
}

this.addCompleteRegisters = function () {
    vscode.languages.registerCompletionItemProvider({ language: 'javascript', pattern: '**/controller.js' }, {
        provideCompletionItems(model, position) {
            var range = new vscode.Range(position.line, 0, position.line, position.character);
            var textUntilPosition = model.getText(range);
            if (textUntilPosition && textUntilPosition.length > 0 && textUntilPosition.trim().length > 0) {
                var text = textUntilPosition.trim();
                if (text.startsWith('Logger.')) {
                    return getLoggerCompletionList();
                } else if (text.startsWith('Cache.')) {
                    return getCacheCompletionList();
                } else if (text.startsWith('Session.')) {
                    return getSessionCompletionList();
                } else {
                    return [];
                }
            }
            return [];
        }
    }, ['.']);
}