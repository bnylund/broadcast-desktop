const path = require('path')
const net = require('net')
const https = require('https')
const fs = require('fs')
const { spawn } = require('node:child_process')

const { app, BrowserWindow, shell, ipcMain, autoUpdater } = require('electron')
const isDev = require('electron-is-dev')
const pidusage = require('pidusage')
const { WebSocketServer } = require('ws')
const { v4: uuidv4 } = require('uuid')

// API: https://dev-api.rocketcast.io
// Prod: https://api.rocketcast.io
// TODO: Add services in here (relay instances, overlay instances)
let servers = [],
  overlays = [],
  window

const termReg = new RegExp(
  String.fromCharCode(27) + ']0;(.*?)' + String.fromCharCode(7),
  'g',
)

const appPath =
  process.env.NODE_ENV === 'development'
    ? __dirname
    : `${process.resourcesPath}/app`

console.log('Environment: ' + process.env.NODE_ENV)

// Port needs to stay constant here
const wss = new WebSocketServer({ port: 24158 })

wss.on('connection', (ws) => {
  const id = uuidv4()

  // Populate more information about the overlays eventually
  // Current server, overlay scene, ...
  overlays.push({
    launch: Date.now(),
    obsBrowserVersion: 'Unknown',
    status: 'Unknown',
    scene: {
      name: 'Unknown',
      width: 0,
      height: 0,
    },
    ws,
    id,
  })

  ws.on('message', (data) => {
    if (data.toString().startsWith('UPDATE ')) {
      try {
        let obj = JSON.parse(data.toString().substring(7))

        const overlay = overlays.find((x) => x.id === id)
        if (!overlay) {
          return
        }
        if (obj.status) overlay.status = obj.status
        if (obj.obsBrowserVersion)
          overlay.obsBrowserVersion = obj.obsBrowserVersion
        if (obj.scene) overlay.scene = obj.scene
      } catch (err) {}
    }
  })

  ws.on('close', (code, reason) => {
    // Send notification to window
    overlays = overlays.filter((x) => x.id !== id)
  })
})

