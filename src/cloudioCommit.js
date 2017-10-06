var path = require('path');
var cs = require('./cloudioServices');
var service = cs.getServices();

this.commit = function (param, workspace) {
    var filePath = service.getExactFilePath(param);
    var fileName = path.basename(filePath);
    var data = service.getProjectDetails(workspace);
    if (!data || data === null) {
        service.showErrorMessage("Connection is corrupted. Please try to create a new connection.");
        return;
    }
    service.getSessionId(data.url, data.username, data.password, function (sessionId) {
        var otherFile = path.join(path.dirname(filePath), "other.json");
        var rootValues = JSON.parse(service.readFile(otherFile));
        service.getPageMetaData(data.url, sessionId, rootValues.pageId, function (r) {
            var oldData = r[0];
            oldData.sessionId = sessionId;
            oldData.versionId = rootValues.versionId;
            var content = service.readFile(filePath);
            if (fileName === 'controller.js') {
                oldData.controller = content;
            } else if (fileName === 'templateHtml.html') {
                oldData.templateHtml = content;
            } else if (fileName === 'resolveJson.json') {
                oldData.resolveJson = content;
            } else if (fileName === 'details.json') {
                var detailsObject = JSON.parse(content);
                for (var key in detailsObject) {
                    oldData[key] = detailsObject[key];
                }
            } else {
                return;
            }
            service.updatePage(data.url, oldData, function (newData) {
                rootValues.versionId = newData.versionId;
                rootValues.lastUpdateDate = newData.lastUpdateDate;
                rootValues.lastUpdatedBy = newData.lastUpdatedBy;
                rootValues.creationDate = newData.creationDate;
                rootValues.createdBy = newData.createdBy;
                service.updateFile(otherFile, JSON.stringify(rootValues, null, 4));
            });
        });
    });
}