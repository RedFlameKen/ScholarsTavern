import logo from "../../logo.svg";
import "../../styles/ColorPalette.css";
import "./NavBar.css";

function NavBar(){
    return (
        <div id="nav_bar">
            <img src={logo} alt="Scholar's Tavern"/>
        </div>
    );
}

export default NavBar;