// Auto-updater stuff
if (app.isPackaged) {
  const server = 'https://hazel-server-roan.vercel.app'
  const url = `${server}/update/${process.platform}/${app.getVersion()}`

  fs.appendFileSync('log.txt', `feed url: ${url}\n`)

  autoUpdater.setFeedURL({ url })

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 10000)

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Application Update',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail:
        'A new version has been downloaded. Restart the application to apply the updates.',
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 750,
    minHeight: 750,
    minWidth: 1200,
    webPreferences: {
      preload: path.join(appPath, 'preload.js'),
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

  window = win

  if (isDev) {
    win.loadURL('http://localhost:3000')
  } else {
    fs.appendFileSync(
      'log.txt',
      `loading file ${path.join(appPath, 'build/index.html')}\n`,
    )
    win.loadFile(path.join(appPath, 'build/index.html'))
  }

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Grab server .exe from Serverless API, then assign a random port to it on launch
  // rocketcast-server.exe <PORT>
  ipcMain.handle('spawn-server', async (event) => {
    try {
      await downloadServer()
      const port = await getOpenPort()
      console.log('Spawning server on port ' + port)

      const server = spawn('rocketcast-server.exe', [port], {
        cwd: __dirname,
        env: {
          LOG: false,
        },
      })

      servers.push({
        pid: server.pid,
        log: '',
        port,
        stats: {
          cpu: 0,
          memory: 0,
          ppid: process.pid,
          pid: server.pid,
          ctime: 0,
          elapsed: 0,
          timestamp: Date.now(),
        },
      })

      server.stdout.on('data', (data) => {
        process.stdout.write(`[${server.pid}] ${data}`)
        const serv = servers.find((x) => x.pid === server.pid)
        if (serv) {
          serv.log += data
          serv.log = serv.log.replaceAll(termReg, '')
        }
      })

      server.stderr.on('data', (data) => {
        process.stderr.write(`[${server.pid}] ${data}`)
        const serv = servers.find((x) => x.pid === server.pid)
        if (serv) {
          serv.log += `[ERROR] ${data}`
          serv.log = serv.log.replaceAll(termReg, '')
        }
      })

      server.on('close', (code) => {
        console.log(`child process ${server.pid} exited with code ${code}`)
        servers = servers.filter((x) => x.pid !== server.pid)
        win.webContents.send('server-status', {
          server: server.pid,
          status: 'STOPPED',
          code,
        })
      })

      win.webContents.send('server-status', {
        server: server.pid,
        status: 'STARTED',
      })

      return {
        pid: server.pid,
        log: '',
        port,
        stats: {
          cpu: 0,
          memory: 0,
          ppid: process.pid,
          pid: server.pid,
          ctime: 0,
          elapsed: 0,
          timestamp: Date.now(),
        },
      }
    } catch (err) {
      return { error: err }
    }
  })

  ipcMain.handle('stop-server', async (event, id) => {
    if (!id) return false

    const server = servers.find((x) => x.pid === id)
    if (!server) return false

    process.kill(server.pid, 'SIGINT')
    servers = servers.filter((x) => x.pid !== server.pid)
    return true
  })

  ipcMain.handle('get-servers', async (event, args) => {
    // Update server status, then return
    servers = await Promise.all(
      servers.map(async (val) => {
        let stats
        try {
          //console.log(val.pid, await pidusage(val.pid))
          stats = await pidusage(val.pid)
        } catch (err) {}

        return {
          ...val,
          stats,
        }
      }),
    )

    return servers
  })

  // #region Overlays - Future implementation
  ipcMain.handle('get-overlays', async (event, args) => {
    // Exclude WS connection
    return overlays.map((val) => {
      return {
        ...val,
        ws: undefined,
      }
    })
  })
  ipcMain.handle('connect-overlay', async (event, id, server) => {
    const overlay = overlays.find((x) => x.id === id)
    if (!overlay) return false

    if (!overlay.ws) return false

    // If needed, we can also pass in the user's token as another parameter
    // ex. CONNECT <server> [token]
    overlay.ws.send('CONNECT ' + server)
    return true
  })
  ipcMain.handle('download-overlay', async (event, args) => {})
  ipcMain.handle('search-overlay', async (event, args) => {})
  // #endregion

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

const downloadServer = () => {
  return new Promise((resolve, reject) => {
    try {
      try {
        if (fs.existsSync(path.join(__dirname, 'rocketcast-server.exe'))) {
          if (process.env.NODE_ENV === 'development') return resolve()
          fs.unlinkSync(path.join(__dirname, 'rocketcast-server.exe'))
        }
      } catch (err) {
        // Already downloaded and in use
        return resolve()
      }

      window.webContents.send('server-download-status', {
        downloaded: 0,
        size: -1,
        status: 'FETCHING',
      })
      console.log('Fetching products...')
      https.get(
        `${process.env.BACKEND || 'https://dev-api.rocketcast.io'}/v1/products`,
        (res) => {
          res.setEncoding('utf-8')
          let data = ''
          res.on('data', (chunk) => {
            data += chunk
          })
          res.on('end', () => {
            try {
              const jdata = JSON.parse(data)
              console.log('products: ', jdata)

              if (!jdata['rocketcast-server']) {
                return reject(
                  new Error('Rocketcast Server not found in database.'),
                )
              }

              const file = fs.createWriteStream(
                path.join(__dirname, 'rocketcast-server.exe'),
              )

              https.get(jdata['rocketcast-server'].Url, (fres) => {
                fres.pipe(file)

                // after download completed close filestream
                file.on('finish', () => {
                  window.webContents.send('server-download-status', {
                    downloaded: file.bytesWritten,
                    size: jdata['rocketcast-server'].Size,
                    status: 'DOWNLOADED',
                  })
                  file.close()
                  console.log('server downloaded')
                  resolve()
                })

                fres.on('data', (data) => {
                  window.webContents.send('server-download-status', {
                    downloaded: file.bytesWritten,
                    size: jdata['rocketcast-server'].Size,
                    status: 'DOWNLOADING',
                  })
                })
              })
            } catch (err) {
              console.log('reject: ', err)
              reject(err)
            }
          })
        },
      )
    } catch (err) {
      console.log('reject: ', err)
      reject(err)
    }
  })
}
