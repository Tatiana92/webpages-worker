var textArea = document.getElementById("keywords-list");
var dir = document.getElementById("saving-dir");
var lbl = document.getElementById('res-count');
var saveBtn = document.getElementById("save");

// make eventlisteners. they will send info for finding
saveBtn.addEventListener('click', submit, false);
document.addEventListener('keyup', function(event) {
    if (event.keyCode == 13)
        submit();
}, false);


function submit() {
    if (dir.value.length > 0) {
        var data = {
            'keywords': textArea.value,
            'dir': dir.value
        }
        self.port.emit("saving-text-entered", JSON.stringify(data));
    }
}

self.port.on("take-keywords", function(text) {
    textArea.value = text;
});

self.port.on('bad-dir', function() {
    alert('Invalid dir for save!');
});

self.port.on('good-dir', function(text) {
    localStorage.setItem('webpages-dir', text);
    dir.value = text;
});

self.port.on("show", function onShow() {
    dir.value = localStorage.getItem('webpages-dir');
});

self.port.on("saved", function onShow() {
    alert('Webpage saved successfully!');
});
