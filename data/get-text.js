try {
    var textArea = document.getElementById("result-list");
    var resultArea = document.getElementById("result");
    var findText = document.getElementById("edit-box");
    var dir = document.getElementById("finding-dir");
    var lbl = document.getElementById('res-count');
    var keywordTab = document.getElementById('keywords');
    var isStrict = document.getElementById('find-strict');
    var findBtn = document.getElementById("find");
    var keywordsTable = document.getElementById("resume-keys");
    var addClauseImage = document.getElementById("add-clause");

    //set listeners for DOM objects
    var tabs = document.getElementsByClassName('tablinks');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function(evt) { openTab(evt); }, false);
    }
    findBtn.addEventListener('click', submit, false);
    addClauseImage.addEventListener('click', addRow, false);
    document.getElementById('close-btn').addEventListener('click', closeWindow, false);
    document.getElementsByClassName('close-icon')[0].addEventListener('click', closeWindow, false);
    document.getElementsByClassName('menu-icon')[0].addEventListener('click', goToMenu, false);
    //prepare panel(getting tablecontent(for select categories),choosing tab, adding row)
    //row: select with categories, select with operands, input for user's value, delete row button/
    var tableContent = self.options.tableContent;
    keywordTab.click();
    addRow();
} catch (err) {
    alert('There was error: '+ err.message +';\n' +  err.stack);
}


//port listeners
self.port.on("show", function onShow() {
    dir.value = localStorage.getItem('webpages-dir');
});

self.port.on('error', function(text) {
    alert(text);
});

self.port.on('bad-dir', function() {
    alert('Invalid dir for find!');
});

self.port.on('good-dir', function(text) {
    localStorage.setItem('webpages-dir', text);
    dir.value = text;
});
// find is over. we will put result in textarea
self.port.on("end-of-find", function(text) {
    setInfo(JSON.parse(text)['result'], JSON.parse(text)['count']);
});


//functions
function closeWindow() {
    self.port.emit("close-window");
}

function goToMenu() {
    self.port.emit('main-menu', '');
}

/*When you want to start finding, you need to click find button,and then submit function will started.
Here we checked,if you want to find keywords, if no - you need to type dirpath. 
if you want to find by keywords - we call getKeywords function.*/
function submit() {
    var data;
    var isKeyword = (keywordTab.className.indexOf('active') != -1);
    var strictFind = isStrict.checked && (keywordTab.className.indexOf('active') == -1);
    var text = keywordTab.className.indexOf('active') == -1 ? findText.value : getKeywords();
    if (dir.value.length > 0 || isKeyword) {
        if (document.getElementsByClassName('error-input').length <= 0) {
            data = {
                'text': text,
                'dir': dir.value,
                'strictFind': strictFind,
                'keyword': isKeyword
            }
            self.port.emit("text-entered", JSON.stringify(data));
        } else {
            alert('Bad value for date! We need in YYYY.MM.DD format');
        }
    } else {
        alert('Invalid dir for find!');
    }
}

/*this function prepares keywords dictionary. in this dict categories are keys,
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
TODO

think about date search!it's difficult,because we need to decide date format.I mean, DD.MM.YYYY or MM.DD.YYYY or other way/

*/
function getKeywords() {
    var result = {};
    var selectCat = keywordsTable.getElementsByClassName('select-categories');
    var selectOper = keywordsTable.getElementsByClassName('select-operations');
    var inputArr = keywordsTable.getElementsByTagName('INPUT');


    for (var i = 0; i < selectCat.length; i++) {
        if (result[selectCat[i].value] == undefined)
            result[selectCat[i].value] = [];
        var info = { 'operand': 'LIKE', 'value': '' };
        for (var j = 0; j < selectOper.length; j++) {
            if (selectCat[i].name == selectOper[j].name) {
                info['operand'] = selectOper[j].value;
            }
        }
        for (var j = 0; j < inputArr.length; j++) {
            if (selectCat[i].name == inputArr[j].name) {
                if (selectCat[i].value.toLowerCase().indexOf('date') != -1) {
                    //var from = "10-11-2011"; 
                    //var numbers = inputArr[j].value.match(/\d+/g); 
                    //var date = new Date(numbers[2], numbers[0]-1, numbers[1]);
                    info['value'] = inputArr[j].value.trim();
                    break;
                }
                info['value'] = inputArr[j].value.trim();
            }
        }
        result[selectCat[i].value].push(info);
    }
    return result;
}

