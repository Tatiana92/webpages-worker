var tabs = require("sdk/tabs");
var self = require("sdk/self");
var data = self.data;
var { ToggleButton } = require('sdk/ui/button/toggle');
var panels = require("sdk/panel");
var fileIO = require("sdk/io/file");

var button = ToggleButton({
  id: "webpages",
  label: "Works with webpages",
  icon: "./icon/main-icon.png",
  onChange: handleChange
});


var panel = panels.Panel({
  contentURL: data.url("menu.html"),
  contentScriptFile: data.url("menu.js"),
  onHide: handleHide
});

panel.port.on("click-link", function(menuItem) {
  switch (menuItem) {
    case 'save':
      savePage();
      break;
    case 'find':
      findClick();
      break;
  }
});

function savePage(state) {
  var saving = tabs.activeTab.attach({
    contentScriptFile: data.url("saving.js")
  });
  saving.port.on("save-data", function(text) {
    var working_dir = 'C:\\Users\\tatyana_c\\Downloads\\';
    var ByteWriter = fileIO.open(working_dir + 'doc215.html', "wb");
    if (!ByteWriter.closed) {
      ByteWriter.write(text);
      ByteWriter.close();
    }
  });
}


var text_entry = panels.Panel({
  contentURL: data.url("get-text.html"),
  contentScriptFile: data.url("get-text.js")
});

// Show the panel when the user clicks the button.
function findClick(state) {
  text_entry.show();
}

// When the panel is displayed it generated an event called
// "show": we will listen for that event and when it happens,
// send our own "show" event to the panel's script, so the
// script can prepare the panel for display.
text_entry.on("show", function() {
  text_entry.port.emit("show");
});

function findText(text) {
  var result = [], count = 0;
  try {
    var data = JSON.parse(text);  //user's data - text and dir
    let path = data['dir'];  //user's dir
    path = path.replace(/((\\)+|(\/)+)/gm,"\\\\");
    //console.log('data', data['dir'], 'path', path);
    try {
      fileIO.exists(path);
    } catch(e) {
      path = path.replace(/((\\)+)/gm,"\/");
      //console.log('unix path', path);
    }
    if (fileIO.exists(path)) {
      let list = fileIO.list(path);  //files in dir, their names
      for (i = 0; i < list.length; i++) {   //look at all files
        let item = fileIO.join(path, list[i]);    //full path, dir + name
        if (fileIO.isFile(item) && (list[i].indexOf(".html") == list[i].length - ".html".length)) {

          let TextReader = fileIO.open(item, "r");
          if (!TextReader.closed) {
            let text = '';
            do {
              text = TextReader.read(1024);
              if (text.toLowerCase().indexOf(data['text'].toLowerCase()) != -1) {
                //console.log(item + 'FINDED!!!!!!!');
                result.push(item);
                count++;
                break;
              }
            } while (text.length > 0);
            TextReader.close();
          }
          /*if (fileIO.read(item).indexOf(data['text']) != -1) {
            console.log(item + 'FINDED!!!!!!!');
            result.push(item);
          }*/

        }
      }
    } else {
      result.push('Path does not exist');
    }
    if (result.length == 0) {
      result.push('No matches found');
    }
  } catch(e) {
    result.push('It was problems with path: ' + e);
  }
  //console.log('finded', result);

  var data = {
    'result': result.join('\n'),
    'count': count
  }
  text_entry.port.emit("end-of-find", JSON.stringify(data));
}

// Listen for messages called "text-entered" coming from
// the content script.
text_entry.port.on("text-entered", findText);



function handleChange(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
  }
}

function handleHide() {
  button.state('window', {checked: false});
}
