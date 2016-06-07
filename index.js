var tabs = require("sdk/tabs");
var self = require("sdk/self");
var data = self.data;
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var fileIO = require("sdk/io/file");
var { Cc, Ci, Cu } = require('chrome');
var analyze = require('./analyze');
var { getActiveView }=require("sdk/view/core");
Cu.import("resource://gre/modules/Sqlite.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");



var dbFile = 'webpages.sqlite'; //'C:\\Users\\tatyana_c\\Desktop\\webpages.txt';
var fullDBPath = '';

var savingFormInfo = {
    'table': {
        'Должность': { 'element': 'input', 'hhselector': "[data-qa='resume-block-title-position']" , 'params': { 'name': 'profession', 'type': 'text' }},
        'Фио': { 'element': 'input', 'hhselector': "[data-qa='resume-personal-address']", 'params': { 'name': 'name', 'type': 'text' } },
        'Дата рождения': { 'element': 'input', 'hhselector': "[data-qa='resume-personal-birthday']", 'params': { 'name': 'birthday', 'type': 'text' } },
        'Места работы': { 'element': 'textarea', 'hhselector': '', 'params': { 'name': 'work_history' } },
        'Зарплатные ожидания': { 'element': 'input', 'hhselector': "[data-qa='resume-block-salary']", 'params': { 'name': 'payment', 'type': 'text' } },
        'Ключевые навыки': { 'element': 'textarea', 'hhselector': "[data-qa='bloko-tag__text']", 'params': { 'name': 'achievements' } },
        'Общая информация': { 'element': 'textarea', 'hhselector': "[data-qa='resume-block-skills']", 'params': { 'name': 'additional_info' } },
        'Знание языков': { 'element': 'input', 'hhselector': "[data-qa='resume-block-language-item']", 'params': { 'name': 'languages', 'type': 'text' } },
        'Занятость': { 'element': 'input', 'hhselector': "[data-qa='resume-block-specialization-category']", 'params': { 'name': 'игын', 'type': 'text' } }
    }
}

function month2num(name) {
    var month = ['января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'];
    return month.indexOf(name) != -1 ? month.indexOf(name) : name;
}


fullDBPath = 'C:\\Users\\tatyana_c\\Desktop\\webpages.sqlite';


var button = ToggleButton({
    id: "webpages",
    label: "Works with webpages",
    icon: "./icon/main-icon.png",
    onChange: handleChange
});


var panel = panels.Panel({
    width: 300,
    height: 230,
    contentURL: data.url("menu.html"),
    contentScriptFile: data.url("menu.js")
});
getActiveView(panel).setAttribute("noautohide", true);

// Listen for messages called "hide-window" coming from
// the content script.
panel.port.on("hide-window", function() {
    panel.hide();
    handleHide();
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
    //check database for categories
    checkDatabaseScheme();

    switch (menuItem) {
        case 'save':
            savePage(false);
            break;
        case 'find':
            findClick();
            break;
        case 'resume':
            savePage(true);
            break;
    }
});

var text_entry = panels.Panel({
    width: 460,
    height: 550,
    contentURL: data.url("get-text.html"),
    contentScriptFile: data.url("get-text.js"),
    contentScriptOptions: {tableContent: savingFormInfo['table']}
});

getActiveView(text_entry).setAttribute("noautohide", true);

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

// Listen for messages called "close-window" coming from
// the content script.
text_entry.port.on("close-window", function() {
    text_entry.hide();
    handleHide();
});


function checkDatabaseScheme() {
    Sqlite.openConnection({ path: fullDBPath }).then(
        function onOpen(conn) {
            checking(conn);
        },

        function onError(error) {
            console.log('error in checkDatabaseScheme:', error.toString());
        }
    );
}

