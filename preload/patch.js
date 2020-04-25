let Module = { _load } = require("module")

let original_require = Module.prototype.require
Module.prototype.require = function() {
    if(arguments[0].includes("remoteFiltering"))
        return {initialize:() => void 0}

    return original_require.apply(this,arguments)
}

const electron = { app, session, BrowserWindow } = require('electron')
const { join, dirname } = require('path')

class WindowPatch extends BrowserWindow {
    constructor(opts) {
        if (!opts.webPreferences || !opts.webPreferences.preload) return new BrowserWindow(opts)
        
        if(opts.webPreferences.additionalArguments.includes("--msteams-process-type=mainWindow")) {
            global._orig_preload = opts.webPreferences.preload
            opts.webPreferences.enableRemoteModule = true
            opts.webPreferences.preload = join(__dirname,"preload.js")

            console.log("[Better Teams] Preloading...")
        }

        return new BrowserWindow(opts)
    }
}

Object.assign(WindowPatch, BrowserWindow)

console.log("[Better Teams] Injecting...")

module.exports = new class Patcher {
    constructor(){
        this.TEAMS_PATH = join(dirname(require.main.filename), '..', 'app.asar')
        this.TEAMS_PACK = require(join(this.TEAMS_PATH,'package.json'))
        this.electron_path = require.resolve('electron')

        this.failed_exports = []

        this.setRequireCache()

        app.once('ready',this.appReady.bind(this))
        app.setAppPath(this.TEAMS_PATH)
        app.setName(this.TEAMS_PACK.name)

        this.done()
    }

    setRequireCache(){

        delete require.cache[this.electron_path].exports
        require.cache[this.electron_path].exports = {}
        
        for (const prop in electron) {
            try {
                if (prop === 'BrowserWindow') {
                    console.log("[Better Teams] Patching BrowserWindow...")
                    Object.defineProperty(require.cache[this.electron_path].exports, prop, { 
                        get() { return WindowPatch },
                        enumerable:true
                    })
                } else {
                    Object.defineProperty(require.cache[this.electron_path].exports, prop, { 
                        get() { return electron[prop] },
                        enumerable:true
                    })
                }

            } catch (_) {
                this.failed_exports.push(prop)
            }
        }
    }

    appReady(){
        session.defaultSession.webRequest.onHeadersReceived(({ responseHeaders }, res) => {
            
            Object.keys(responseHeaders)
                .filter(h => (/^content-security-policy/i).test(h))
                .map(h => (delete responseHeaders[h]))
        
            res({ responseHeaders })
        })
    
        for (const prop of this.failed_exports) {
            require.cache[this.electron_path].exports[prop] = electron[prop]
        }
        
        console.log("[Better Teams] Loading...")
    }
    
    done(){
        _load(join(this.TEAMS_PATH, this.TEAMS_PACK.main),null,true)
    }
}()

