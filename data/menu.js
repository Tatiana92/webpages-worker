var menu = document.getElementsByClassName("menu-item");
var dir = document.getElementById("db-dir");
for (var i = 0; i < menu.length; i++){
	menu[i].addEventListener('click', select, false);
}
function select(event) {
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