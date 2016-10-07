var tabs = require("sdk/tabs");
var self = require("sdk/self");
var data = self.data;
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var fileIO = require("sdk/io/file");
var { Cc, Ci, Cu } = require('chrome');
var { getActiveView } = require("sdk/view/core");
var analyze = require('./analyze');

Cu.import("resource://gre/modules/Sqlite.jsm");
Cu.import("resource://gre/modules/Task.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");



var dbFile = 'webpages.sqlite'; //'C:\\Users\\tatyana_c\\Desktop\\webpages.txt';
var fullDBPath = 'C:\\Users\\tatyana_c\\Desktop\\';

var hhselector = { 'block': "[data-qa='resume-block-experience']", 
                    'company': ".resume-block-item-gap, .resume-block__experience", 
                    'experience': "[data-qa='resume-block-experience-position'], [data-qa='resume-block-experience-description'], [class='resume-block__experience-gap-bottom']" };
var hhselector2 = { 'block': '.resume__experience', 'company': ".resume__experience__item", 'experience': ".resume__experience__desc" };

var savingFormInfo = {
    'table': {
        'Position': { 'element': 'input', 'hhselector3': '.b-resume-profession', 'hhselector2': ".resume__position__title", 'hhselector': "[data-qa='resume-block-title-position']", 'params': { 'name': 'profession', 'type': 'text' } },
        'Full name': { 'element': 'input', 'hhselector3': '.b-resume-name', 'hhselector2': ".resume__personal__name", 'hhselector': "[data-qa='resume-personal-name']", 'params': { 'name': 'name', 'type': 'text' } },
        'Phone': { 'element': 'input', 'hhselector3': '.b-resume-important .b-resume-important-accent', 'hhselector2': ".skype_pnh_text_span", 'hhselector': "[itemprop='telephone']", 'params': { 'name': 'phone', 'type': 'text' } },
        'Email': { 'element': 'input', 'hhselector3': ".b-resume-important .b-forma-widecell a", 'hhselector2': "[itemprop='email']", 'hhselector': "[itemprop='email']", 'params': { 'name': 'email', 'type': 'text' } },

        'Date of Birth': { 'element': 'input', 'hhselector3': '.b-resume-important tr', 'hhselector2': "[itemprop='birthDate']", 'hhselector': "[data-qa='resume-personal-birthday']", 'params': { 'name': 'birthday', 'type': 'text' } },
        'Work': { 'element': 'textarea', 'hhselector3': '.b-resume-experience', 'hhselector2': hhselector2, 'hhselector': hhselector, 'params': { 'name': 'work_history' } },
        'Salary': { 'element': 'input', 'hhselector3': '.b-resume-important .b-resume-important-accent', 'hhselector2': ".resume__position__salary", 'hhselector': "[data-qa='resume-block-salary']", 'params': { 'name': 'payment', 'type': 'text' } },
        'Skills': { 'element': 'textarea', 'hhselector3': '.b-resume-keywords', 'hhselector2': '[data-qa="skills-element"]', 'hhselector': "[data-qa='bloko-tag__text']", 'params': { 'name': 'achievements' } },
        'Other info': { 'element': 'textarea', 'hhselector3': '.b-resume-additional', 'hhselector2': ".resume__twocols_cell", 'hhselector': "[data-qa='resume-block-skills']", 'params': { 'name': 'additional_info' } },
        'Languages': { 'element': 'input', 'hhselector3': '.b-resume-additional .b-forma-table tr', 'hhselector2': '.resume-block .resume-block', 'hhselector': "[data-qa='resume-block-language-item']", 'params': { 'name': 'languages', 'type': 'text' } },
        'Employment': { 'element': 'input', 'hhselector2': ".resume__position__specialization ul", 'hhselector': "[data-qa='resume-block-specialization-category']", 'params': { 'name': 'busy', 'type': 'text' } }
    }
}

var deleteSelectors = ['.b-footer', '.HH-Related-Resumes', '.footer', '.HH-SearchVacancyMap-Footer', '.resume__related', 
    '.m-row_foot', '.b-related-wrapper', '.l-layout-left', '.navi__top', '.navi__menu', '.navi__dummy', '.navi', '.b-topbanner', '.b-head'];// 

var button = ToggleButton({
    id: "webpages",
    label: "Works with webpages",
    icon: "./icon/main-icon.png",
    onChange: handleChange
});


