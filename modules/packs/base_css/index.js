const { Pack } = require('../../Pack.js')
const { readFileSync, existsSync } = require('fs')
const { join: joinPath } = require('path')

module.exports = class extends Pack {

    preload(){
        this.css_path_cache = {}

        this.manager.registerCSS = this.registerCSS.bind(this)
        this.manager.registerCSSString = this.registerCSSString.bind(this)
    }

    registerCSSString(pack_data,name,css){
        if(!pack_data.pack || !pack_data.pack.main) return this.error("Invalid package with name:",name)
        this.add_css(name,css)
    }

    registerCSS(pack_data,name,path) {
        if(!pack_data.pack || !pack_data.pack.main) return this.error("Invalid package with name:",name)
        path = joinPath(__dirname,"../",pack_data.pack.id,path)
        this.css_path_cache[name] = path
        this.load_css(name,path)
    }

    create_css_element(name,css) {
        let style = document.createElement('style')
            style.id = "BASE_CSS"
            style.setAttribute('style_id',name)
            style.innerHTML = css

        return style
    }

    css_exists(name){
        return !!document.head.querySelector(`[style_id="${name}"]`)
    }

    load_css(name,path,quiet = false) {
        if (!existsSync(path)) return this.error("Path",path,"doesn't exist")

        if(!quiet) this.log("Loading css:",name)

        let data = readFileSync(path).toString()
        if(!data) return this.error("Could not read data for file",path)

        this.add_css(name,data,true)
    }

    add_css(name,css,quiet = false) {
        if(!quiet) this.log("Adding css:",name)
        if(this.css_exists(name)) return this.error("Css for name",`"${name}"`,"already exists.")
        document.head.appendChild(
            this.create_css_element(name,css))
    }

    reload_css_file(name,quiet = false) {
        if(!quiet) this.log("Reloading css:",name)
        this.remove_css(name,true)
        this.load_css(name,this.css_path_cache[name],true)
    }

    reload_css(name,css,quiet = false) {
        if(!quiet) this.log("Reloading css:",name)
        this.remove_css(name,true)
        this.add_css(name,css,true)
    }

    remove_css(name,quiet = false) {
        let element = document.head.querySelector(`[style_id="${name}"]`)
        if(!element) return this.error("No element",name)
        
        if(!quiet) this.log("Removing css:",name)

        document.head.removeChild(element)
    }
}