declare interface Window { 
  api: {
    spawnServer: () => Promise<boolean>;
    stopServer: (id: string) => Promise<boolean>;
    getServers: () => Promise<Server[]>;
    onDownloadStatus: (callback: (event: any, status: { downloaded: number; size: number; status: 'FETCHING' | 'DOWNLOADING' | 'DOWNLOADED' }) => void) => void
    offDownloadStatus: (callback: (event: any, status: { downloaded: number; size: number; status: 'FETCHING' | 'DOWNLOADING' | 'DOWNLOADED' }) => void) => void
    onServerStatus: (callback: (event: any, server: Server) => void) => void
    offServerStatus: (callback: (event: any, server: Server) => void) => void

    getOverlays: () => Promise<Overlay[]>;
    connectOverlay: (id: string, server: string) => Promise<boolean>;
    downloadOverlay: (id: string) => Promise<boolean>;
    searchOverlay: () => Promise<boolean>;
    updatePlugin: () => Promise<boolean>;

    runAtStartup: (state: boolean) => Promise<boolean>;
  };
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
    app: () => Promise<string>;
  }
}

declare interface Overlay {
  _id: string
}

declare interface Server {
  pid: number
  port: number
  log: string
  stats?: {
    cpu: number
    memory: number
    ppid: number
    pid: number
    ctime: number
    elapsed: number
    timestamp: number
  }
}
