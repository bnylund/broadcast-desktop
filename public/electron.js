const path = require('path')
const net = require('net')
const http = require('http')
const https = require('https')
const fs = require('fs')
const { spawn } = require('node:child_process')

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const isDev = require('electron-is-dev')

// TODO: Add services in here (relay instances, overlay instances)
let servers = [],
  overlays = [],
  window

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

  // Grab server .exe from Serverless API, then assign a random port to it on launch
  // rocketcast-server.exe <PORT>
  ipcMain.handle('spawn-server', async (event) => {
    try {
      await downloadServer()
      const port = await getOpenPort()
      console.log('Spawning server on port ' + port)

      const server = spawn('rocketcast-server.exe', [port], {
        cwd: __dirname,
      })

      servers.push({
        pid: server.pid,
        log: '',
        port,
      })

      server.stdout.on('data', (data) => {
        process.stdout.write(`[${server.pid}] ${data}`)
        const serv = servers.find((x) => x.pid === server.pid)
        if (serv) serv.log += data
      })

      server.stderr.on('data', (data) => {
        process.stderr.write(`[${server.pid}] ${data}`)
        const serv = servers.find((x) => x.pid === server.pid)
        if (serv) serv.log += `[ERROR] ${data}`
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

      return { pid: server.pid, port }
    } catch (err) {
      return { error: err }
    }
  })

  ipcMain.handle('stop-server', async (event, id) => {
    if (!id) return false

    const server = servers.find((x) => x.pid === id)
    if (!server) return false

    process.kill(server.pid, 'SIGINT')
    return true
  })

  ipcMain.handle('get-servers', async (event, args) => {
    return servers
  })

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
        if (fs.existsSync(path.join(__dirname, 'rocketcast-server.exe')))
          return resolve()
        // Disable for now fs.unlinkSync(path.join(__dirname, 'rocketcast-server.exe'))
      } catch (err) {
        // Already downloaded and in use
        return resolve()
      }

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
                  file.close()
                  console.log('server downloaded')
                  resolve()
                })

                fres.on('data', (data) => {
                  console.log(
                    file.bytesWritten +
                      ' / ' +
                      jdata['rocketcast-server'].Size +
                      ` (${
                        (file.bytesWritten / jdata['rocketcast-server'].Size) *
                        100
                      }%)`,
                  )
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