var panel = panels.Panel({
    width: 300,
    height: 270, //230,
    contentURL: data.url("menu.html"),
    contentScriptFile: data.url("menu.js")
});
getActiveView(panel).setAttribute("noautohide", true);

//set listeners for menu panel
panel.port.on("hide-window", function() {
    panel.hide();
    handleHide();
});

//user chose item in menu.it takes dir for database and menu item
panel.port.on("click-link", menu);


//create finding panel
var text_entry = panels.Panel({
    width: 460,
    height: 550,
    contentURL: data.url("get-text.html"),
    contentScriptFile: data.url("get-text.js"),
    contentScriptOptions: { tableContent: savingFormInfo['table'] }
});

getActiveView(text_entry).setAttribute("noautohide", true);

//set listeners for finding panel
text_entry.on("show", function() {
    text_entry.port.emit("show");
});

text_entry.port.on("text-entered", findText);

text_entry.port.on("close-window", function() {
    text_entry.hide();
    handleHide();
});

text_entry.port.on("main-menu", function() {
    mainMenu(text_entry);
});

text_entry.port.on('open-file', function(text) {
    tabs.open(text);
});

//create import panel
var import_panel = panels.Panel({
    width: 400,
    height: 540,
    contentURL: data.url("import-webpages.html"),
    contentScriptFile: data.url("import-webpages.js")
});
getActiveView(import_panel).setAttribute("noautohide", true);

import_panel.port.on("main-menu", function() {
    mainMenu(import_panel);
});

import_panel.port.on("close-window", function() {
    import_panel.hide();
    handleHide();
});

import_panel.port.on('open-file', function(text) {
    tabs.open(text);
});
//set listeners for finding panel
import_panel.on("show", function() {
    import_panel.port.emit("show");
});


//otherkeywords - текст с разделителями-запятыми
//функция вернет текст с разделителями-запятыми
function analyzeKeywordsInText(otherkeywords, analyzeText) {
    var keywords = [];
    var myAnalyzer = new analyze.VsStat();
    var res = myAnalyzer.getStat(); //now we have array of word combination - collocations

    myAnalyzer.setText(analyzeText);

    for (var i in res) {
        keywords.push(res[i].word);
    }

    var kw = otherkeywords.split(',');
    for (var i = 0; i < kw.length; i++) {
        if (keywords.indexOf(kw[i]) == -1 && kw[i].length > 1) {
            keywords.unshift(kw[i]);
        }
    }
    keywords = keywords.join(',').replace(/((,)+)/gm, ","); //if we have 2,3 or more commas
    return keywords;
}

/*import function. It takes all selected files, run saving.js for every page and takes result.
then all results collects in array and calls saveAndWriteInfo function.
So, every page processes as an usual page when we try to save it*/
import_panel.port.on('import', function(text) {
    var mydata = JSON.parse(text);
    var files = mydata['files'];
    var working_dir = checkingPath(mydata['dir']);
    var asResume = true;

    if (working_dir == -1) {
        import_panel.port.emit('bad-dir');
        return;
    }

    import_panel.port.emit('good-dir', working_dir);

    var arr = [];
    for (var i = 0; i < files.length; i++) {

        var pageWorker = require("sdk/page-worker").Page({
            contentScriptFile: data.url("saving.js"),
            contentScriptOptions: { asResume: asResume, 
                                    'table': savingFormInfo['table'], 
                                    'import': true,
                                    'filename': files[i]['name'], 
                                    'deleteSelectors': deleteSelectors },
            contentURL: files[i]['data']
        });
        pageWorker.port.on("save-data", function(text) {
            var savingData = JSON.parse(text);
            var webpage = savingData['content'];
            var filename = savingData['filename'];
            var keywords = {};
            asResume = savingData['asResume'];
            try {
                if (asResume == true) {
                    for (var row in savingData['keywords']) {
                        keywords[row] = savingData['keywords'][row].value.toLowerCase();
                    }
                } else {
                    var myKeywords = analyzeKeywordsInText(savingData['keywords'].toLowerCase(), savingData['analyzeText']);
                    keywords['Other info'] = myKeywords;
                }
                arr.push({
                    'keywords': keywords,
                    'webpage': webpage,
                    'filename': filename,
                    'asResume': asResume
                })
                if (arr.length >= files.length) {
                    saveAndWriteInfo(fullDBPath, working_dir, arr, import_panel, "imported");
                    /*for (var k = 0; k < arr.length; k++) {
                        Task.spawn(function* () {
                            yield saveAndWriteInfo(fileIO.join(working_dir, arr[k]['filename']), arr[k]['webpage'], fullDBPath, arr[k]['keywords'], import_panel, "imported", arr[k]['asResume']);
                         
                        });
                    }*/
                }
            } catch (err) {
                debugger;
                console.log('There was error: '+ err.message +';\n' +  err.stack);

            }
        });
    }
    //import_panel.port.emit("imported");
})


