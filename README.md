#webpages-worker
This add-on can save webpages and find some info in *.html files.
You can click at add-on icon, and see main menu. Then choose menu item please.
If your choice - 'save page' - it'll start saving active page.
If you want to find *.html files with some specific text - you need to choose 'Find text in pages' item.
Then you'll see panel, and you can type text and directory with *.html files, and press button 'Find', please.
If everything is ok, you'll see result in textarea below.

So, 'menu.html' represents popup menu for add-on icon.'menu.js' contains some code for menu events(click items) processing.
'menu.css' contains style for main menu. 'menu.js' is content script for menu panel.
There is some downloading code in 'saving.js'.
'get-text.html' is form for finding text panel, and 'get-text.js' has some code 
for getting and setting info from this panel and form events processing.
'get-text.js' is content script for finding panel.
'index.js' has code for creating main add-on button and managing all add-on panels/