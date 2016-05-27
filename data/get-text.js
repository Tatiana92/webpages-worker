var textArea = document.getElementById("result-list");
var resultArea = document.getElementById("result");
var findText = document.getElementById("edit-box");
var dir = document.getElementById("finding-dir");
var lbl = document.getElementById('res-count');
var isKeyword = document.getElementById('find-keywords');
var isStrict = document.getElementById('find-strict');
var findBtn = document.getElementById("find");
// make eventlisteners. they will send info for finding
findBtn.addEventListener('click', submit, false);
document.addEventListener('keyup', function(event) {
    if (event.keyCode == 13)
        submit();
}, false);

isKeyword.addEventListener('click', keywordsOnchange, false);

function submit() {
    if (dir.value.length > 0 || isKeyword.checked) {
        var data = {
            'text': findText.value,
            'dir': dir.value,
            'strictFind': isStrict.checked,
            'keyword': isKeyword.checked
        }
        self.port.emit("text-entered", JSON.stringify(data));
    }
}

function keywordsOnchange() {
    if (isKeyword.checked) {
        isStrict.checked = '';
        isStrict.disabled = true;
    } else {
        isStrict.disabled = false;
    }
}
self.port.on("show", function onShow() {
    findText.focus();
    dir.value = localStorage.getItem('webpages-dir');
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
    textArea.value = JSON.parse(text)['result'];
    lbl.innerHTML = JSON.parse(text)['count'];
});
