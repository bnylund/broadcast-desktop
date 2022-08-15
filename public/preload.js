const { ipcRenderer, contextBridge } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Core functionality
  spawnServer: () => ipcRenderer.invoke('spawn-server'),
  stopServer: (id) => ipcRenderer.invoke('stop-server', id),
  getServers: () => ipcRenderer.invoke('get-servers'),
  onServerStatus: (callback) => ipcRenderer.on('server-status', callback),
  offServerStatus: (callback) => ipcRenderer.off('server-status', callback),

  getOverlays: () => ipcRenderer.invoke('get-overlays'),
  downloadOverlay: (id) => ipcRenderer.invoke('download-overlay', id),
  searchOverlay: () => ipcRenderer.invoke('search-overlay'),
  updatePlugin: () => ipcRenderer.invoke('update-plugin'),

  // Extra
  runAtStartup: (state) => ipcRenderer.invoke('run-at-startup', state),
})

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  app: () => ipcRenderer.invoke('get-version'),
})
