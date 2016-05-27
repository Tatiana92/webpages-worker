var tabs = require("sdk/tabs");
var self = require("sdk/self");
var data = self.data;
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var fileIO = require("sdk/io/file");
var { Cc, Ci, Cu } = require('chrome');
var analyze = require('./analyze');
Cu.import("resource://gre/modules/Sqlite.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");



var dbFile = 'webpages.sqlite'; //'C:\\Users\\tatyana_c\\Desktop\\webpages.txt';
var fullDBPath = '';

var button = ToggleButton({
    id: "webpages",
    label: "Works with webpages",
    icon: "./icon/main-icon.png",
    onChange: handleChange
});


var panel = panels.Panel({
    width: 300,
    height: 160,
    contentURL: data.url("menu.html"),
    contentScriptFile: data.url("menu.js"),
    onHide: handleHide
});
//user chose item in menu.it takes dir for database and menu item
panel.port.on("click-link", function(text) {
    var path = JSON.parse(text)['dir'];
    var menuItem = JSON.parse(text)['menuItem'];
    path = checkingPath(path);
    if (path == -1) {
        panel.port.emit('bad-dir');
        return;
    }
    fullDBPath = fileIO.join(path, dbFile);
    panel.port.emit('good-dir', path);
    switch (menuItem) {
        case 'save':
            savePage();
            break;
        case 'find':
            findClick();
            break;
    }
});

var text_entry = panels.Panel({
    width: 330,
    height: 390,
    contentURL: data.url("get-text.html"),
    contentScriptFile: data.url("get-text.js")
});

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
text_entry.on("show", function() {
    text_entry.port.emit("show");
});

// Listen for messages called "text-entered" coming from
// the content script.
text_entry.port.on("text-entered", findText);




function checkingPath(path) {
    path = path.replace(/((\\)+|(\/)+)/gm, "\\");
    try {
        fileIO.exists(path);
    } catch (e) {
        path = path.replace(/((\\)+)/gm, "\/");
        try {
            fileIO.exists(path);
        } catch (e) {
            return -1;
        }
    }
    return path;
}


// Show the panel when the user clicks the button.
function findClick(state) {
    text_entry.show();
}

function saveAndWriteInfo(filename, webpage, fullDBPath, keywords, saving_entry) {
    try {
        ByteWriter = fileIO.open(filename, "wb");
        if (ByteWriter.closed) {
            return -1;
        }

        ByteWriter.write(webpage);
        ByteWriter.close();
        Sqlite.openConnection({ path: fullDBPath }).then(
            function onOpen(conn) {
                var query = 'CREATE TABLE if not exists webpage';
                query += '(id integer PRIMARY KEY autoincrement, path varchar(400), keywords varchar(1000));';
                conn.execute(query);
                //var query = "select path, keywords from webpage WHERE keywords LIKE ?;";
                //delete info about the same file
                query = 'DELETE FROM webpage WHERE path = ?';
                conn.execute(query, [filename]).then(
                    function onStatementComplete(result) {
                        query = 'INSERT INTO webpage(path, keywords) VALUES (?, ?);';
                        conn.execute(query, [filename, keywords.toLowerCase()]).then(
                            function onStatementComplete(result) {
                                conn.close();
                                saving_entry.port.emit("saved");
                            }).catch(function(err) {
                            console.log('error while insert:', err.toString());
                        });
                    }
                );
            },

            function onError(error) {
                console.log('error in insert connection:', error.toString());
            }
        );
    } catch (err) {
        return -1;
    }
}

function savePage(state) {
    var saving = tabs.activeTab.attach({
        contentScriptFile: data.url("saving.js")
    });
    saving.port.on("save-data", function(text) {
        var savingData = JSON.parse(text);
        var webpage = savingData['content'];
        var filename = savingData['filename'];
        //find keywords
        var keywords = [];
        var myAnalyzer = new analyze.VsStat();
        myAnalyzer.setText(savingData['analyzeText']);
        var res = myAnalyzer.getStat(); //now we have array of word combination - collocations

        for (var i in res) {
            keywords.push(res[i].word);
            /*var word = res[i].word.split(' '); // split collocation. now we have words
            for (var j in word) { // we need to check, are all words new?
                if (keywords.indexOf(word[j]) == -1 && word[j].length > 1) { // part of
                    keywords.push(word[j]);
                }
            }*/
        }
        var kw = savingData['keywords'].split(',');
        for (var i = 0; i < kw.length; i++) {
            if (keywords.indexOf(kw[i]) == -1 && kw[i].length > 1) {
                keywords.unshift(kw[i]);
            }
        }


        keywords = keywords.join(',').replace(/((,)+)/gm, ","); //if we have 2,3 or more commas

        //we founded keywords. So, let's ask user for his keywords and dir for page.
        var saving_entry = panels.Panel({
            width: 350,
            height: 280,
            contentURL: data.url("save-page.html"),
            contentScriptFile: data.url("save-page.js")
        });

        saving_entry.port.emit("take-keywords", keywords);
        saving_entry.show();
        saving_entry.on("show", function() {
            saving_entry.port.emit("show");
        });

        saving_entry.port.on("saving-text-entered", function(text) {

            var keywords = JSON.parse(text)['keywords'];
            console.log('saving');
            var working_dir = checkingPath(JSON.parse(text)['dir']);
            console.log('working_dir',working_dir);

            if (working_dir == -1) {
                saving_entry.port.emit('bad-dir');
                return;
            }
            saving_entry.port.emit('good-dir', working_dir);

            filename = fileIO.join(working_dir, filename);
            saveAndWriteInfo(filename, webpage, fullDBPath, keywords, saving_entry);
        });
    });
}


