const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('timeflowDesktop', {
  platform: process.platform,
  isDesktop: true
})

