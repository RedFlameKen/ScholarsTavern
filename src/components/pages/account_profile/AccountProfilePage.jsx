import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/ColorPalette.css";
import "./AccountProfilePage.css";
import NavBar from "../../nav_bar/NavBar";
import editIcon from "../../../assets/icons/Edit.svg";
import { checkAuth, GET, POST } from "../../../request/requester";

function AccountProfilePage() {
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [aboutText, setAboutText] = useState("");
    const [username, setUsername] = useState("User");
    const [tempAboutText, setTempAboutText] = useState("");

    let user_id = -1;
    let email = ""

    useEffect(() => {
        async function verify() {
            let auth_status = await checkAuth({});
            if (!auth_status.success) {
                navigate("/login", { replace: true });
            }
            user_id = auth_status.data.user_id
            if (user_id === -1) {
                navigate(-1)
            }
            GET({
                endpoint: `/user/${user_id}`,
                on_finish: (response) => {
                    if (!response.success) {
                        return;
                    }
                    let name = response.data.first_name
                    if (response.data.last_name !== "") {
                        name += ` ${response.data.last_name}`
                    }
                    setUsername(name)
                    setAboutText(response.data.bio)
                    email = response.data.email
                }
            })
        }
        verify();
    }, [navigate])

    const openEditModal = () => {
        setTempAboutText(aboutText);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
    };

    function handleLogout() {
        GET({
            endpoint: "/logout",
            on_finish: (response) => {
                if (!response.success) {
                    return
                }
                navigate("/")
            },
            on_error: (_) => {
            }
        })
    }

    const saveAbout = () => {
        POST({
            endpoint: "/user/update",
            body: {
                data: {
                    "bio": tempAboutText
                }
            },
            on_finish: (response) => {
                if (response.success) {
                    setAboutText(response.data.bio);
                }
                setIsEditModalOpen(false);
            },
            on_error: (_) => {
                setIsEditModalOpen(false);
            }
        })
    };

    return (
        <div id="account_profile_page">
            <NavBar />

            <main id="account_content">
                <div id="account_header">
                    <div id="account_avatar" />
                    <div>
                        <div id="account_name">{username}</div>
                    </div>
                </div>

                <div id="account_main">
                    <div id="account_about_card">
                        <div id="account_about_header">
                            <div id="account_section_title">About</div>
                            <button
                                id="edit_about_btn"
                                onClick={openEditModal}
                            >
                                <img src={editIcon} alt="Edit" />
                            </button>
                        </div>
                        <div id="account_about_box">
                            {aboutText && <p>{aboutText}</p>}
                        </div>
                    </div>

                    <div id="account_actions">
                        <h2 id="account_actions_title">Account</h2>
                        <p className="account_action_text">
                            <span>Credentials</span>
                        </p>
                        <p
                            id="account_logout_text"
                            onClick={() => {handleLogout()}}
                        >
                            Logout
                        </p>
                    </div>
                </div>

                {isEditModalOpen && (
                    <div id="edit_modal_overlay" onClick={closeEditModal}>
                        <div id="edit_modal_content" onClick={(e) => e.stopPropagation()}>
                            <h2>About Yourself</h2>
                            <textarea
                                id="edit_about_textarea"
                                value={tempAboutText}
                                onChange={(e) => setTempAboutText(e.target.value)}
                            />
                            <button
                                id="edit_modal_save_btn"
                                onClick={saveAbout}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AccountProfilePage;
