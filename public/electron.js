const path = require('path')
const net = require('net')

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const isDev = require('electron-is-dev')

// TODO: Add services in here (relay instances, overlay instances)

// API: https://dev-api.rocketcast.io
// Prod: https://api.rocketcast.io

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    minHeight: 500,
    minWidth: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#324044',
      symbolColor: '#3fd294',
      height: 35,
    },
    frame: false,
    title: 'Rocketcast',
    backgroundColor: '#333',
  })

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`,
  )

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Grab server .exe from Serverless API, then assign a random port to it on launch
// rocketcast-server.exe <PORT>
ipcMain.handle('spawn-server', async (event) => {
  const port = await getOpenPort()
  console.log('Spawning server on port ' + port)
  return true
})

ipcMain.handle('stop-server', async (event, args) => {})
ipcMain.handle('get-servers', async (event, args) => {})

ipcMain.handle('get-overlays', async (event, args) => {})
ipcMain.handle('download-overlay', async (event, args) => {})
ipcMain.handle('search-overlay', async (event, args) => {})

ipcMain.handle('update-plugin', async (event, args) => {})

ipcMain.handle('run-at-startup', async (event, state) => {
  const appFolder = path.dirname(process.execPath)
  const updateExe = path.resolve(appFolder, '..', 'Update.exe')
  const exeName = path.basename(process.execPath)

  app.setLoginItemSettings({
    openAtLogin: state,
    path: updateExe,
    args: [
      '--processStart',
      `"${exeName}"`,
      '--process-start-args',
      `"--hidden"`,
    ],
  })

  return state
})

ipcMain.handle('get-version', (event) => app.getVersion())

// Listening to port 0 always gives a unique open port from kernel
const getOpenPort = async () => {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, () => {
      const port = srv.address().port
      srv.close((err) => resolve(port))
    })
  })
}
