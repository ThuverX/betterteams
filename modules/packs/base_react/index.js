const { Pack } = require('../../Pack.js')
const { sleep } = require('../../util.js')
const { EventEmitter } = require("events")

class Base_React extends Pack {

    preload(){
        this.eventSystem = new EventEmitter()

        this.await_react()
            .then(this.hook_react.bind(this))
            .catch(this.error.bind(this))
    }

    hook_react({React,ReactDOM}){
        this.ReactInstance = React
        this.ReactDOMInstance = ReactDOM
        this.eventSystem.emit("receive_react",{React,ReactDOM})
    }

    getReact(){
        return this.ReactInstance
    }

    receiveReact(){
        return new Promise((res,rej) => {
            if(!this.ReactInstance)
                this.eventSystem.once("receive_react",res)
            else res({React:this.ReactInstance,ReactDOM:this.ReactDOMInstance})
        })
    }

    await_react(){
        return new Promise((resolve,reject) => {
            let self = this
            async function try_find(x = 16,time = 100,i = 1){
                if(i >= x) return reject("React not found after",x,"tries","(or",time * i,'ms)')
    
                if(!window.React || !window.ReactDOM) {
                    await sleep(time)
                    try_find(x,time,++i)
                } else {
                    self.log("React found, after",`${i}/${x}`,"tries","(or",time * i,'ms)')
                    resolve({React:window.React,ReactDOM:window.ReactDOM})
                }
            }
            try_find(Base_React.MAX_TRIES,Base_React.TRY_TIME)
        })
    }

    load() {
    }

}

Base_React.MAX_TRIES = 16
Base_React.TRY_TIME = 100

module.exports = Base_React