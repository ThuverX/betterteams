
const { remote : { getCurrentWindow } } = require('electron')
const { readdirSync, readFileSync, lstatSync, existsSync } = require('fs')
const { join: joinPath } = require('path')

// JSX to JS transpiler
const { transform } = require('buble')

require.extensions['.jsx'] = (m,f) => {
    const content = readFileSync(f,'utf8')

    const final = transform(content,{
        jsx: 'React.createElement',
        objectAssign: 'Object.assign',
        target: { chrome: 71 }
    })

    return m._compile(final.code, f)
}

class Logger {
    constructor(logger_name){
        this.__logger_name = logger_name
    }

    log(...args) {
        console.log(`%c[${this.__logger_name}]`,'color:#a5eb34',...args)
    }

    error(...args) {
        console.log(`%c[${this.__logger_name}]` + ' %c[ERROR]','color:#a5eb34','color:#db2323',...args)
    }

    warn(...args) {
        console.log(`%c[${this.__logger_name}]` + ' %c[WARNING]','color:#a5eb34','color:#db6a23',...args,)
    }
}

class PackManager {  

    constructor(){
        this.packs = {}
        this.logger = new Logger("Pack Manager")

        this.logger.log(`Using BetterTeams v${PackManager.VERSION}`)
        this.load_packs()
    }

    get(pack) {
        return this.packs[pack]
    }

    load_packs(){
        this.logger.log("Loading packs...")
        let pack_path = joinPath(__dirname,PackManager.PACK_PATH)

        let unsorted_packs = []

        for(let pack_dir of readdirSync(pack_path)) {
            let pack_folder = joinPath(pack_path,pack_dir)
            if (!lstatSync(pack_folder).isDirectory()) continue

            let pack_main_path = joinPath(pack_folder,'main.json')

            if(existsSync(pack_main_path)) {
                let pack = require(pack_main_path)

                if(!pack.main) {
                    this.logger.error('Pack',pack_dir,',main.json has no main file')
                    continue
                }

                pack.name = pack.name || pack_dir
                pack.id = pack_dir

                unsorted_packs.push(new (require(joinPath(pack_folder,pack.main)))(this,pack))
            }
            else
                this.logger.error('Pack',pack_dir,'has no main.json')
        }

        let ordered_packs = unsorted_packs.sort((a,b) => (a.pack.priority || 0) < (b.pack.priority || 0))

        for(let pak of ordered_packs) 
            this.packs[pak.pack.id] = pak

        this.logger.log("Packs loaded:",Object.values(this.packs).map((pak) => pak.pack.name).join(", "))
    }

    preload(){
        for(let pack of Object.values(this.packs))
            pack._preload()
    }

    load(){
        for(let pack of Object.values(this.packs))
            pack._load()

        window.PackManager = this

        Mousetrap.bind(['command+shift+i', 'ctrl+shift+i'], () => {
            getCurrentWindow().webContents.openDevTools({detached:true})
            return false
        })
    }

    unload(){
        for(let pack of Object.values(this.packs))
            pack._unload()
    }
}

PackManager.PACK_PATH = "packs/"
PackManager.VERSION = "0.2"

module.exports.PackManager = PackManager
module.exports.Logger = Logger