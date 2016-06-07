var content = unescape(encodeURIComponent(document.documentElement.outerHTML));
content = '<meta charset="utf-8"/>' + content;
var keywords = '';
var date = new Date();
var options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
};
var table_indx = 0;

var filename = date.toLocaleString("en-US", options);
if (document.title.trim().length > 0) {
	filename = document.title.trim();
  keywords = filename.replace(/[\:\.\|\"\*\?\\\/<>\+]/g," ").split(' ').join(',');
}
keywords += ',' + document_keywords();
filename = filename.replace(/[\:\.\|\"\*\?\\\/<>\+]/g,"-") + '.html';
var data = {
	'filename': filename,
	'content': content,
    'keywords': keywords,
    'analyzeText': document.documentElement.innerText
};

if (self.options.asResume == true) {
    if (document.location.href.indexOf('hh.ru/resume') != -1) {
        for (var i in self.options.table) {
            if (self.options.table[i]['value'] == undefined)
                self.options.table[i]['value'] = [];
            if (i.toLowerCase().indexOf('дата') != -1) {
                var elemArr = document.querySelectorAll(self.options.table[i]['hhselector']);
                for (var j = 0; j < elemArr.length; j++) {
                    self.options.table[i]['value'].push(elemArr[j].content);
                }
                continue;
            }
            if (i.indexOf('занятость') != -1) {
                var elem = document.querySelectorAll(self.options.table[i]['hhselector'])[0];
                if (elem)
                    if (elem.parentNode.nextSibling) {
                        var myVal = elem.parentNode.nextSibling.innerText;
                        if (myVal.toLowerCase().indexOf('занятость') != -1) {
                            myVal = myVal.substr('занятость'.length + 1, myVal.length);
                        }
                        self.options.table[i]['value'].push(myVal);
                    }
                continue;
            }
            if (i.indexOf('работы') != -1) {//- Места работыfor (var row = 0; row<arr.length; row++) {
                var arr = document.querySelectorAll("[data-qa='resume-block-experience']");
                for (var j = 0; j < arr.length; j++) {
                    var tmparr = arr[j].querySelectorAll("[class='resume-block-item-gap']");
                    for (var row = 0; row < tmparr.length; row++) {
                        var children3 = tmparr[row].querySelectorAll("[class='resume-block-right-column']");
                        self.options.table[i]['value'].push(children3[0].innerText.substr(0, 1000));
                    }
                }
                continue;
            }
            var elemArr = document.querySelectorAll(self.options.table[i]['hhselector']);
            for (var j = 0; j < elemArr.length; j++) {
                self.options.table[i]['value'].push(elemArr[j].innerText.substr(0, 1000));
            }
        }
        data['keywords'] = self.options.table;
        data['ishh'] = true;
        sendData(data);
    } else {
        if (confirm("this website is not HeadHunter. Our add-on can't parse this page. Do you want select keywords for resume by yourself?It can take some minutes."))
        {
            data['keywords'] = '';
            data['ishh'] = false;
            sendData(data);
            runOnKeys(showSelection, "S".charCodeAt(0));

        } else {
            alert("We'll save this webpage as usual webpage");
            self.options.asResume = false;
            self.options.table = keywords;
            data['keywords'] = self.options.table;
            data['ishh'] = false;
            sendData(data);
        }
    }
} else {
    sendData(data);
}
function document_keywords(){
    var keywords = '';
    var metas = document.getElementsByTagName('meta');

    for (var x = 0,y = metas.length; x < y; x++) {
        if (metas[x].name.toLowerCase() == "keywords") {
            keywords += metas[x].content;
        }
    }
    return keywords;// != '' ? keywords : false;
}

function runOnKeys(func) {
    var codes = [].slice.call(arguments, 1);

    var pressed = {};

    document.onkeydown = function(e) {
        e = e || window.event;

        pressed[e.keyCode] = true;

        for (var i = 0; i < codes.length; i++) { // проверить, все ли клавиши нажаты
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
function showSelection() {
    var selection = window.getSelection();
    self.port.emit("save-item", selection.toString());
}

function sendData(data) {
    data['asResume'] = self.options.asResume;

    self.port.emit("save-data", JSON.stringify(data));
}

