var importDir = document.getElementById("import-dir");
var chosenFiles = document.getElementById("chosen-files");
var dir = document.getElementById("saving-dir");
var resultArea = document.getElementById("result-list");
var importBtn = document.getElementById("import");
var divLoading = document.getElementById('divLoading');
var filesNum = 0;
// make eventlisteners.
importBtn.addEventListener('click', submit, false);
importDir.addEventListener('change', onAddFiles, false);
document.getElementById('close-icon').addEventListener('click', closeWindow, false);
document.getElementById('close-btn').addEventListener('click', closeWindow, false);
dir.value = 'C:\\Users\\tatyana_c\\Desktop\\addon';

//port listeners
self.port.on('error', function(text) {
    filesNum--;
    /*var res = resultArea.value.split('\n');
    res.push(text);
    resultArea.value = res.join('\n'); */
    createResultItem(text, false);
    //alert(text);
    if (filesNum <= 0){
        divLoading.className = divLoading.className.replace(" show", "");
        importBtn.disabled = false;
    }
});

self.port.on('bad-dir', function() {
    alert('Invalid dir for save!');
    divLoading.className = divLoading.className.replace(" show", "");
    importBtn.disabled = false;
});

self.port.on('good-dir', function(text) {
    localStorage.setItem('webpages-dir', text);
    ////dir.value = text;
});

self.port.on("imported", function(text) {
    filesNum--;
    createResultItem(text, true);
    //alert('Webpages imported successfully!' + text);
    if (filesNum <= 0){
        divLoading.className = divLoading.className.replace(" show", "");
        importBtn.disabled = false;
    }
});

//value - filename or error message with filename
//state - error or success.false\true
function createResultItem(value, state) {
    var newitem = document.createElement('div');
    newitem.setAttribute('title', value);
    newitem.value = value;
    newitem.title = value;
    newitem.innerText = value;
    newitem.className = "block-item";

    resultArea.appendChild(newitem);
    if (state) {
        newitem.addEventListener('click', function(e) {
            self.port.emit('open-file', this.value);
        }, false);
    } else {
        newitem.className += " crashed";
    }

}

function onAddFiles(evt) {
    chosenFiles.innerHTML = importDir.files.length;
}
function closeWindow() {
    self.port.emit("close-window");
}


function submit() {
    if (importDir.files.length > 0) {
        var data = [];
        for (var i = 0; i < importDir.files.length; i++) {
            data.push(URL.createObjectURL(importDir.files[i]));
        }
        filesNum = data.length;
        importBtn.disabled = true;
        divLoading.className += " show";
        self.port.emit("import", JSON.stringify({'files': data, 'dir': dir.value}));
        while (resultArea.children.length > 0) {
            resultArea.removeChild(resultArea.children[0]);
        }
    }
}


function setFocus(elem) {
    var focusedElems = document.getElementsByClassName('focused');

    for (var i = 0; i < focusedElems.length; i++) {
        focusedElems[i].className = focusedElems[i].className.replace(" focused", "");
    }
    elem.focus();
    elem.className += ' focused';
}

function month2num(name) {
    var month = ['января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'];

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
            value = birthdate.replace(/[\:\.\-\;\|\"\'\*\?\\\/<>\+\n\t\r ]/g,"^").split('^').join('.');
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
    if (['Full name', 'Date of Birth','Skills', 'Position'].indexOf(cat) == -1)
        result = value.replace(/[\:\.\;\|\"\'\*\?\\\/<>\+\n\t\r\=]/g,"^").split('^').join(',').replace(/((,)+)/gm, ",");
    else
        result = value;

    return result;
}
