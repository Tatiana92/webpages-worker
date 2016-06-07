var menu = document.getElementsByClassName("block-item");
var dir = document.getElementById("db-dir");
for (var i = 0; i < menu.length; i++){
	menu[i].addEventListener('click', select, false);
}

document.getElementById('hide-icon').addEventListener('click', closeWindow, false);

function closeWindow() {
    self.port.emit("hide-window");
}
function select(event) {
	/*if (event.currentTarget.id == 'superjob'){
		sjAuth();
		return;
	}*/
	var data = {
		'dir': dir.value,
		'menuItem': event.currentTarget.id
	}
	self.port.emit('click-link', JSON.stringify(data));
}


self.port.on("show", function onShow() {
    dir.value = localStorage.getItem('database-dir');
});

self.port.on('bad-dir', function() {
	alert('Invalid path to database!');
})

self.port.on('good-dir', function(text) {
	localStorage.setItem('database-dir', text);
	dir.value = localStorage.getItem('database-dir');
})