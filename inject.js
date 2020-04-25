const ps = require('ps-node')
const { existsSync, promises: { mkdir, writeFile, readdir, rmdir, unlink } } = require('fs')
const { join : joinPath , dirname } = require('path')
const childProcess = require('child_process')
if(process.argv[2] === '-inject')
    findClient()
        .then(injectClient)
        .then(restartClient)
        .then(done)
        .catch((e) => console.error("ERROR",e.message))

else if(process.argv[2] === '-uninject')
    findClient()
        .then(uninjectClient)
        .then(restartClient)
        .then(done)
        .catch((e) => console.error("ERROR",e.message))

else {
    console.log('Type not specified: Use -inject or -uninject; in the command line arguments')
    process.exit(0)
}

async function isEmptyDir(dirname) {
    return (await readdir(dirname)).length === 0
}

function findClient(){
    return new Promise((resolve,reject) => {
        ps.lookup({command: 'teams'}, (err, resultSet) => {
            if (err) throw new Error(err)

            for(let proc of resultSet) {
                let arg = [...proc.arguments].find((arg) => arg.includes('--app-path'))
                if(arg) {
                    resolve({proc,asar_path:arg.split("=")[1]})
                    process.kill(proc.pid)
                }
            }
            reject(new Error("Microsoft Teams needs to be active. Please start Microsoft Teams"))
        })
    })
}

async function injectClient({proc,asar_path}){
    console.log("Asar path found",asar_path)

    let app_path = joinPath(dirname(asar_path.slice(1,-1)),"app")

    let existsDir = existsSync(app_path)
    let emptyDir = existsDir && await isEmptyDir(app_path)
    if(existsDir && !emptyDir)
        throw new Error("Path for app already exists. Are you already injected?")

    if(!existsDir){
        console.log("Creating app folder...")
        
        await mkdir(app_path).catch(console.error)
    }

    let index_data = `require("${joinPath(__dirname,'index.js').replace(/\\/g,'/')}")`
    let package_data = `{"name": "app","version": "1.0.0","description": "","main": "index.js","author": "thuverx","license": "ISC"}`

    console.log("Creating files...")
    await writeFile(joinPath(app_path,"index.js"),index_data)
    await writeFile(joinPath(app_path,"package.json"),package_data)

    return proc.command
}

async function uninjectClient({proc,asar_path}){

    console.log("Asar path found",asar_path)

    let app_path = joinPath(dirname(asar_path.slice(1,-1)),"app")

    console.log("Removing files...")
    let existsDir = existsSync(app_path)
    if(existsDir) {
        let files = await readdir(app_path)
        for(let file of files) 
            await unlink(joinPath(app_path,file))

        rmdir(app_path)
    }
    else throw new Error("No folder for injector found.")

    return proc.command
}

async function restartClient(path){
    console.log('Restarting Client...')
    let teams = childProcess.spawn(path, { detached: true })
    teams.unref()
    return
}

function done(){
    console.log('Done!')
    process.exit(0)
}