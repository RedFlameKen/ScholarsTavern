import { useNavigate } from "react-router-dom"
import "../../../styles/ColorPalette.css"
import "./LoginPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";

function LoginPage(){
    const navigate = useNavigate();

    return (
        <div id="login_page">
            <NavBarTop buttons={[
                (<RoundedButton 
                    label={"Sign Up"}
                    backgroundColor={"var(--st-bg-extra)"}
                    color={"var(--st-bg-light)"}
                    onClick={_ => {}}
                    />
                ),
                (<RoundedButton 
                    label={"Login"} 
                    onClick={_ => navigate("/home")}
                    />
                ),
            ]} />
            <div>
            </div>
        </div>
    );
}

export default LoginPage;
