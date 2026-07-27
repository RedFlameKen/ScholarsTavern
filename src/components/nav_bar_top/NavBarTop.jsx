import logo from "../../logo.png";
import "../../styles/ColorPalette.css";
import "./NavBarTop.css";

/**
*/
function NavBarTop({buttons}){
    return (
        <div id="nav_bar_top">
            <img src={logo} alt="Scholar's Tavern"/>
            <h1 id="nav_bar_top_header">Scholar's Tavern</h1>
            <div id="nav_bar_top_button_row">
                { buttons.map((item, i) => {
                    return (<span key={i}>{item}</span>)
                })}
            </div>
        </div>
    );
}

export default NavBarTop;
