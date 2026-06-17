import "../../../styles/ColorPalette.css"
import "./LoginPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";
import { useNavigate } from "react-router-dom";


function LoginPage() {
    const navigate = useNavigate();
    return (
        <div id="login_page">
            <NavBarTop buttons={[
                (<RoundedButton 
                    label={"Sign Up"}
                    backgroundColor={"var(--st-bg-extra)"}
                    color={"var(--st-bg-light)"}
                    onClick={() => navigate("/signup")}
                    />
                ),
                (<RoundedButton 
                    label={"Login"} 
                    onClick={() => navigate("/login")}
                    />
                ),
            ]} />
            <div className="login-form-wrapper">
                <form className="parchment-login-card">
                    <h1 className="form-title">Log in</h1>

                    <div className="input-group">
                        <label className="form-label" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter Email"
                            className="styled-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter Password"
                            className="styled-input"
                            required
                        />
                    </div>

                    <button type="submit" className="parchment-submit-btn">
                        Login
                    </button>

                    <div className="form-footer">
                        <a href="/signup" className="footer-link">
                            Register
                        </a>
                        <a href="/forgot-password" className="footer-link">
                            Forgot Password?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
