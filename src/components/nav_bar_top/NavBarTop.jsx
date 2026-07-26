import logo from "../../logo.png";
import "../../styles/ColorPalette.css";
import "./NavBarTop.css";

/**
*/
function NavBarTop({buttons, mobileCompact = false, hideButtonOnMobile = null}){
    const hideIndex = typeof hideButtonOnMobile === "number" ? hideButtonOnMobile : null;

    return (
        <div id="nav_bar_top">
            <img src={logo} alt="Scholar's Tavern"/>
            <h1 id="nav_bar_top_header">Scholar's Tavern</h1>
            <div id="nav_bar_top_button_row">
                { buttons.map((item, i) => {
                    const hideOnMobile = (mobileCompact && i === 0) || (hideIndex !== null && i === hideIndex);
                    return (
                        <span key={i} className={hideOnMobile ? "nav-bar-top-button hide-on-mobile" : "nav-bar-top-button"}>
                            {item}
                        </span>
                    )
                })}
            </div>
        </div>
    );
}

export default NavBarTop;
