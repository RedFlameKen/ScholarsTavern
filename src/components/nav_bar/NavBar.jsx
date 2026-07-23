import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../logo.svg";
import groupsIcon from "../../assets/icons/Groups.svg";
import searchIcon from "../../assets/icons/GroupSearch.svg";
import pendingIcon from "../../assets/icons/Pending.svg";
import accountIcon from "../../assets/icons/Account.svg";
import requestsIcon from "../../assets/icons/GroupRequest.svg";
import "../../styles/ColorPalette.css";
import "./NavBar.css";

function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <aside id="nav_bar">
            <div id="nav_brand">
                <img src={logo} alt="Scholar's Tavern" />
                <span>ST</span>
            </div>

            <nav id="nav_links">
                <button 
                    className={`nav_icon ${isActive("/home") ? "nav_icon--active" : ""}`} 
                    aria-label="Groups" 
                    onClick={() => navigate("/home")}
                >
                    <img src={groupsIcon} alt="Groups" />
                </button>
                <button 
                    className={`nav_icon ${isActive("/search") ? "nav_icon--active" : ""}`} 
                    aria-label="Search"
                    onClick={() => navigate("/search")}
                >
                    <img src={searchIcon} alt="Search" />
                </button>

                <button 
                    className={`nav_icon ${isActive("/requests") ? "nav_icon--active" : ""}`} 
                    aria-label="Requests"
                    onClick={() => navigate("/requests")}
                >
                    <img src={requestsIcon} alt="Requests" />
                </button>
            </nav>

            <nav id="nav_bottom_links">
                <button 
                    className={`nav_icon ${isActive("/pending") ? "nav_icon--active" : ""}`} 
                    aria-label="Pending"
                    onClick={() => navigate("/pending")}
                >
                    <img src={pendingIcon} alt="Pending" />
                </button>
                <button 
                    className={`nav_icon ${isActive("/profile") ? "nav_icon--active" : ""}`} 
                    aria-label="Account" 
                    onClick={() => navigate("/profile")}
                >
                    <img src={accountIcon} alt="Account" />
                </button>
            </nav>
        </aside>
    );
}

export default NavBar;