function deleteRow(event) {
    var tr = event.target;
    while (tr.tagName != 'TR') {
        tr = tr.parentElement;
    }
    tr.remove();
}

function fillingSelect(selectElem, list) {
    for (var i = 0; i < list.length; i++) {
        var option = document.createElement("option");
        option.value = list[i];
        option.text = list[i];
        selectElem.appendChild(option);
    }
}

/*when selected category it fills select with operands.
it calls fillingSelect function*/
function onSelectChange(e) {
    var rowIndividualName = e.target.name;
    var arr = document.getElementsByName(rowIndividualName);
    var input, operand;
    var list = ['=', '>', '<', '!=', '>=', '<='];

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].tagName == 'INPUT')
            input = arr[i];
        if (arr[i].className == 'select-operations')
            operand = arr[i];
    }

    while (operand.children.length > 0) {
        operand.remove(0);
    }
    input.removeEventListener('keyup', checkDate, false);
    deleteError(input);
    input.value = '';
    if (e.target.value.toLowerCase().indexOf('date') != -1) {
        input.type = 'date';
        input.placeholder = 'ГГГГ.ММ.ДД';
        fillingSelect(operand, list);

        input.addEventListener('keyup', checkDate, false);
        return;
    }
    input.type = 'text';
    input.placeholder = '';
    if (e.target.value.toLowerCase().indexOf('salary') != -1) {
        list = ['=', '>', '<', '<>', '>=', '<='];
    } else {
        list = ['LIKE', '=', '<>']; // all other categories - not salary and not date
    }
    fillingSelect(operand, list);
}


function checkDate(evt) {
    var value = evt.target.value.replace(/\./g, "-");
    if (isNaN(Date.parse(value)) && value.length > 0) {
        setError(evt.target);
    } else {
        deleteError(evt.target);
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

/*this function adds row in keyword table. One row for one condition*/
function addRow() {
    var rowIndividualName = (new Date()).toTimeString();

    var tr = document.createElement('tr');
    keywordsTable.appendChild(tr);


    var td = document.createElement('td');
    var selectList = document.createElement('select');
    var option = document.createElement("option");
    option.value = 'all_cat';
    option.text = 'All categories';
    selectList.appendChild(option);

    for (var i in tableContent) {
        option = document.createElement("option");
        option.value = i;
        option.text = i;
        selectList.appendChild(option);
    }
    selectList.name = rowIndividualName;
    selectList.setAttribute('class', 'select-categories');
    selectList.addEventListener('change', onSelectChange, false);
    td.appendChild(selectList);
    tr.appendChild(td);


    var td1 = document.createElement('td');
    var list = ['LIKE', '=', '<>'];
    var selectOperand = document.createElement('select');

    selectOperand.name = rowIndividualName;
    selectOperand.setAttribute('class', 'select-operations');
    fillingSelect(selectOperand, list);
    td1.appendChild(selectOperand);
    tr.appendChild(td1);


    var td2 = document.createElement('td');
    var elem = document.createElement('input');

    elem.type = 'text';
    elem.name = rowIndividualName;
    td2.appendChild(elem);
    tr.appendChild(td2);


    var td3 = document.createElement('td');
    var deleteImage = document.createElement('span');

    deleteImage.setAttribute('title', "Delete this clause");
    deleteImage.className = "del-clause";
    deleteImage.addEventListener('click', deleteRow, false);
    td3.appendChild(deleteImage);
    td3.setAttribute('style', 'width: 30px;');
    tr.appendChild(td3);
}

function setInfo(links, count) {
    var parentDiv = document.getElementById("result-list");
    lbl.innerHTML = count;
    while (parentDiv.children.length > 0) {
        parentDiv.removeChild(parentDiv.children[0]);
    }
    if (count == 0) {
        alert('No files.\n', links.join(','));
        return;
    }
    for (var i = 0; i < links.length; i++) {
        var newitem = document.createElement('div');
        newitem.className = "block-item";
        newitem.setAttribute('title', links[i]);
        newitem.value = links[i];
        newitem.innerText = links[i];

        parentDiv.appendChild(newitem);
        newitem.addEventListener('click', function(e) {
            self.port.emit('open-file', this.value);
        }, false)
    }
}

function openTab(evt) {
    var i, tabcontent, tablinks;
    var tabId = evt.target.id;
    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tabcontent.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabId + '-block').style.display = "block";
    evt.currentTarget.className += " active";
    setInfo('', 0);
}
