const { Pack } = require('../../Pack.js')
const { sleep } = require('../../util.js')

function createElement(html) {
    let template = document.createElement('template')
    html = html.trim()
    template.innerHTML = html
    return template.content.firstChild
}

class Elements extends Pack {
    async preload(){
        this.manager.registerAppBarButton = this.registerAppBarButton.bind(this)
        this.manager.registerAppPage = this.registerAppPage.bind(this)

        let { React, ReactDOM } = await this.manager.get("base_react").receiveReact()
        this.React = React
        this.ReactDOM = ReactDOM

        this.registered_buttons = []
        this.registered_pages = {}
        this.selected_button = null
        this.open_page = null
    }

    load(){
        this.manager.registerCSS(this,"elements_required_css","default.css")

        this.observe_appBar()
    }

    remove_appBar_clicks(element){
        let appbar = element || document.querySelector(Elements.APP_BAR_LIST_SELECTOR)

        appbar.onclick = () => {
            for(let button of this.registered_buttons) {
                if(button.id && button.id == this.selected_button)
                    button.callbackClose()
            }
            this.previous_selected_element = null
            this.selected_button = null
            this.update_appBarButtons()
        }
    }

    observe_appBar(){
        let self = this
        async function try_find(x = 16,time = 100,i = 1){
            if(i >= x) return reject("Appbar not found after",x,"tries","(or",time * i,'ms)','\nExpect things to be broken')

            let element = document.querySelector(Elements.APP_BAR_LIST_SELECTOR)
            if(!element) {
                await sleep(time)
                try_find(x,time,++i)
            } else {
                self.app_bar_list = element
                for(let button of self.registered_buttons) 
                    button.element = self.app_bar_list.appendChild(button.element)

                self.remove_appBar_clicks(element)

                self.createPageSemiOverlay()
            }
        }

        try_find(Elements.APP_BAR_MAX_TRIES,Elements.APP_BAR_TRY_TIME)
    }

    create_appBarButton(id,title,image,callbackOpen,callbackClose){
        let element = createElement(`
                <div class="bt_app-bar-button" id="${id}">
                    <button>
                        <div class="bt_app-bar-image">
                            <div class="bt_inner-app-bar-image" style="-webkit-mask:url(${image}) center/contain no-repeat;"></div>
                        </div>
                        <span class="bt_app-bar-text">${title}</span>
                    </button>
                </div>
            `)

        element.onclick = () => {
            setTimeout(() => {
                if(this.selected_button != id) {
                    this.selected_button = id
                    callbackOpen()
                }
                this.update_appBarButtons()
            },1)
        }

        return element
    }

    update_appBarButtons(){
        let active_element = null
        for(let button of this.registered_buttons) {
            if(button.id && button.id == this.selected_button) {
                button.element.classList.add("active")
                active_element = button
            }
            else button.element.classList.remove("active")
        }

        this.previous_selected_element = document.querySelector(".app-bar-button.app-bar-selected")

        if(active_element && this.previous_selected_element)
            this.previous_selected_element.classList.remove("app-bar-selected")
        else if(this.previous_selected_element)
            this.previous_selected_element.classList.add("app-bar-selected")
    }

    registerAppBarButton(pack_data,title,image,callbackOpen,callbackClose) {
        if(!pack_data.pack || !pack_data.pack.main) return this.error("Invalid package with title:",title)
    
        this.registered_buttons.push({
            pack:pack_data.pack,
            callbackOpen,
            callbackClose,
            id:pack_data.pack.id,
            element:this.create_appBarButton(pack_data.pack.id,title,image,callbackOpen,callbackClose)
        })
    }

    createPageSemiOverlay(){
        let body = document.getElementById("wrapper")

        let holder = document.createElement("div")
            holder.className = "bt_app bt_hidden"
            holder.id = "bt_app_holder"

        this.page_holder = body.appendChild(holder)
    }

    openAppPage(name){
        this.ReactDOM.render(this.React.createElement(this.registered_pages[name].component),this.page_holder)
        this.open_page = name
        this.page_holder.classList.remove("bt_hidden")
    }

    closeAppPage(name){
        if(this.open_page == name) {
            this.ReactDOM.render(this.React.createElement("div"),this.page_holder)
            this.open_page = null
            this.page_holder.classList.add("bt_hidden")
        }
    }

    registerAppPage(pack_data,name,react_component) {
        if(!pack_data.pack || !pack_data.pack.main) return this.error("Invalid package with title:",title)

        this.registered_pages[name] = {
            name,
            pack_data,
            component:react_component
        }

        return [
            () => this.openAppPage.call(this,name),
            () => this.closeAppPage.call(this,name)
        ]
    }
}

Elements.APP_BAR_MAX_TRIES = 32
Elements.APP_BAR_TRY_TIME = 200
Elements.APP_BAR_LIST_SELECTOR = "app-bar ul"

module.exports = Elements