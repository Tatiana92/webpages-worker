/*debugger;
self.port.emit("save-data", unescape(encodeURIComponent(document.documentElement.outerHTML)));*/
var content = unescape(encodeURIComponent(document.documentElement.outerHTML));
content = '<meta charset="utf-8"/>' + content;
var base64doc = btoa(content),
    a = document.createElement('a');
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

var filename = date.toLocaleString("en-US", options).replace(/(\:|\.)/g,"-") + '.html';
if (document.title.trim().length > 0) {
	filename = document.title.trim() + '.html';
}
a.download = filename;
a.href = 'data:text/html;base64,' + base64doc;
var e = new MouseEvent('click', {'bubbles': true,'cancelable': false});
a.dispatchEvent(e);