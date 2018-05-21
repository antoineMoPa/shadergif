const {app, BrowserWindow, Menu, MenuItem, SubMenu, dialog, ipcMain} = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');
const version = require('./package.json').version;

function createWindow () {
	// Create the browser window.
	win = new BrowserWindow({width: 1200, height: 800});
	
	const template = [{
		'label': 'File',
		'submenu': [
			{
				label: 'Save',
				accelerator: 'CmdOrCtrl+S',
				click: on_save_button
			},
			{
				label: 'Open',
				accelerator: 'CmdOrCtrl+O',
				click: on_open_button
			}
		]
	}, {
		'label': 'Help',
		'submenu': [
			{label: 'Version: ' + version},
			{
				label: 'Toggle Dev Tools',
				accelerator: 'Ctrl+Shift+I',
				role: 'toggleDevTools',
				click: () => {
					win.webContents.toggleDevTools();
				}
			}
		]
	}];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
	
	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true
	}));
}

function on_save_button(){
	dialog.showSaveDialog(function (filePath) {
		if (filePath === undefined) {
			return;
		}
		win.webContents.send('code-request', filePath);
	});
}

ipcMain.on('code-return', (event, code, lang, filePath) => {
	console.log(code, lang, filePath);
	fs.writeFile(filePath, code, function (err) {
		if (err === undefined || err == null) {
			dialog.showMessageBox({
				message: 'The file has been saved!',
				buttons: ['OK']
			});
		} else {
			dialog.showErrorBox('File save error', err.message);
		}
	});
});

function on_open_button(){
	dialog.showOpenDialog(function (filePaths) {
		if(typeof(filePaths) == 'undefined' || filePaths.length == 0){
			return;
		}
		var filePath = filePaths[0];
		try {
			var file = fs.readFileSync(filePath, 'utf-8');
			win.webContents.send('code-set', file);
		} catch (err) {
			console.log('Error reading the file: ' + JSON.stringify(err));
		}
	});
}


app.on('ready', createWindow);
