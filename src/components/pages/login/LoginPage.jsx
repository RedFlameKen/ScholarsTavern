import "../../../styles/ColorPalette.css"
import "./LoginPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { POST } from "../../../request/requester";

function LoginPage() {
    const navigate = useNavigate();

    const [errors, setErrors] = useState({});

    const onSubmit = async (/** @type {import("react").FormEvent} */ event) => {
        event.preventDefault()

        const formData = new FormData(event.target)

        const email = formData.get("email")
        const password = formData.get("password")

        let formErrors = {}

        if (!email) {
            formErrors.email = "Email is required"
        } // TODO: add case for if email is incorrectly formed

        if (!password) {
            formErrors.password = "Enter a password"
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
            endpoint: "/login",
            body: {
                data: {
                    email: email,
                    password: hashedPassword
                }
            },
            on_finish: (response) => {
                console.log(response.success)
                if(!response.success) {
                    if (response.status === 403) {
                        setErrors(prev => ({
                            ...prev,
                            email: response.message
                        }))
                    }
                    if (response.status === 401) {
                        setErrors(prev => ({
                            ...prev,
                            password: response.message
                        }))
                    }
                    return
                }

                if (response.status === 200) {
                    // TODO: post completion
                    console.log(`server: ${response.message}`)
                    navigate("/home")
                }

            },
            on_error: (response) => {
                console.log(`${response.message}`)
            }
        })

    }

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
                <form className="parchment-login-card" onSubmit={onSubmit}>
                    <h1 className="form-title">Log in</h1>

                    <div className="input-group">
                        <label className="form-label" htmlFor="email">
                            Email
                        </label>
                        {errors.email && (<p style={{color: "red"}}>{errors.email}</p>)}
                        <input
                            type="email"
                            name="email"
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
                        {errors.password && (<p style={{color: "red"}}>{errors.password}</p>)}
                        <input
                            type="password"
                            id="password"
                            name="password"
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
