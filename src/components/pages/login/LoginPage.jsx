import "../../../styles/ColorPalette.css"
import "./LoginPage.css"
import NavBarTop from "../../nav_bar_top/NavBarTop";
import RoundedButton from "../../rounded_button/RoundedButton";

function LoginPage(){
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
                    onClick={_ => {}}
                    />
                ),
            ]} />
            <div>
            </div>
        </div>
    );
}

export default LoginPage;
