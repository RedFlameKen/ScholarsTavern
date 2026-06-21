import "../../../styles/ColorPalette.css"
import "./SignupPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react"
import { POST } from "../../../request/requester.jsx"

function SignupPage() {
    const [errors, setErrors] = useState({})
    const navigate = useNavigate();

    const onSubmit = async (/** @type {import("react").FormEvent} */ event) => {
        event.preventDefault()

        const formData = new FormData(event.target)

        const first_name = formData.get("first_name").trim()
        const last_name = formData.get("last_name").trim()
        const email = formData.get("email")
        /** @type {string} */
        const password = formData.get("password")
        const confirm_password = formData.get("confirm_password")

        const formErrors = {}

        if (!email) {
            formErrors.email = "Email is required"
        } // TODO: add case for if email is incorrectly formed

        if (!first_name) {
            formErrors.first_name = "Enter a name"
        }

        if (!password) {
            formErrors.password = "Enter a password"
        } else if (password.length < 8) {
            formErrors.password = "Password must be at least 8 characters"
        }


        if (confirm_password !== password) {
            formErrors.confirm_password = "Passwords do not match"
        }

        setErrors(formErrors)

        if (Object.keys(formErrors).length > 0) {
            return
        }

        const hashedPasswordBuffer = 
            await crypto.subtle.digest(
                "SHA-256",
                new TextEncoder().encode(password)
            )

        const hashedPassword = new Uint8Array(hashedPasswordBuffer).toHex()

        POST({
            endpoint: "/signin",
            body: {
                data: {
                    first_name: first_name,
                    last_name: last_name,
                    email: email,
                    password: hashedPassword,
                }
            },
            on_finish: (data) => {
                if (data.success) {
                    navigate("/login")
                }
            }
        })

    }

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
                <form className="parchment-login-card" onSubmit={onSubmit}>
                    <h1 className="form-title">Sign Up</h1>

                    <div className="input-group">
                        <label className="form-label" htmlFor="email">
                            Email
                        </label>
                        {errors.email && (<p style={{color: "red"}}>{errors.email}</p>)}
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter Email"
                            className="styled-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="First Name">
                            First Name
                        </label>
                        {errors.first_name && (<p style={{color: "red"}}>{errors.first_name}</p>)}
                        <input
                            type="First Name"
                            id="First Name"
                            name="first_name"
                            placeholder="Enter First Name"
                            className="styled-input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="Last Name">
                            Last Name
                        </label>
                        <input
                            type="Last Name"
                            id="Last Name"
                            name="last_name"
                            placeholder="Enter Last Name"
                            className="styled-input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="password">
                            Password
                        </label>
                        {errors.password && (<p style={{color: "red"}}>{errors.password}</p>)}
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter Password"
                            className="styled-input"
                        />
                    </div>

                    <div className="input-group">
                        <label className="form-label" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        {errors.confirm_password && (<p style={{color: "red"}}>{errors.confirm_password}</p>)}
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirm_password"
                            placeholder="Confirm Password"
                            className="styled-input"
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
