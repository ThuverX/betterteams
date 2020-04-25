const { Pack } = require('../../Pack.js')

class ErrorCleanup extends Pack {

    preload() {
        let original_console_error = console.error

        console.error = function() {
            let flagged = false
            for(let filter of ErrorCleanup.filters)
                if([...arguments].join('').includes(filter))
                    flagged = true

            if(!flagged)
                return original_console_error.apply(this,arguments)
        }
    }

}

ErrorCleanup.filters = [
    "hidDeviceManager",
    "Unified Presence",
    "UnifiedPresence",
    "hidService",
    "BuddyListService",
    "transportDependencyProviderService"
]

module.exports = ErrorCleanup