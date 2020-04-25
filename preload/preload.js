const { remote } = require('electron')
const { join : joinPath } = require('path')
const { PackManager } = require(joinPath(__dirname,'../','modules','PackManager.js'))

require(remote.getGlobal("_orig_preload"))

const window = remote.getCurrentWindow()

const PackManagerInstance = new PackManager()
PackManagerInstance.preload()

window.webContents.on('dom-ready',() => PackManagerInstance.load())