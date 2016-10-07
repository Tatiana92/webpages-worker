try {
    var menu = document.getElementsByClassName("block-item");
    var dir = document.getElementById("db-dir");

    for (var i = 0; i < menu.length; i++) {
        menu[i].addEventListener('click', select, false);
    }

    document.getElementsByClassName('hide-icon')[0].addEventListener('click', closeWindow, false);
} catch (err) {
    alert('There was error: '+ err.message +';\n' +  err.stack);
}


self.port.on("show", function onShow() {
    dir.value = 'C:\\Users\\tatyana_c\\Desktop\\for addon';
    //dir.value = localStorage.getItem('database-dir');
});

self.port.on('bad-dir', function() {
    alert('Invalid path to database!');
});

self.port.on('good-dir', function(text) {
    localStorage.setItem('database-dir', text);
    dir.value = localStorage.getItem('database-dir');
});

self.port.on('error', function(text) {
    alert(text);
});


function closeWindow() {
    self.port.emit("hide-window");
}

function select(event) {
    var data = {
        'dir': dir.value,
        'menuItem': event.currentTarget.id
    }
    self.port.emit('click-link', JSON.stringify(data));
}
