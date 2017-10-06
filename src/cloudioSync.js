var path = require('path');
var cs = require('./cloudioServices');
var cp = require('./cloudioCreateProject');
var vscode = require('vscode');
var service = cs.getServices();

this.syncAll = function (workspace) {
    var data = service.getProjectDetails(workspace);
    service.removeFolder(workspace);
    cp.syncProject(data);
}

this.sync = function (param, workspace) {
    var filePath = service.getExactFilePath(param);
    var folder = path.dirname(filePath);
    var data = service.getProjectDetails(workspace);
    if (data != null) {
        service.getSessionId(data.url, data.username, data.password, function (sessionId) {
            var hc = service.readFile(path.resolve(folder, "other.json"));
            var rootValues = JSON.parse(hc);
            service.getPageMetaData(data.url, sessionId, rootValues.pageId, function (r) {
                service.createPageFolder(r[0], folder);
            });
        });
    }
}