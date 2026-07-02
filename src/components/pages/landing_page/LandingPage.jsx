import "../../../styles/ColorPalette.css"
import "./LandingPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";
import { useNavigate } from "react-router-dom";
import { checkAuth } from "../../../request/requester";
import { useEffect } from "react";

function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        async function verify(){
            if ((await checkAuth({})).success) {
                navigate("/home", {replace: true})
            }
        }
        verify();
    }, [navigate])

    return (
        <div id="landing_page">
            <NavBarTop buttons={[
                (<RoundedButton
                    key="signup"
                    label={"Sign Up"}
                    backgroundColor={"var(--st-bg-extra)"}
                    color={"var(--st-bg-light)"}
                    onClick={() => navigate("/signup")}
                />
                ),
                (<RoundedButton
                    key="login"
                    label={"Login"}
                    onClick={() => navigate("/login")}
                />
                ),
            ]} />

            <div className="landing-hero-container">
                <div className="parchment-hero-card">
                    <h1 className="hero-title">Scholar's Tavern</h1>
                    <p className="hero-subtitle">
                        Step inside, weary traveler. Pull up a chair, grab a warm drink, and share your wisdom with fellow scholars.
                    </p>

                    <div className="hero-actions">
                        <button
                            className="parchment-hero-btn"
                            onClick={() => navigate("/signup")}
                        >
                            Enter the Tavern
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;
