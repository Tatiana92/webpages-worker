try {
    var importDir = document.getElementById("import-dir");
    var chosenFiles = document.getElementById("chosen-files");
    var dir = document.getElementById("saving-dir");
    var resultArea = document.getElementById("result-list");
    var importBtn = document.getElementById("import");
    var divLoading = document.getElementById('divLoading');
    var savingFileLabel = document.getElementById('saving-file');
    var filesNum = 0;
    // make eventlisteners.
    importBtn.addEventListener('click', submit, false);
    importDir.addEventListener('change', onAddFiles, false);
    document.getElementById('close-btn').addEventListener('click', closeWindow, false);
    document.getElementsByClassName('close-icon')[0].addEventListener('click', closeWindow, false);
    document.getElementsByClassName('menu-icon')[0].addEventListener('click', goToMenu, false);
    //dir.value = 'C:\\Users\\tatyana_c\\Desktop\\addon';
} catch (err) {
    alert('There was error: '+ err.message +';\n' +  err.stack);
}


//port listeners
self.port.on('error', function(text) {
    filesNum--;
    createResultItem(text, false);
    if (filesNum <= 0) {
        divLoading.className = divLoading.className.replace(" show", "");
        importBtn.disabled = false;
    }
});
//port listeners
self.port.on("show", function onShow() {
    dir.value = localStorage.getItem('webpages-dir');
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
    if (filesNum <= 0) {
        divLoading.className = divLoading.className.replace(" show", "");
        importBtn.disabled = false;
    }
});


/*functions*/
function goToMenu() {
    self.port.emit('main-menu', '');
}

function closeWindow() {
    self.port.emit("close-window");
    while (resultArea.children.length > 0) {
        resultArea.removeChild(resultArea.children[0]);
    }
    chosenFiles.innerHTML = 0;
}

/*value - filename or error message with filename
state - error or success.false\true*/
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


function submit() {
    if (importDir.files.length > 0) {
        var data = [];
        for (var i = 0; i < importDir.files.length; i++) {
            data.push({'name': importDir.files[i].name, 'data': URL.createObjectURL(importDir.files[i])});
        }
        filesNum = data.length;
        importBtn.disabled = true;
        divLoading.className += " show";
        self.port.emit("import", JSON.stringify({ 'files': data, 'dir': dir.value }));
        while (resultArea.children.length > 0) {
            resultArea.removeChild(resultArea.children[0]);
        }
    } else {
        alert('Invalid dir for save!');
    }
}