function menu(text) {
    var path = JSON.parse(text)['dir'];
    var menuItem = JSON.parse(text)['menuItem'];

    path = checkingPath(path);
    if (path == -1) {
        panel.port.emit('bad-dir');
        return;
    } else {
        fullDBPath = fileIO.join(path, dbFile);
        Task.spawn(function*() {
            try {
                yield checking(fullDBPath, panel);
                panel.port.emit('good-dir', path);
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
                    case 'import':
                        importPages();
                        break;
                }
            } catch (e) {
                path = -1;
                panel.port.emit('bad-dir');
            }
        });
    }
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
        } catch (e) {
            val = false;
        }
    }
    if (val == true)
        return path;
    else
        return -1;
}

/*this function checks database, creates tables if they aren't exist, creates categories, if they aren't in db*/
function* checking(fullDBPath, messPanel) {
    var conn;
    try {
        conn = yield Sqlite.openConnection({ path: fullDBPath });
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
            console.log('There are no categories', dataToInsert);
            query = 'INSERT INTO categories(name) VALUES (:nameCat);';
            yield conn.execute(query, dataToInsert);
            query = 'SELECT * FROM categories';
            res = yield conn.execute(query);
        }
    } catch (e) {
        console.log('There are problems whith checking database scheme: ' + e.toString());
        messPanel.show();
        messPanel.port.emit('error', 'There are problems whith checking database scheme: ' + e.toString());
    } finally {
        yield conn.close();
    }
}

function importPages() {
    import_panel.show();
}