function checking(conn) {
    Task.spawn(function* checkDatabase() {
        try {
            var query = 'CREATE TABLE if not exists files';
            query += '(id integer PRIMARY KEY autoincrement, path varchar(400));';
            yield conn.execute(query);
            query = 'CREATE TABLE if not exists categories';
            query += '(id integer PRIMARY KEY autoincrement, name varchar(200));';
            yield conn.execute(query);
            query = 'CREATE TABLE if not exists keywords';
            query += '(id integer PRIMARY KEY autoincrement, keyword varchar(500),cat_id integer,';
            query += 'FOREIGN KEY(cat_id) REFERENCES categories(id) ON DELETE CASCADE);';
            yield conn.execute(query);
            query = 'CREATE TABLE if not exists links';
            query += '(id integer PRIMARY KEY autoincrement,kw_id integer,file_id integer,';
            query += 'FOREIGN KEY(kw_id) REFERENCES keywords(id) ON DELETE CASCADE,';
            query += 'FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE);';
            yield conn.execute(query);
            var result = [];
            query = 'SELECT * FROM categories';
            var res = yield conn.execute(query);
            for (var row = 0; row < res.length; row++) {
                result.push(res[row].getResultByName("name"));
            }
            var dataToInsert = [];
            for (var i in savingFormInfo['table']) {
                if (result.indexOf(i) == -1)
                    dataToInsert.push({ 'nameCat': i });
            }
            if (dataToInsert.length != 0) {
                console.log('There are no categories', dataToInsert)
                query = 'INSERT INTO categories(name) VALUES (:nameCat);';
                yield conn.execute(query, dataToInsert);
                query = 'SELECT * FROM categories';
                res = yield conn.execute(query);
                /*for (var row = 0; row < res.length; row++) {
                    console.log(res[row].getResultByName("name"));
                }*/
            }
        } finally {
            yield conn.close();
        }
    });
}


function checkingPath(path) {
    path = path.replace(/((\\)+|(\/)+)/gm, "\\");
    try {
        val = fileIO.exists(path);
    } catch (e) {
        val = false;
    }
    if (val == false) {
        path = path.replace(/((\\)+)/gm, "\/");
        try {
            val = fileIO.exists(path);
        } catch(e) {
            val = false;
        }
    }
    if (val == true)
        return path;
    else
        return -1;
}


// Show the panel when the user clicks the button.
function findClick(state) {
    text_entry.show();
}



