const { Pack } = require('../../Pack.js')

module.exports = class extends Pack {
    load() {
        const SettingsPage = require("./SettingsPage.jsx")

        let [open_app_page,close_app_page] = this.manager.registerAppPage(this,
            "BT_BETTER_TEAMS_SETTINGS",SettingsPage)

        this.manager.registerAppBarButton(
            this,
            "Better Teams",
            "https://cdn.discordapp.com/attachments/563455444333494288/703173417293185074/betterteams.png",
            open_app_page,
            close_app_page)
    }
}