function savePage(asResume) {
    var saving = tabs.activeTab.attach({
        contentScriptFile: data.url("saving.js"),
        contentScriptOptions: { asResume: asResume, 
                                'table': savingFormInfo['table'], 
                                'import': false,
                                'deleteSelectors': deleteSelectors }
    });

    saving.port.on("save-data", function(text) {
        var savingData = JSON.parse(text);
        var webpage = savingData['content'];
        var filename = savingData['filename'];
        var ishh = savingData['ishh'];
        var saving_entry;

        asResume = savingData['asResume'];
        //find keywords
        if (asResume) {
            var tableContent;

            if (ishh) {
                tableContent = savingData['keywords'];
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
            var res = myAnalyzer.getStat(); //now we have array of word combination - collocations

            myAnalyzer.setText(savingData['analyzeText']);

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

        saving_entry.port.on("main-menu", function() {
            mainMenu(saving_entry);
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

                var arr = [];
                arr.push({
                    'keywords': keywords,
                    'webpage': webpage,
                    'filename': filename,
                    'asResume': asResume
                })
                saveAndWriteInfo(fullDBPath, working_dir, arr, saving_entry, "saved");
                //saveAndWriteInfo(fileIO.join(working_dir, filename), webpage, fullDBPath, keywords, saving_entry, asResume);
            } catch (e) {
                saving_entry.show();
                saving_entry.port.emit("error", 'It was problem with saving ' + e);
            }
        });
    });
}

/*this function takes file info(name, keywords, type(is it resume) ).
It deletes info about files with same name, then insert info about file and its keywords.*/
function* writeInDB(conn, filename, keywords, users_pane, signal, asResume) {
    try {
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
        var kw_arrays = {};
        for (var i in keywords) {
            kw_arrays[i] = keywords[i].split(',');
            var tmp = [];
            for (var j = 0; j < kw_arrays[i].length; j++) {
                if (kw_arrays[i][j].trim().length > 1 || kw_arrays[i][j].trim().length >= 1 && asResume)
                    tmp.push(kw_arrays[i][j].trim());
            }
            kw = kw.concat(tmp);
            kw_arrays[i] = tmp;
        }
        var keywordIds = [];
        var queryarr = [];
        for (var i = 0; i < kw.length; i++) {
            queryarr.push('?');
        }
        query = 'SELECT * FROM keywords WHERE keyword IN (' + queryarr.join(',') + ');';
        result = yield conn.execute(query, kw);
        for (var row = 0; row < result.length; row++) {

            var catName = categories[result[row].getResultByName("cat_id")];
            if (kw_arrays[catName] == undefined)
                continue;
            var indx = kw_arrays[catName].indexOf(result[row].getResultByName("keyword"));
            if (indx != -1) {
                kw_arrays[catName].splice(indx, 1);
                keywordIds.push(result[row].getResultByName("id"));
            }
        }
        var keywordCount = 0;
        for (var cat in categories) {
            if (kw_arrays[categories[cat]] == undefined)
                continue;
            for (var i = 0; i < kw_arrays[categories[cat]].length; i++, keywordCount++) {
                query = 'INSERT INTO keywords(keyword, cat_id) VALUES (?, ?);';
                result = yield conn.execute(query, [kw_arrays[categories[cat]][i], parseInt(cat)]);
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
        //users_pane.show();
        users_pane.port.emit(signal, filename);

    } catch (e) {
        users_pane.port.emit("error", 'It was problem with saving ' + filename + '\n' + e);
    }
}

/*arr is array with files info(content, keywords,etc)
this function calls during import and saving. It checkes database
(maybe somebody deleted database before these actions), then it works with arr.
and for every arr element function create and write file in filesystem, 
and then calls writeInDB function, that writes keywords in database*/
function saveAndWriteInfo(fullDBPath, working_dir, arr, my_panel, signal) {
    Task.spawn(function*() {
        try {
            yield checking(fullDBPath, my_panel);
            var conn = yield Sqlite.openConnection({ path: fullDBPath });
            yield conn.execute('PRAGMA foreign_keys = ON');

            for (var k = 0; k < arr.length; k++) {
                var filename = fileIO.join(working_dir, arr[k]['filename']);

                ByteWriter = fileIO.open(filename, "wb");
                if (ByteWriter.closed) {
                    return -1;
                }

                ByteWriter.write(arr[k]['webpage']);
                ByteWriter.close();
                yield writeInDB(conn, filename, arr[k]['keywords'], my_panel, signal, arr[k]['asResume']);

            }
        } catch (e) {
            my_panel.port.emit("error", 'It was problem with saving ' + e);
        } finally {
            console.log('save finally');
            yield conn.close();
        }
    });
}

/*finding function.It takes data,typed by user and find files by keywords or doing simple find.
for finding by keywords it calls findByKeyword function,
for other way - it check dirpath from user,and,if everything is ok, 
take all *.html files and give them one to findInFile function */
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
            findInfo = findInfo.toLowerCase().replace(/[^a-zA-ZА-Яа-я0-9\#\+\s]/g, " ").replace(/(( )+)/gm, ",").split(',');
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
}


/*simple search - open file and read it*/
function findInFile(file, findInfo, strictFind) {
    var result = false;
    var TextReader = fileIO.open(file, "r");
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



/*this function takes path to db and keywords dictionary. in this dict categories are keys,
and values are list with dictionaries like {'operand': '', 'value': ''}. 
'operand' is string from list  ['LIKE', '<>','=','>','<','!=','>=','<='], 'value' is value from inputs.
We have list with this dictionaries, because user can make condition like:
Salary > 20000 AND Salary <= 100000.
So, in our system it'll present like:
{'Salary':[
    {'operand': '>', 'value': '20000'},
    {'operand': '<=', 'value': '100000'}
],
......
}
Conditions 'Date of Birth' and 'Salary' process separately in functions findByDate and findByPayment.
Let's talk about usual keywords.
Every 'value' in structure {'operand': '', 'value': ''} will separate by all non-alphabet and non-numeric symbols,
so,now value is list, and we collect keywordsArr from all keywords in this category.
For example, user wanted Skills LIKE 'Программист,дизайнер' and Skills LIKE 'администратор'. In our system it'll be:
{'Skills':[
    {'operand': 'LIKE', 'value': 'Программист,дизайнер'},
    {'operand': '=', 'value': 'администратор,html'}
],
......
}
When we separate 'value' by punctiation symbols, we will have keywordsArr:
[{'value': '%Программист%', 'operand': 'LIKE'},{'value': '%дизайнер%', 'operand': 'LIKE'},
{'value': 'администратор', 'operand': '='},{'value': 'html', 'operand': '='}]
% symbol means,that we can take keywords with other text is this symbol's place

TODO

think about date search!it's difficult,because we need to decide date format.I mean, DD.MM.YYYY or MM.DD.YYYY or other way/

*/
//fullDBPath was defined at this page top, and then it getting when user chooses menu items
function findByKeyword(fullDBPath, allKeywords) {
    var result = [],
        count = 0;

    Task.spawn(function* demoDatabase() {
        try {
            yield checking(fullDBPath, text_entry);
            var conn = yield Sqlite.openConnection({ path: fullDBPath });
            var isEverythyngOkay = false;
            var categories = {};
            query = 'SELECT * FROM categories';
            var result = yield conn.execute(query, null);
            for (var row = 0; row < result.length; row++) {
                categories[result[row].getResultByName("name")] = result[row].getResultByName("id");
            }
            var keywords_result = {},
                keywords_count = 0;
            for (var cat_name in allKeywords) {
                if (categories[cat_name] != undefined && cat_name.toLowerCase().indexOf('date') != -1) {
                    keywords_result[keywords_count + '_' + cat_name] = yield findByDate(conn, allKeywords[cat_name], categories[cat_name]);
                    keywords_count++;
                    continue;
                }
                if (categories[cat_name] != undefined && cat_name.indexOf('Salary') != -1) {
                    keywords_result[keywords_count + '_' + cat_name] = yield findByPayment(conn, allKeywords[cat_name], categories[cat_name]);
                    keywords_count++;
                    continue;
                } //SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000

                var keywordsArr = [];
                var kwItem = allKeywords[cat_name];
                for (var i = 0; i < kwItem.length; i++) {
                    var infoarr = [];
                    if (kwItem[i]['operand'].toLowerCase() == 'LIKE'.toLowerCase())
                        infoarr = ('%' + kwItem[i]['value'].replace(/[^a-zA-ZА-Яа-я0-9\+\#\@\-\s]/g, " ").replace(/(( )+)/gm, "%,%") + '%').split(',');
                    else
                        infoarr = kwItem[i]['value'].toLowerCase().replace(/[^a-zA-ZА-Яа-я0-9\+\#\@\-\s]/g, " ").replace(/(( )+)/gm, ",").split(',');
                    for (var j = 0; j < infoarr.length; j++) {
                        if (infoarr[j] != '%%')
                            keywordsArr.push({ 'value': infoarr[j], 'operand': kwItem[i]['operand'] });
                    }
                }

                for (var i = 0; i < keywordsArr.length; i++, keywords_count++) {
                    keywords_result[i + '_' + cat_name] = [];
                    query = 'SELECT id, keyword FROM keywords WHERE ';
                    // it can be 'all_cat' category
                    if (categories[cat_name] != undefined) {
                        query += 'cat_id=' + categories[cat_name] + ' AND ';
                    }
                    query += 'keyword ' + keywordsArr[i]['operand'] + ' ?;';
                    result = yield conn.execute(query, [keywordsArr[i]['value']]);
                    var keywords_id = [];
                    for (var row = 0; row < result.length; row++) {
                        keywords_id.push(result[row].getResultByName("id"));
                    }

                    if (keywords_id.length != 0) {
                        while (keywords_id.length > 0) {
                            query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
                            var whereClause = [];
                            for (var j = 0; j < Math.min(keywords_id.length, 500); j++) {
                                whereClause.push('?');
                            }
                            query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);';
                            result = yield conn.execute(query, keywords_id.splice(0, 500));
                            for (var row = 0; row < result.length; row++) {
                                if (keywords_result[i + '_' + cat_name].indexOf(result[row].getResultByName("path")) == -1)
                                    keywords_result[i + '_' + cat_name].push(result[row].getResultByName("path"));
                            }
                        }
                    }
                }
            }
            var files = {},
                maxiimum = 0;
            for (var i in keywords_result) {
                for (var j = 0; j < keywords_result[i].length; j++) {
                    if (files[keywords_result[i][j]] == undefined)
                        files[keywords_result[i][j]] = 0;
                    files[keywords_result[i][j]]++;
                }
            }
            var res = [];
            for (var i in files) {
                if (files[i] >= keywords_count)
                    res.push(i)
            }

            sendFindInfo(res, res.length);
            isEverythyngOkay = true;
        } catch (e) {
            text_entry.show();
            text_entry.port.emit("error", 'It was problems with finding: ' + e);
        } finally {
            console.log('finding finally');
            yield conn.close();
        }
    });
}

//getting all dates from db, then compare them with user's conditions
function* findByDate(conn, keywords, category_id) {
    var filesresult = [];
    query = 'SELECT id, keyword FROM keywords WHERE ';
    query += 'cat_id=' + category_id + ';';
    //SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000
    result = yield conn.execute(query);
    var keywords_id = [];
    for (var row = 0; row < result.length; row++) {
        var tmp = result[row].getResultByName("keyword").split('.').join('');
        if (compareDate(tmp, keywords))
            keywords_id.push(result[row].getResultByName("id"));
    }
    if (keywords_id.length != 0) {
        query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
        var whereClause = [];
        for (var j = 0; j < keywords_id.length; j++) {
            whereClause.push('?');
        }
        query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);';
        result = yield conn.execute(query, keywords_id);
        for (var row = 0; row < result.length; row++) {
            if (filesresult.indexOf(result[row].getResultByName("path")) == -1)
                filesresult.push(result[row].getResultByName("path"));
        }
    }
    return filesresult;
}

//getting from db keywords as integer values,then get files with this keywords as usual
//it's special function, because other categories keywords are processed in other way - 
//they are split by punctuation marks
function* findByPayment(conn, keywords, category_id) {
    var filesresult = [];
    query = 'SELECT id, keyword FROM keywords WHERE ';
    query += 'cat_id=' + category_id + ' AND ';
    var where_clause = [];
    for (var i = 0; i < keywords.length; i++) {
        where_clause.push('cast(keyword as int)' + keywords[i]['operand'] + keywords[i]['value']);
    }
    query += where_clause.join(' AND ') + ';';
    //SELECT * FROM keywords WHERE cast(keyword as int)>60000 AND cast(keyword as int)<80000
    result = yield conn.execute(query);
    var keywords_id = [];
    for (var row = 0; row < result.length; row++) {
        keywords_id.push(result[row].getResultByName("id"));
    }
    if (keywords_id.length != 0) {
        query = 'SELECT count(links.id) AS count,files.path AS path FROM links INNER JOIN files ON links.file_id=files.id WHERE ';
        var whereClause = [];
        for (var j = 0; j < keywords_id.length; j++) {
            whereClause.push('?');
        }
        query += ' links.kw_id IN (' + whereClause.join(',') + ') GROUP BY (files.path);';
        result = yield conn.execute(query, keywords_id);
        for (var row = 0; row < result.length; row++) {
            if (filesresult.indexOf(result[row].getResultByName("path")) == -1) {
                filesresult.push(result[row].getResultByName("path"));
            }
        }
    }
    //SELECT * FROM files WHERE files.id IN (SELECT file_id  FROM links  WHERE kw_id NOT IN(SELECT id FROM keywords WHERE cat_id=5) GROUP BY file_id)
    return filesresult;
}

/*this function sends info to find panel. We need in this function, 
because we have two different ways for finding: by keywords(in database) and simple searching - in files*/
function sendFindInfo(result, count) {
    var data = {
        'result': result,
        'count': count
    }
    text_entry.show();
    text_entry.port.emit("end-of-find", JSON.stringify(data));
}

function compareDate(value, keywords) {
    for (var item = 0; item < keywords.length; item++) {
        var tmp = keywords[item]["value"].split('.').join('');
        if (keywords[item]["operand"] == '=') {
            value += '=';
        }

        var str = value + keywords[item]["operand"] + tmp;
        try {
            if (eval(str) == false) {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    return true
}

/* Show the panel when the user clicks the button.*/
function findClick(state) {
    text_entry.show();
}


/*shows menu under main button*/
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

/*make main button unchecked and be ready for click*/
function handleHide() {
    button.state('window', { checked: false });
}


function mainMenu(myPanel) {
    myPanel.hide();
    handleHide();
    button.click();    
}