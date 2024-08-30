const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const {apparateVideo} = require('./apparate');

var config;
var savePath;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      devTools: false
    },
  });
  mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

//Config Setup
if (!fs.existsSync(app.getPath('userData'))) {
  fs.mkdirSync(app.getPath('userData'));
}

if (fs.existsSync(path.join(app.getPath('userData'), path.sep, 'config.json'))) {
  //If exists, read from it.
  config = fs.readFileSync(path.join(app.getPath('userData'), path.sep, 'config.json'))
  config = JSON.parse(config);
  savePath = config.saveURL;
}
else {
  //Else write a default
  let configPath = path.join(app.getPath('userData'), path.sep, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(
    {
      saveURL: app.getPath("music")
  }))

  config = fs.readFileSync(path.join(app.getPath('userData'), path.sep, 'config.json'))
  config = JSON.parse(config);
  savePath = config.saveURL;
}

ipcMain.handle('apparate', async (e, data) => {
  data.fileName = sanitizePath(data.fileName);
  await apparateVideo({url: data.url, fileName: data.fileName, path: savePath});
  return 0;
})

ipcMain.handle('writeFile', (e, data) => {
  data.path = sanitizePath(data.path);
  let pathToWrite = path.join(savePath, data.path + '.webm');
  var stream = fs.createWriteStream(pathToWrite);
  stream.write(Buffer.from(data.data));
  stream.end();

  ipcMain.send('renderDone', {});
});

ipcMain.handle('writeFileAppend', (e, data) => {
  data.path = sanitizePath(data.path);
  let pathToWrite = path.join(savePath, data.path + '.webm');
  var stream = fs.createWriteStream(pathToWrite, {flags: 'a'});
  stream.write(Buffer.from(data.data));
  stream.end();
});

ipcMain.handle('newConfig', () => {
  //set new config path
  dialog.showOpenDialog({ title: 'Select Output Directory...', properties: ["openDirectory"] }).then ((dir) => {
    let configPath = path.join(app.getPath('userData'), '/config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      saveURL: dir.filePaths[0]
    }));

    config = fs.readFileSync(path.join(app.getPath('userData'), '/config.json'))
    config = JSON.parse(config);
    savePath = config.saveURL;
  });
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function sanitizePath(p) {
  p = p.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
  return p.trim();
}