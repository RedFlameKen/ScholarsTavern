import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/ColorPalette.css";
import "./AccountProfilePage.css";
import NavBar from "../../nav_bar/NavBar";
import editIcon from "../../../assets/icons/Edit.svg";

function AccountProfilePage() {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [aboutText, setAboutText] = useState("");
  const [tempAboutText, setTempAboutText] = useState("");

  const openEditModal = () => {
    setTempAboutText(aboutText);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const saveAbout = () => {
    setAboutText(tempAboutText);
    setIsEditModalOpen(false);
  };

  return (
    <div id="account_profile_page">
      <NavBar />

      <main id="account_content">
        <div id="account_header">
          <div id="account_avatar" />
          <div>
            <div id="account_name">Name</div>
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
              onClick={() => navigate("/")}
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
