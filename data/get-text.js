var textArea = document.getElementById("result-list");
var resultArea = document.getElementById("result");
var findText = document.getElementById("edit-box");
var dir = document.getElementById("finding-dir");
var lbl = document.getElementById('res-count');
var findBtn = document.getElementById("find");

function submit() {
  if (dir.value.length > 0) {
    var data = {
      'text': findText.value,
      'dir': dir.value
    }
    self.port.emit("text-entered", JSON.stringify(data));
  }
}

// make eventlisteners. they will send info for finding
findBtn.addEventListener('click', submit, false);
document.addEventListener('keyup', function(event) {
  if (event.keyCode == 13)
    submit();
}, false);

self.port.on("show", function onShow() {
  findText.focus();
});

// find is over. we will put result in textarea
self.port.on("end-of-find", function(text) {
  //resultArea.style.display = 'block';
  textArea.value = JSON.parse(text)['result'];
  lbl.innerHTML  = JSON.parse(text)['count'];
});