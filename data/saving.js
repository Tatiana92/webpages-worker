var isResume = document.location.href.indexOf('hh.ru/resume') != -1 || document.documentElement.innerText.indexOf('HeadHunter') != -1;
var metas = document.getElementsByTagName('meta'); 

for (var i = 0; i < metas.length; i++) { 
  if (metas[i].getAttribute("content")) {
    if (metas[i].getAttribute("content").toLowerCase().indexOf('headhunter') != -1) { 
      isResume = true;
    }
  } 
} 
if (self.options.deleteSelectors) {
    for (var i = 0; i < self.options.deleteSelectors.length; i++) {
        var elements = document.querySelectorAll(self.options.deleteSelectors[i]);
        Array.prototype.forEach.call( elements, function( node ) {
            node.parentNode.removeChild( node );
        });
    }
}


var content = unescape(encodeURIComponent(document.documentElement.outerHTML));
var keywords = '';
var table_indx = 0;
var filename = '';
var data = {};
var fullName = '';

if (document.title.trim().length > 0) {
    filename = document.title.trim();
    keywords = filename.replace(/[\:\.\|\"\*\?\\\/<>]/g, " ").split(' ').join(',');
}
filename = filename.replace(/[\:\.\|\"\*\?\\\/<>]/g, "-") + '.html';
keywords += ',' + document_keywords();

content = '<meta charset="utf-8"/>' + content; //without it you will have bad text in webpage

data = {
    'filename': filename,
    'content': content,
    'keywords': keywords,
    'analyzeText': document.documentElement.innerText
};

if (self.options.asResume == true) {
    if (isResume) {
        try {
            for (var i in self.options.table) {
                if (self.options.table[i]['value'] == undefined)
                    self.options.table[i]['value'] = [];
                /*'Date of Birth' process separately from others.Usually it's in content element,
                but other properties are in innerText.*/
                if (i.toLowerCase().indexOf('date') != -1) {
                    var elemArr = document.querySelectorAll(self.options.table[i]['hhselector']);
                    if (elemArr.length == 0) {
                        elemArr = document.querySelectorAll(self.options.table[i]['hhselector2']);
                    }
                    for (var j = 0; j < elemArr.length; j++) {
                        self.options.table[i]['value'].push(elemArr[j].content);
                    }
                    if (elemArr.length == 0) {
                        self.options.table[i]['value'].push(findInTable(self.options.table[i]['hhselector3'], 'рожден'));
                    }
                    continue;
                }
                /*Employment process separately, because usually it is in noname DOM Element, 
                and we need to find it,using neighbour*/
                if (i.indexOf('Employment') != -1) {
                    var elem = document.querySelectorAll(self.options.table[i]['hhselector'])[0];
                    if (!elem) {
                        elem = document.querySelectorAll(self.options.table[i]['hhselector2'])[0];
                    }
                    if (elem)
                        if (elem.parentNode.nextSibling) {
                            var myVal;
                            myVal = elem.parentNode.nextSibling.innerText;
                            if (myVal == undefined)
                                myVal = elem.parentNode.nextSibling.textContent;
                            if (myVal.toLowerCase().indexOf('employment') != -1) {
                                myVal = myVal.substr('employment'.length + 1, myVal.length);
                            }
                            self.options.table[i]['value'].push(myVal);
                        }
                    continue;
                }
                /*work block contains other blocks and we need to have more than one selector*/
                if (i.indexOf('Work') != -1) {
                    var arr = document.querySelectorAll(self.options.table[i]['hhselector']['block']);
                    if (arr.length == 0) {
                        arr = document.querySelectorAll(self.options.table[i]['hhselector2']['block']); //old hh
                    }
                    for (var j = 0; j < arr.length; j++) {
                        var tmparr = arr[j].querySelectorAll(self.options.table[i]['hhselector']['company']);
                        if (tmparr.length == 0)
                            tmparr = arr[j].querySelectorAll(self.options.table[i]['hhselector2']['company']);
                        for (var row = 0; row < tmparr.length; row++) {
                            var children3 = tmparr[row].querySelectorAll(self.options.table[i]['hhselector']['experience']);
                            if (children3.length == 0) {
                                children3 = tmparr[row].querySelectorAll(self.options.table[i]['hhselector2']['experience']);
                            }
                            var experience = '';
                            for (var k = 0; k < children3.length; k++) {
                                if (children3[k].innerText.length) {
                                    experience += children3[k].innerText + '\n';
                                }
                            }
                            self.options.table[i]['value'].push(experience.substr(0, 1000));
                        }
                    }
                    if (arr.length == 0) {
                        arr = document.querySelectorAll(self.options.table[i]['hhselector3']); //very old hh
                        if (arr.length > 0) {
                            self.options.table[i]['value'].push(arr[0].innerText);
                        }
                    }
                    continue;
                }
                if (i == 'Name' || i == 'Surname') {
                    var elemArr = document.querySelectorAll(self.options.table[i]['hhselector']);
                    //maybe it's old hh page
                    if (elemArr.length == 0 && self.options.table[i]['hhselector2'] != undefined) {
                        elemArr = document.querySelectorAll(self.options.table[i]['hhselector2']);
                        //getting language info in old hh is nontrivial
                        if (elemArr.length == 0) {
                            elemArr = document.querySelectorAll(self.options.table[i]['hhselector3']);
                        }
                    }

                    for (var j = 0; j < elemArr.length; j++) {
                        fullName = elemArr[j].innerText.substr(0, 1000);
                        if (i == 'Name') {
                            if (elemArr[j].innerText.split(' ').length > 1) {
                                self.options.table[i]['value'].push(elemArr[j].innerText.split(' ')[1]);
                            }
                        }
                        if (i == 'Surname') {
                            self.options.table[i]['value'].push(elemArr[j].innerText.split(' ')[0]);
                        }
                    }
                    continue;
                }
                /*YAHOOOO!!!!at last!it's usual processing!*/
                var elemArr = document.querySelectorAll(self.options.table[i]['hhselector']);
                //maybe it's old hh page
                if (elemArr.length == 0 && self.options.table[i]['hhselector2'] != undefined) {
                    elemArr = document.querySelectorAll(self.options.table[i]['hhselector2']);
                    //getting language info in old hh is nontrivial
                    if (i.indexOf('Languag') != -1 && elemArr.length != 0) {
                        for (var j = 0; j < elemArr.length; j++) {
                            if (elemArr[j].innerText.toLowerCase().indexOf('язык') != -1 && elemArr[j].innerText.toLowerCase().indexOf('ключев') == -1) {
                                for (var k = 1; k < elemArr[j].children.length; k++) { //first element would be a title
                                    self.options.table[i]['value'].push(elemArr[j].children[k].innerText);
                                }
                            }
                        }
                        continue;
                    }
                }
                /*maybe it's TOO OLD HH PAGE! salary and language are in tables and no named blocks for them.
                So, there are table identificators in hhselector3 field. And we need to find info by field name on page.*/
                if (elemArr.length == 0) {
                    switch (i) {
                        case 'Salary':
                            self.options.table[i]['value'].push(findInTable(self.options.table[i]['hhselector3'], 'зарпл'));
                            continue;
                        case 'Languages':
                            self.options.table[i]['value'].push(findInTable(self.options.table[i]['hhselector3'], 'язык'));
                            continue;
                        case 'Phone':
                            self.options.table[i]['value'].push(findInTable(self.options.table[i]['hhselector3'], 'тел'));
                            continue;
                        case 'Email':
                            var elemArr = document.querySelectorAll(self.options.table[i]['hhselector3']);
                            var valueArr = []
                            for (var j = 0; j < elemArr.length; j++) {
                                if (elemArr[j].innerText.toLowerCase().indexOf('@') != -1) {
                                    valueArr.push(elemArr[j].innerText);
                                }
                            }
                            self.options.table[i]['value'] = valueArr;
                            continue;
                        default:
                            elemArr = document.querySelectorAll(self.options.table[i]['hhselector3']);
                    }
                }
                for (var j = 0; j < elemArr.length; j++) {
                    self.options.table[i]['value'].push(elemArr[j].innerText.substr(0, 1000));
                }
            }
            for (var i in self.options.table) {
                if (i == 'Email') {
                    self.options.table[i]['value'] = self.options.table[i]['value'].join(',');
                    continue;
                }
                self.options.table[i]['value'] = parseValue(self.options.table[i]['value'], i);
            }
            data['ishh'] = true;
            data['keywords'] = self.options.table;
            debugger;
            if (self.options.filename) {
                data['filename'] = self.options.filename;
            } else {
                if (fullName.length) {
                    data['filename'] = fullName + '.html';
                }
            }

        } catch (e) {
            debugger;
            console.log('error while parsing - ', e.message, e.stack);
            self.options.asResume = false;
        } /**/

        sendData(data);
    } else {
        var confirmstr = "this website is not HeadHunter. Our add-on can't parse this page. Do you want select keywords for resume by yourself?It can take some minutes.";
        var saveUsualText = self.options.import; //if we import page and it isnt headhunter - user cant make resume by his hands!
        if (!self.options.import) { //if it's import user cannot rule
            saveUsualText = !confirm(confirmstr)
            if (saveUsualText == true) {
                alert("We'll save this webpage as usual webpage");
            }
        }
        if (self.options.filename) {
            data['filename'] = self.options.filename;
        }
        if (saveUsualText) {
            self.options.asResume = false;
            self.options.table = keywords;
            data['keywords'] = self.options.table;
            data['ishh'] = false;
            sendData(data);
        } else {
            data['keywords'] = '';
            data['ishh'] = false;
            sendData(data);
            runOnKeys(sendSelection, "S".charCodeAt(0));
        }
    }
} else {
    sendData(data);
}


function findInTable(selector, label) {
    var elemArr = document.querySelectorAll(selector);
    for (var j = 0; j < elemArr.length; j++) {
        if (elemArr[j].innerText.toLowerCase().indexOf(label) != -1) {
            return elemArr[j].children[1].innerText;
        }
    }
    return '';
}

function sendSelection() {
    var selection = window.getSelection();
    self.port.emit("save-item", selection.toString());
}

function sendData(data) {
    data['asResume'] = self.options.asResume;
    self.port.emit("save-data", JSON.stringify(data));
}

function document_keywords() {
    var keywords = '';
    var metas = document.getElementsByTagName('meta');

    for (var x = 0, y = metas.length; x < y; x++) {
        if (metas[x].name.toLowerCase() == "keywords") {
            keywords += metas[x].content;
        }
    }
    return keywords;
}

function runOnKeys(func) {
    var codes = [].slice.call(arguments, 1);
    var pressed = {};

    document.onkeydown = function(e) {
        e = e || window.event;
        pressed[e.keyCode] = true;
        for (var i = 0; i < codes.length; i++) {
            if (!pressed[codes[i]]) {
                return;
            }
        }
        pressed = {};
        func();
    };

    document.onkeyup = function(e) {
        e = e || window.event;
        delete pressed[e.keyCode];
    };
}


function month2num(name) {
    var month = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    for (var i = 0; i < month.length; i++) {
        if (name.indexOf(month[i]) != -1) {
            var str = (i + 1).toString();
            var pad = "00";
            var ans = pad.substring(0, pad.length - str.length) + str;

            name = name.replace(month[i], ans);
        }
    }
    return name;
}

function parseValue(value, cat) {
    var result = '';
    switch (cat) {
        case 'Date of Birth':
            var birthdate = month2num(value[0].trim());
            value = birthdate.replace(/[\:\.\-\;\|\"\'\*\?\\\/<>\+\n\t\r ]/g, "^").split('^').join('.');
            break;
        case 'Phone':
            value = value.join(',').trim().replace(/[^0-9\+\,]/g, "");
            break;
        case 'Salary':

            if (isNaN(parseInt(value[0].trim().replace(/[^0-9]/iug, ""))))
                value = '0';
            else
                value = value[0].trim().replace(/[^0-9]/iug, "");
            break;
        default:
            value = value.join(',').replace(/((\n)+)/gm, ",");
            break;
    }
    if (['Full name', 'Name', 'Surname', 'Date of Birth', 'Skills', 'Position'].indexOf(cat) == -1)
        result = value.replace(/[\:\.\;\|\"\'\*\?\\\/<>\n\t\r\=]/g, "^").split('^').join(',').replace(/((,)+)/gm, ",");
    else
        result = value;

    return result;
}