function findText(text) {
    var result = [],
        count = 0;
    var data = JSON.parse(text); //user's data - text and dir
    var path = data['dir']; //user's dir
    var findInfo = data['text'].toLowerCase();
    if (data['keyword']) {
        findByKeyword(fullDBPath, findInfo);
    } else {
        if (!data['strictFind'])
            findInfo = findInfo.replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, ",").split(',');
        try {
            path = checkingPath(path);
            if (path == -1) {
                text_entry.port.emit('bad-dir');
                return;
            }
            if (fileIO.exists(path)) {

                text_entry.port.emit('good-dir', path);

                var list = fileIO.list(path); //files in dir, their names
                for (i = 0; i < list.length; i++) { //look at all files
                    var item = fileIO.join(path, list[i]); //full path, dir + name
                    if (fileIO.isFile(item) && (list[i].indexOf(".html") == list[i].length - ".html".length)) {
                        if (findInFile(item, findInfo, data['strictFind'])) {
                            result.push(item);
                            count++;
                        }
                        /*var TextReader = fileIO.open(item, "r");
                        if (!TextReader.closed) {
                            var text = '';
                            if (data['strictFind']) {
                                do {
                                    text = TextReader.read(1024);
                                    if (text.toLowerCase().indexOf(findInfo) != -1) {
                                        result.push(item);
                                        count++;
                                        break;
                                    }
                                } while (text.length > 0);
                            } else {
                                var foundedW = [];
                                do {
                                    text = TextReader.read(1024);
                                    for (var j = 0; j < findInfo.length; j++) {
                                        if (text.toLowerCase().indexOf(findInfo[j]) != -1 && foundedW.indexOf(findInfo[j]) == -1) {
                                            foundedW.push(findInfo[j]);
                                        }
                                    }
                                    if (foundedW.length >= findInfo.length){
                                        result.push(item);
                                        count++;
                                        break;
                                    }
                                } while (text.length > 0);
                            }
                            TextReader.close();
                        }*/
                    }
                }
            } else {
                result.push('Path does not exist');
            }
            if (result.length == 0) {
                result.push('No matches found');
            }
        } catch (e) {
            result.push('It was problems with path: ' + e);
        }
        sendFindInfo(result, count);
    }
}

function findInFile(item, findInfo, strictFind) {
    var result = false;
    var TextReader = fileIO.open(item, "r");
    if (!TextReader.closed) {
        var text = '';
        if (strictFind) {
            do {
                text = TextReader.read(1024);
                if (text.toLowerCase().indexOf(findInfo) != -1) {
                    result = true;
                    break;
                }
            } while (text.length > 0);
        } else {
            var foundedW = [];
            do {
                text = TextReader.read(1024);
                for (var j = 0; j < findInfo.length; j++) {
                    if (text.toLowerCase().indexOf(findInfo[j]) != -1 && foundedW.indexOf(findInfo[j]) == -1) {
                        foundedW.push(findInfo[j]);
                    }
                }
                if (foundedW.length >= findInfo.length) {
                    result = true;
                    break;
                }
            } while (text.length > 0);
        }
        TextReader.close();
    }
    return result;
}

//fullDBPath was defined at this page top, and then it getting when user chooses menu items
function findByKeyword(fullDBPath, findInfo) {
    var result = [],
        count = 0;
    findInfo = ('%' + findInfo.replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, "%,%") + '%').split(',');

    Sqlite.openConnection({ path: fullDBPath }).then(
        function onOpen(conn) {
            var query = 'CREATE TABLE if not exists webpage(id integer PRIMARY KEY autoincrement,path varchar(400),keywords varchar(1000));';
            conn.execute(query);
            var query = "SELECT path, keywords FROM webpage WHERE"; // keywords LIKE ?;";
            var whereClause = [];
            for (var i = 0; i < findInfo.length; i++) {
                whereClause.push(' keywords LIKE ? ');
            }
            query += whereClause.join(' AND ') + ';'
                //query = 'select * from webpage';
                //conn.execute(query, null, function(row) {
            conn.execute(query, findInfo, function(row) {
                result.push(row.getResultByName("path"));
                count++;
            }).then(
                function onStatementComplete(res) {
                    conn.close();

                    //sending data to panel
                    if (result.length == 0) {
                        result.push('There are no similar keywords')
                    }
                    sendFindInfo(result, count);

                }).catch(function(err) {
                sendFindInfo(['error while select:' + err], 0);
                console.log('error while select:', err.toString());
            });
        },

        function onError(error) {
            sendFindInfo(['error in select connection:' + error], 0);
            console.log('error in select connection:', error.toString());
        }
    );
}

function sendFindInfo(result, count) {
    var data = {
        'result': result.join('\n'),
        'count': count
    }
    text_entry.port.emit("end-of-find", JSON.stringify(data));
}

function handleChange(state) {
    if (state.checked) {
        panel.show({
            position: button
        });

        panel.on("show", function() {
            panel.port.emit("show");
        });
    }
}


function handleHide() {
    button.state('window', { checked: false });
}
