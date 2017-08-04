var path = require('path');
var cs = require('./cloudioServices');
var cloudioServices = cs.getServices();

this.sync = function (param) {
    var fsPath = param.replace(param.charAt(0), param.charAt(0).toUpperCase());
    var filePath = path.normalize(fsPath);
    var fileName = path.basename(filePath);
    var folder = path.dirname(filePath); 
    var workspace = path.dirname(folder);
    var projectFile = path.resolve(workspace, "project.json");
    var fileExcept = ['controller.js', 'templateHtml.html', 'resolveJson.json', 'details.json'];
    if (fileExcept.indexOf(fileName) === -1) {
        return;
    }
    var data = cloudioServices.readFile(projectFile);
    if (data != null) {
        var obj = JSON.parse(data);
        cloudioServices.getSessionId(obj.url, obj.username, obj.password, function (sessionId) {
            var otherFile = path.resolve(folder, "other.json");
            var hc = cloudioServices.readFile(otherFile);
            var rootValues = JSON.parse(hc);
            cloudioServices.getPageMetaData(obj.url, sessionId, rootValues.pageId, function (r) {
                cloudioServices.createPageFolder(r[0], folder);
            });
        });
    }
}