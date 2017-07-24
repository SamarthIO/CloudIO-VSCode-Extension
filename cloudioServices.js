var vscode = require('vscode');
var request = require('request');
var fs = require('fs');
var path = require('path');

var SESSION_ID = undefined;

class cloudioService {
    cloudioApiCall(url, data, callback) {
        request({
            url: url,
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            json: true,
            body: data
        }, function (error, response, body) {
            if (error) {
                vscode.window.showErrorMessage(error.message);
            } else {
                if (response.statusCode !== 200) {
                    vscode.window.showErrorMessage(response.statusMessage);
                } else if (body.$error) {
                    vscode.window.showErrorMessage(body.errorMessage);
                } else {
                    callback(body);
                }
            }
        });
    }
    getSessionId(url, username, password, callback) {
        var cs = new cloudioService();
        function signIn() {
            var obj = { "username": username, "password": password };
            cs.cloudioApiCall(url + "signin", obj, function (r) {
                SESSION_ID = r.sessionId
                callback(r.sessionId);
            });
        }
        if (SESSION_ID) {
            cs.cloudioApiCall(url + "validateSession", { "sessionId": SESSION_ID }, function (r) {
                if (r.valid === "Y") {
                    callback(SESSION_ID);
                } else {
                    signIn();
                }
            });
        } else {
            signIn();
        }
    }
    getPageMetaData(url, sessionId, pageId, callback) {
        var cs = new cloudioService();
        var obj = {
            "sessionId": sessionId,
            "offset": 0,
            "limit": 2000
        };
        if (pageId != null) {
            obj.limit = 1;
            obj.whereClause = "#pageId# = ? ";
            obj.whereClauseParams = [pageId];
        }
        cs.cloudioApiCall(url + "IOPagesDev", obj, function (r) {
            if (r.data && r.data.length > 0) {
                callback(r.data);
            }
        });
    }
    updatePage(url, obj, callback) {
        var cs = new cloudioService();
        cs.cloudioApiCall(url + "IOPagesDev/update", obj, function (r) {
            callback(r);
        });
    }
    createFolder(location, folderName) {
        if (!location || !folderName) {
            return null;
        }
        if (!fs.existsSync(location)) {
            vscode.window.showErrorMessage("Failed to access location.");
            return null;
        }
        var folder = path.join(location, folderName);
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
        return folder;
    }
    createFile(content, folder, fileName) {
        var file = path.join(folder, fileName);
        fs.writeFile(file, content, 'utf8', function (err) {
            if (err) {
                vscode.window.showErrorMessage("Error creating File: " + err);
            }
        });
    }
    readFile(file) {
        if (fs.existsSync(file)) {
            return fs.readFileSync(file).toString();
        }
        //vscode.window.showErrorMessage("Error reading File: " + file);
        return null;
    }
    getBaseDetails(data, type) {
        var obj = {}
        var skipAttributes = ['controller', 'resolveJson', 'templateHtml', '_rs', 'pageCode', 'versionId', 'pageId', 'orgId', 'lastUpdateDate', 'lastUpdatedBy', 'creationDate', 'createdBy']
        var attributes = ['pageCode', 'versionId', 'pageId', 'orgId', 'lastUpdateDate', 'lastUpdatedBy', 'creationDate', 'createdBy']
        for (var key in data) {
            if (type === 'D') {
                if (key.charAt(0) !== '@' && skipAttributes.indexOf(key) === -1) {
                    obj[key] = data[key];
                }
            } else {
                if (attributes.indexOf(key) !== -1) {
                    obj[key] = data[key];
                }
            }
        }
        return obj;
    }
    createPageFolder(value, folder) {
        var cs = new cloudioService();
        if (value.controller) {
            cs.createFile(value.controller, folder, "controller.js");
        }
        if (value.templateHtml) {
            cs.createFile(value.templateHtml, folder, "templateHtml.html");
        }
        if (value.resolveJson) {
            cs.createFile(value.resolveJson, folder, "resolveJson.json");
        }
        var detailsContent = cs.getBaseDetails(value, 'D');
        cs.createFile(JSON.stringify(detailsContent, null, 4), folder, "details.json");
        var otherContent = cs.getBaseDetails(value, 'H');
        cs.createFile(JSON.stringify(otherContent, null, 4), folder, "other.json");
    }
    showInformationMessage(val) {
        vscode.window.showInformationMessage(val);
    }
    showErrorMessage(error) {
        vscode.window.showErrorMessage(error);
    }
}
this.getServices = function () {
    return new cloudioService;
}