function prepareTable(savingFormInfo, response) {
    var result = {}

    for (var row = 0; row < response.length; row++) {
        var value = '';
        switch (response[row]['name']) {
            case 'Дата рождения':
                var birthdate = response[row]['value'][0];
                /*birthdate = birthdate.replace(/[\:\.\-\;\|\"\'\*\?\\\/<>\+\n\t\r ]/g,"^").replace(/((\^)+)/gm, "^").split('^');
                value = [];
                for (var i = 0; i< birthdate.length; i++) {
                    if (isNaN(parseInt(birthdate[i])))
                        value.push(month2num(birthdate[i]));
                    else
                        value.push(birthdate[i]);
                }//month2num(name)*/
                value = birthdate.replace(/[\:\.\-\;\|\"\'\*\?\\\/<>\+\n\t\r ]/g,"^").split('^').join('.');
                break;
            case 'Зарплатные ожидания':

                if (isNaN(parseInt(response[row]['value'][0].replace(/[^0-9]/iug, ""))))
                    value = '0';
                else
                    value = response[row]['value'][0].replace(/[^0-9]/iug, "");
                break;
            default:
                value = response[row]['value'].join(',').replace(/((\n)+)/gm, ",");
                break;
        }
        if (['Фио', 'Дата рождения','Ключевые навыки', 'Должность'].indexOf(response[row]['name']) == -1)
            value = value.replace(/[\:\.\;\|\"\'\*\?\\\/<>\+\n\t\r\=]/g,"^").split('^').join(',').replace(/((,)+)/gm, ",");
        result[response[row]['name']] = {};
        for (var prop in savingFormInfo['table'][response[row]['name']]) {
            result[response[row]['name']][prop] = savingFormInfo['table'][response[row]['name']][prop];
        }
        debugger;

        result[response[row]['name']]['value'] = value;
        //{ 'element': 'input', 'hhselector': "[data-qa='resume-block-title-position']" , 'params': { 'name': 'profession', 'type': 'text' }},
    }
    return result;
}

function saveAndWriteInfo(filename, webpage, fullDBPath, keywords, saving_entry, asResume) {
    try {
        ByteWriter = fileIO.open(filename, "wb");
        if (ByteWriter.closed) {
            return -1;
        }

        ByteWriter.write(webpage);
        ByteWriter.close();

        Task.spawn(function* demoDatabase() {
            var conn = yield Sqlite.openConnection({path: fullDBPath});

            try {
                yield conn.execute('PRAGMA foreign_keys = ON');
                var query = 'DELETE FROM files WHERE path = ?';
                yield conn.execute(query, [filename]);
                var categories = {};
                query = 'SELECT * FROM categories';
                var result = yield conn.execute(query, null);
                for (var row = 0; row < result.length; row++) {
                    categories[result[row].getResultByName("id")] = result[row].getResultByName("name");
                }

                query = 'INSERT INTO files(path) VALUES (?);';
                yield conn.execute(query, [filename]);
                query = "SELECT  id FROM files ORDER BY id DESC";
                result = yield conn.execute(query);
                    
                // Only one row is returned.
                var row = result[0];
                var fileId = row.getResultByName("id");
                var kw = [];
                for (var i in keywords) {
                    keywords[i] = keywords[i].split(',');
                    var tmp = [];
                    for (var j = 0; j < keywords[i].length; j++) {
                        if (keywords[i][j].trim().length > 1 || keywords[i][j].trim().length >= 1 && asResume)
                            tmp.push(keywords[i][j].trim());
                    }
                    kw = kw.concat(tmp);
                    keywords[i] = tmp;
                }
                var keywordIds = [];
                var queryarr = [];
                for (var i = 0 ; i < kw.length; i++) {
                    queryarr.push('?');
                }
                query = 'SELECT * FROM keywords WHERE keyword IN (' + queryarr.join(',') + ');';
                result = yield conn.execute(query, kw);
                for (var row = 0; row < result.length; row++) {

                    var catName = categories[result[row].getResultByName("cat_id")];
                    if (keywords[catName] == undefined)
                        continue;
                    var indx = keywords[catName].indexOf(result[row].getResultByName("keyword"));
                    if (indx != -1) {
                        keywords[catName].splice(indx, 1);
                        keywordIds.push(result[row].getResultByName("id"));
                    }
                }
                //console.log('keywords for write', keywords);
                //console.log('keywords not write', keywordIds);
                var keywordCount = 0;
                for (var cat in categories) {
                    if (keywords[categories[cat]] == undefined)
                        continue;
                    for (var i = 0; i < keywords[categories[cat]].length; i++, keywordCount++) {
                        query = 'INSERT INTO keywords(keyword, cat_id) VALUES (?, ?);';
                        result = yield conn.execute(query, [keywords[categories[cat]][i], parseInt(cat)]);
                    }
                }
                query = 'SELECT id FROM keywords ORDER BY id DESC LIMIT ' + keywordCount + ';';
                result = yield conn.execute(query);
                for (var row = 0; row < result.length; row++) {
                    keywordIds.push(result[row].getResultByName("id"));
                }
                for (var i = 0; i < keywordIds.length; i++) {
                    query = 'INSERT INTO links(kw_id, file_id) VALUES (?, ?);';
                    yield conn.execute(query, [keywordIds[i], fileId]);
                }
                saving_entry.show();
                saving_entry.port.emit("saved");
            }  catch (e) {

                saving_entry.show();
                saving_entry.port.emit("error", 'It was problem with saving ' + e);

            } finally {
                console.log('save finally');
                yield conn.close();
            }
        });
    } catch (err) {
        saving_entry.show();
        saving_entry.port.emit("error", 'It was problem with saving ' + e);
    }
}

function savePage(asResume) {
    var fillingtable = [];
    for (var i in savingFormInfo['table']) {
        fillingtable.push({'name': i, 'value': [], 'hhselector': savingFormInfo['table'][i]['hhselector']});
    }
    var saving = tabs.activeTab.attach({
        contentScriptFile: data.url("saving.js"),
        contentScriptOptions: { asResume: asResume,'table': savingFormInfo['table']} //'table': fillingtable }
    });

    saving.port.on("save-data", function(text) {
        var savingData = JSON.parse(text);
        var webpage = savingData['content'];
        var filename = savingData['filename'];
        var ishh = savingData['ishh'];
        asResume = savingData['asResume'];
        //find keywords
        var saving_entry;
        if (asResume ) {
            var tableContent;
            if (ishh){
                tableContent = savingData['keywords'];//prepareTable(savingFormInfo, savingData['keywords']);
            } else {
                tableContent = savingFormInfo['table'];
            }
            saving_entry = panels.Panel({
                width: 450,
                height: 600,
                contentURL: data.url("save-page.html"),
                contentScriptFile: data.url("save-page.js"),
                contentScriptOptions: { asResume: asResume, 'tableContent': tableContent }
            });
            getActiveView(saving_entry).setAttribute("noautohide", true);

            if (!ishh) {
                saving_entry.show({
                    position: button
                });
                saving.port.on("save-item", function(text) {
                    saving_entry.port.emit("set-item", text);
                });
            }
        } else {
            var keywords = [];
            var myAnalyzer = new analyze.VsStat();
            myAnalyzer.setText(savingData['analyzeText']);
            var res = myAnalyzer.getStat(); //now we have array of word combination - collocations

            for (var i in res) {
                keywords.push(res[i].word);
            }
            var kw = savingData['keywords'].split(',');
            for (var i = 0; i < kw.length; i++) {
                if (keywords.indexOf(kw[i]) == -1 && kw[i].length > 1) {
                    keywords.unshift(kw[i]);
                }
            }
            keywords = keywords.join(',').replace(/((,)+)/gm, ","); //if we have 2,3 or more commas

            //we founded keywords. So, let's ask user for his keywords and dir for page.
            saving_entry = panels.Panel({
                width: 400,
                height: 350,
                contentURL: data.url("save-page.html"),
                contentScriptFile: data.url("save-page.js"),
                contentScriptOptions: { asResume: asResume, 'keywords': keywords }
            });

            getActiveView(saving_entry).setAttribute("noautohide", true);
            //saving_entry.port.emit("take-keywords", keywords);
        }
        saving_entry.show();
        saving_entry.on("show", function() {
            saving_entry.port.emit("show");
        });

        // Listen for messages called "close-window" coming from
        // the content script.
        saving_entry.port.on("close-window", function() {
            saving_entry.hide();
            handleHide();
        });
        saving_entry.port.on("saving-text-entered", function(text) {
            try {
                var keywords = JSON.parse(text)['keywords'];
                var working_dir = checkingPath(JSON.parse(text)['dir']);

                if (working_dir == -1) {
                    saving_entry.port.emit('bad-dir');
                    return;
                }
                saving_entry.port.emit('good-dir', working_dir);

                saveAndWriteInfo(fileIO.join(working_dir, filename), webpage, fullDBPath, keywords, saving_entry, asResume);
            } catch (e) {

                saving_entry.show();
                saving_entry.port.emit("error", 'It was problem with saving ' + e);

            }
        });
    });
}


function findText(text) {
    var result = [],
        count = 0;
    var data = JSON.parse(text); //user's data - text and dir
    var path = data['dir']; //user's dir
    var findInfo = data['text'];
    if (data['keyword']) {
        findByKeyword(fullDBPath, findInfo);
    } else {
        if (!data['strictFind'])
            findInfo = findInfo.toLowerCase().replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, ",").split(',');
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

    text_entry.port.on('open-file', function(text) {
        tabs.open(text);
    });
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

function compareDate(value, keywords) {
    for (var item = 0; item < keywords.length; item++) {
        var tmp = keywords[item]["value"].split('.').join('');
        if (keywords[item]["operand"] == '=')
            value += '=';

        var str = value + keywords[item]["operand"] + tmp;
        try {
            if (eval(str) == false)
                return false;
        }catch(e) {
            return false;
        }
    }
    return true
}

function* findByDate(conn, keywords, category_id) {
    var filesresult = [];
    query = 'SELECT id, keyword FROM keywords WHERE ';
    query += 'cat_id=' + category_id + ';';
    //console.log('query', query);
    //SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000
    result = yield conn.execute(query);
    var keywords_id = [];
    for (var row = 0; row < result.length; row++) {
        var tmp = result[row].getResultByName("keyword").split('.').join('');
        if (compareDate(tmp, keywords))
            keywords_id.push(result[row].getResultByName("id"));
    }
    //console.log('keywords_id', keywords_id);
    if (keywords_id.length != 0) {
        query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
        var whereClause = [];
        for (var j = 0; j < keywords_id.length; j++) {
            whereClause.push('?');
        }
        query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);'
        console.log('query',query);
        console.log('keywords_id', keywords_id);
        result = yield conn.execute(query, keywords_id);
        for (var row = 0; row < result.length; row++) {
            if (filesresult.indexOf(result[row].getResultByName("path")) == -1)
                filesresult.push(result[row].getResultByName("path"));
        }
        console.log('files', filesresult);
    }
    return filesresult;
}

function* findByPayment(conn, keywords, category_id) {

    var filesresult = [];
    query = 'SELECT id, keyword FROM keywords WHERE ';
    query += 'cat_id=' + category_id + ' AND ';
    var where_clause = [];
    for (var i = 0; i < keywords.length; i++) {
        where_clause.push('cast(keyword as int)' + keywords[i]['operand'] + keywords[i]['value']);
    }
    query += where_clause.join(' AND ') + ';';
    //console.log('query', query);
    //SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000
    result = yield conn.execute(query);
    var keywords_id = [];
    for (var row = 0; row < result.length; row++) {
        keywords_id.push(result[row].getResultByName("id"));
    }
    //console.log('keywords_id', keywords_id);
    if (keywords_id.length != 0) {
        query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
        var whereClause = [];
        for (var j = 0; j < keywords_id.length; j++) {
            whereClause.push('?');
        }
        query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);'
        //console.log('query',query);
        //console.log('keywords_id', keywords_id);
        result = yield conn.execute(query, keywords_id);
        for (var row = 0; row < result.length; row++) {
            if (filesresult.indexOf(result[row].getResultByName("path")) == -1)
                filesresult.push(result[row].getResultByName("path"));
        }
        console.log('files', filesresult);
    }
    //SELECT * FROM files WHERE files.id IN (SELECT file_id  FROM links  WHERE kw_id NOT IN(SELECT id FROM keywords WHERE cat_id=5) GROUP BY file_id)
    return filesresult;
}
//fullDBPath was defined at this page top, and then it getting when user chooses menu items
function findByKeyword(fullDBPath, allKeywords) {
    var result = [],
        count = 0;
    //findInfo = ('%' + findInfo.replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, "%,%") + '%').split(',');


    Task.spawn(function* demoDatabase() {
        var conn = yield Sqlite.openConnection({path: fullDBPath});
        var isEverythyngOkay = false;
        try {
            var categories = {};
            query = 'SELECT * FROM categories';
            var result = yield conn.execute(query, null);
            for (var row = 0; row < result.length; row++) {
                categories[result[row].getResultByName("name")] = result[row].getResultByName("id");
            }
            var keywords_result = {}, keywords_count = 0;
            for (var cat_name in allKeywords) {

                if (categories[cat_name] != undefined && cat_name.indexOf('Дата') != -1) {
                    keywords_result[keywords_count + '_' + cat_name] = yield findByDate(conn, allKeywords[cat_name], categories[cat_name]);
                    keywords_count++;
                    continue;
                }
                if (categories[cat_name] != undefined && cat_name.indexOf('Зарплат') != -1) {
                    keywords_result[keywords_count + '_' + cat_name] = yield findByPayment(conn, allKeywords[cat_name], categories[cat_name]);
                    keywords_count++;
                    continue;
                }//SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000
                
                var keywordsArr = [];
                var kwItem = allKeywords[cat_name];
                for (var i = 0; i < kwItem.length; i++) {
                    var infoarr = [];
                    if (kwItem[i]['operand'].toLowerCase() == 'LIKE'.toLowerCase())
                        infoarr = ('%' + kwItem[i]['value'].replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, "%,%") + '%').split(',');
                    else
                        infoarr = kwItem[i]['value'].toLowerCase().replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, ",").split(',');
                    for (var j = 0; j < infoarr.length; j++) {
                        keywordsArr.push({'value': infoarr[j], 'operand': kwItem[i]['operand']});
                    }
                    
                }
                //('%' + allKeywords[cat_name].toLowerCase().replace(/[^a-zA-ZА-Яа-я0-9\s]/g, " ").replace(/(( )+)/gm, "%,%") + '%').split(',');
                
                for (var i = 0; i < keywordsArr.length; i++, keywords_count++) {
                    keywords_result[i + '_' + cat_name] = [];
                    query = 'SELECT id, keyword FROM keywords WHERE ';
                    // it can be 'all_cat' category
                    if (categories[cat_name] != undefined) {
                        query += 'cat_id=' + categories[cat_name] + ' AND ';
                    }
                    query += 'keyword ' + keywordsArr[i]['operand'] + ' ?;';
                   // console.log('query',query);
                    //console.log('keywordsArr', keywordsArr[i]);
                    result = yield conn.execute(query, [keywordsArr[i]['value']]);
                    var keywords_id = [];
                    for (var row = 0; row < result.length; row++) {
                        keywords_id.push(result[row].getResultByName("id"));
                    }
                    console.log('keywords_id', keywords_id);

                    if (keywords_id.length != 0) {
                        query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
                        var whereClause = [];
                        for (var j = 0; j < keywords_id.length; j++) {
                            whereClause.push('?');
                        }
                        query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);'
                        console.log('query',query);
                        console.log('keywords_id', keywords_id);
                        result = yield conn.execute(query, keywords_id);
                        for (var row = 0; row < result.length; row++) {
                            if (keywords_result[i + '_' + cat_name].indexOf(result[row].getResultByName("path")) == -1)
                                keywords_result[i + '_' + cat_name].push(result[row].getResultByName("path"));
                        }
                        console.log('files', keywords_result);

                    }
                }
            }
            console.log('end', keywords_result);
            var files = {}, maxiimum = 0;
            for (var i in keywords_result){
                for (var j = 0; j < keywords_result[i].length; j++) {
                    if (files[keywords_result[i][j]] == undefined)
                        files[keywords_result[i][j]] = 0;
                    files[keywords_result[i][j]] ++;
                }
            }
            var res = [];
            for (var i in files){
                if (files[i] >= keywords_count)
                    //delete files[i];
                //else
                    res.push(i)
            }
            console.log(res);

            sendFindInfo(res, res.length);
            isEverythyngOkay = true;
            yield conn.close();
        } catch (e) {
            text_entry.show();
            text_entry.port.emit("error", 'It was problems with finding: ' + e);
        } finally {
            console.log('save finally');
            yield conn.close();
        }/**/
    });

}

function sendFindInfo(result, count) {
    var data = {
        'result': result,
        'count': count
    }
    text_entry.show();
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
