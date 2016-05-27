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
self.port.emit("save-data", JSON.stringify(data));
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