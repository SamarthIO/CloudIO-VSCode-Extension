var path = require('path');
var cs = require('./cloudioServices');
var cloudioServices = cs.getServices();

function start(data) {
    var otherFile = path.join(data.folder, "other.json")
    var hc = cloudioServices.readFile(otherFile);
    var rootValues = JSON.parse(hc);
    cloudioServices.getPageMetaData(data.url, data.sessionId, rootValues.pageId, function (r) {
        var folder = data.folder;
        var oldData = r[0];
        var content = null;
        content = cloudioServices.readFile(path.join(folder, "controller.js"));
        if (content != null) {
            oldData.controller = content;
        }
        content = cloudioServices.readFile(path.join(folder, "templateHtml.html"));
        if (content != null) {
            oldData.templateHtml = content;
        }
        content = cloudioServices.readFile(path.join(folder, "resolveJson.json"));
        if (content != null) {
            oldData.resolveJson = content;
        }
        content = cloudioServices.readFile(path.join(folder, "details.json"));
        if (content != null) {
            var detailsObject = JSON.parse(content);
            for (var key in detailsObject) {
                oldData[key] = detailsObject[key];
            }
        }
        oldData.sessionId = data.sessionId;
        oldData.versionId = rootValues.versionId;
        cloudioServices.updatePage(data.url, oldData, function (newData) {
            //cloudioServices.showInformationMessage("Commited Successfully!");
            var attributes = ['pageCode', 'versionId', 'pageId', 'orgId', 'lastUpdateDate', 'lastUpdatedBy', 'creationDate', 'createdBy']
            var obj = {};
            for (var key in newData) {
                if (attributes.indexOf(key) !== -1) {
                    obj[key] = newData[key];
                }
            }
            cloudioServices.createFile(JSON.stringify(obj, null, 4), folder, "other.json");
        });
    });
}

this.commit = function (param) {
    var fsPath = param.replace(param.charAt(0), param.charAt(0).toUpperCase());
    var filePath = path.normalize(fsPath);
    var fileName = path.basename(filePath);
    var folder = path.dirname(filePath);
    var projectFolder = path.dirname(folder);
    var projectFile = path.resolve(projectFolder, "project.json");
    var fileExcept = ['controller.js', 'templateHtml.html', 'resolveJson.json', 'details.json'];
    if (fileExcept.indexOf(fileName) === -1) {
        return;
    }
    var data = cloudioServices.readFile(projectFile);
    if (data != null) {
        var obj = JSON.parse(data);
        cloudioServices.getSessionId(obj.url, obj.username, obj.password, function (sessionId) {
            obj.sessionId = sessionId;
            obj.folder = folder;
            start(obj);
        });
    }else{
        cloudioServices.showErrorMessage("Please re-create project. Error reading root file.");
    }
}