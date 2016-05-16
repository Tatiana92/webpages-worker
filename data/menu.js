var menu = document.getElementsByClassName("menu-item");
for (var i = 0; i < menu.length; i++){
	menu[i].addEventListener('click', select, false);
}

function select(event) {
	self.port.emit('click-link', event.currentTarget.id);
}
