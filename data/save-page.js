try {
    var textArea = document.getElementById("keywords-list");
    var dir = document.getElementById("saving-dir");
    var lbl = document.getElementById('res-count');
    var saveBtn = document.getElementById("save");
    var keywordsTable = document.getElementById("resume-keys");
    var divLoading = document.getElementById('divLoading');
    var tableContent;
    // make eventlisteners.
    saveBtn.addEventListener('click', submit, false);
    document.getElementById('close-btn').addEventListener('click', closeWindow, false);
    document.getElementsByClassName('close-icon')[0].addEventListener('click', closeWindow, false);
    document.getElementsByClassName('menu-icon')[0].addEventListener('click', goToMenu, false);
} catch (err) {
    alert('There was error: '+ err.message +';\n' +  err.stack);
}


//port listeners

self.port.on("show", onShow);

self.port.on('error', function(text) {
    alert(text);
    divLoading.className = divLoading.className.replace(" show", "");
    saveBtn.disabled = false;
});

self.port.on('bad-dir', function() {
    alert('Invalid dir for save!');
    divLoading.className = divLoading.className.replace(" show", "");
    saveBtn.disabled = false;
});

self.port.on('good-dir', function(text) {
    localStorage.setItem('webpages-dir', text);
    dir.value = text;
});

self.port.on("saved", function() {
    divLoading.className = divLoading.className.replace(" show", "");
    saveBtn.disabled = false;
    alert('Webpage saved successfully!');
});

/*set in inputs info, when user fills resume form by his hands*/
self.port.on('set-item', function(text) {
    var elem = document.activeElement;
    if (elem.tagName == 'INPUT' || elem.tagName == 'TEXTAREA') {
        var name = elem.parentElement.parentElement.children[0].innerText;
        elem.value = parseValue([text, ], name);
        if (name.toLowerCase().indexOf('date') != -1) {
            checkDate(elem);
        }
        if (elem.parentElement.parentElement.nextElementSibling != null) {
            setFocus(elem.parentElement.parentElement.nextElementSibling.children[1].children[0]);
        } else {
            alert("That's all!");
        }
    } else {
        alert('Select input field for this info, please');
    }
});

/*functions*/
function goToMenu() {
    self.port.emit('main-menu', '');
}

function closeWindow() {
    self.port.emit("close-window");
}

/*preparing page when panel is open. Making inputs and filling them by info( if we have info)*/
function onShow() {
    dir.value = localStorage.getItem('webpages-dir');//"C:\\Users\\tatyana_c\\Desktop\\for addon\\addon"

    if (self.options.asResume == true && self.options.tableContent != undefined) {
        tableContent = self.options.tableContent;
        while (keywordsTable.children.length > 0) {
            keywordsTable.removeChild(keywordsTable.children[0]);
        }
        for (var row in tableContent) {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            var elem = document.createElement(tableContent[row]['element']);

            keywordsTable.appendChild(tr);

            td.innerText = row;
            td.setAttribute('style', 'width: 100px;');
            tr.appendChild(td);

            var td2 = document.createElement('td');
            for (var property in tableContent[row]['params']) {
                elem.setAttribute(property, tableContent[row]['params'][property]);
            }
            if (tableContent[row]['value'] == undefined) {
                tableContent[row]['value'] = ['', ];
            }
            elem.value = tableContent[row]['value']; //parseValue(tableContent[row]['value'], row);//;
            tableContent[row]['dom-object'] = elem;
            td2.appendChild(elem);
            tr.appendChild(td2);

            if (keywordsTable.rows.length == 1) {
                setFocus(elem);
            }
            elem.addEventListener('click', function(e) {
                setFocus(e.target);
            }, false);

            if (row.toLowerCase().indexOf('date') != -1) {
                elem.addEventListener('keyup', function(e, value) {
                    checkDate(this);
                }, false);
                checkDate(elem);
            }
        }
        textArea.setAttribute('hidden', true);
        keywordsTable.removeAttribute('hidden');
    } else {
        textArea.value = self.options.keywords;
        keywordsTable.setAttribute('hidden', true);
        textArea.removeAttribute('hidden');
    }
}

function submit() {
    if (dir.value.length > 0) {
        if (document.getElementsByClassName('error-input').length <= 0) {
            var data = {
                'keywords': getValues(),
                'dir': dir.value
            }
            saveBtn.disabled = true;
            divLoading.className += " show";
            self.port.emit("saving-text-entered", JSON.stringify(data));
        } else {
            alert('Bad value for date! We need in YYYY.MM.DD format');
        }
    } else {
        alert('Invalid dir for save!');
    }
}

/*getting info from panel. This info will send to 'server' to db*/
function getValues() {
    var info = {}
    if (self.options.asResume == true) {
        for (var row in tableContent) {
            info[row] = tableContent[row]['dom-object'].value.toLowerCase();
        }
    } else {
        info['Other info'] = textArea.value.toLowerCase();
    }
    return info;
}

/*set focus to input. It helps user to see what field he is filling now(when he makes resume by his hands)*/
function setFocus(elem) {
    var focusedElems = document.getElementsByClassName('focused');

    for (var i = 0; i < focusedElems.length; i++) {
        focusedElems[i].className = focusedElems[i].className.replace(" focused", "");
    }
    elem.focus();
    elem.className += ' focused';
}

function checkDate(elem) {
    var value = elem.value.replace(/\./g, "-");
    if (isNaN(Date.parse(value)) && value.length > 0) {
        setError(elem);
    } else {
        deleteError(elem);
    }
}
function setError(elem) {
    if (elem.className.indexOf('error-input') == -1) {
        elem.className += ' error-input';
    }
}
function deleteError(elem) {
    elem.className = elem.className.replace(/ error-input/g, "");
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
        result = value.replace(/[\:\.\;\|\"\'\*\?\\\/<>\+\n\t\r\=]/g, "^").split('^').join(',').replace(/((,)+)/gm, ",");
    else
        result = value;

    return result;
}
