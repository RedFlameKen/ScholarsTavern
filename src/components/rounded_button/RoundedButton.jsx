import "../../styles/ColorPalette.css";
import { useState } from "react"

function RoundedButton({label, backgroundColor="var(--st-green)", color="var(--st-bg-light)", fontSize=18, fontWeight="bold", onClick}){
    const [isHovered, setHovered] = useState(false)
    return (
        <div className="rounded_button" style={{
            color: color,
            backgroundColor: backgroundColor,
            borderRadius: 24,
            padding: "8px 16px",
            paddingRight: 10,
            fontSize: fontSize,
            fontWeight: fontWeight,
            cursor: "pointer",
            filter: isHovered ? "brightness(0.85)" : "none",
            textAlign: "center",
        }}
        onClick={_ =>{
            if (typeof onClick === 'function') onClick()
        }}
        onMouseEnter={_ => setHovered(true) }
        onMouseLeave={_ => setHovered(false) }
        >
            {label}
        </div>
    );
}

export default RoundedButton;
