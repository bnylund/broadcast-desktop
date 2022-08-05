declare interface Window { 
  api: {
    spawnServer: () => Promise<boolean>;
    stopServer: (id: string) => Promise<boolean>;
    getServers: () => Promise<Server[]>;

    getOverlays: () => Promise<Overlay[]>;
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
  _id: string
}
