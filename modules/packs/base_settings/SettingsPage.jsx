class BT_SideBar extends React.Component {

    constructor(props){
        super(props)

        this.state = {
            active_item: props.start || props.items[0]
        }

        this.props.onChange(this.state.active_item)
    }

    changeActive(name){
        this.setState({active_item:name})
        this.props.onChange(name)
    }

    render(){
        return (
            <div className="bt_app-page-sidebar">
                <div className="bt_app-page-sidebar-title">{this.props.title}</div>
                <div className="bt_app-page-sidebar-items">
                    {this.props.items.map((item,i) => 
                        <div key={i} onClick={() => this.changeActive(item)} className={"bt_app-page-sidebar-item" + (this.state.active_item == item ? " active" : "")}>
                            <div className="bt_app-page-sidebar-item-text">{item}</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }
}

module.exports = class extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            current_page: "Settings"
        }
    }

    changePage(page){
        this.setState({current_page:page})
    }

    render(){
        return (
            <div className="bt_app-page-safearea">
                <BT_SideBar title="Better Teams" onChange={this.changePage.bind(this)} items={["Settings","Packages","Themes"]} />
                <div className="bt_app-page">
                    {
                        this.state.current_page == "Settings" && (
                            <div className="bt_settings-page">
                                <div className="bt_page_title">Settings</div>
                                <div className="bt_page_subtitle">General settings for Better Teams</div>
                            </div>
                        )
                    }
                </div>
            </div>
        )
    }
}