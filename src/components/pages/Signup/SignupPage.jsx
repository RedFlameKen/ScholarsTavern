import "../../../styles/ColorPalette.css"
import "./SignupPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";
import { useNavigate } from "react-router-dom";

function SignupPage() {
    const navigate = useNavigate();

    return (
        <div id="signup_page">
            <NavBarTop
                buttons={[
                    <RoundedButton
                        key="signup"
                        label={"Sign Up"}
                        backgroundColor={"var(--st-bg-extra)"}
                        color={"var(--st-bg-light)"}
                        onClick={() => navigate("/signup")}
                    />,
                    <RoundedButton
                        key="login"
                        label={"Login"}
                        onClick={() => navigate("/login")}
                    />,
                ]}
            />
            <div className="login-form-wrapper">
                <form className="parchment-login-card">
                    <h1 className="form-title">Sign Up</h1>

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
                        <label className="form-label" htmlFor="First Name">
                            First Name
                        </label>
                        <input
                            type="First Name"
                            id="First Name"
                            placeholder="Enter First Name"
                            className="styled-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="Last Name">
                            Last Name
                        </label>
                        <input
                            type="Last Name"
                            id="Last Name"
                            placeholder="Enter Last Name"
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

                    <div className="input-group">
                        <label className="form-label" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm Password"
                            className="styled-input"
                            required
                        />
                    </div>

                    <button type="submit" className="parchment-submit-btn">
                        Register
                    </button>

                    <div className="form-footer" style={{ justifyContent: "center" }}>
                        <a href="/login" className="footer-link">
                            Already have an account? Log in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SignupPage;