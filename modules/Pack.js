const { Logger } = require('./PackManager.js')

module.exports.Pack = class Pack extends Logger {
    constructor(pack_manager,pack){
        super(pack.name)
        this.manager = pack_manager
        this.pack = pack
    }

    _load(){
        this.load()
    }

    load(){}

    _preload(){
        this.preload()
    }

    preload(){}

    _unload(){
        this.unload()
    }

    unload(){}
}