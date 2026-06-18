import "../../../styles/ColorPalette.css";
import "./HomePage.css";
import NavBar from "../../nav_bar/NavBar";
import addIcon from "../../../assets/icons/Add.svg";

function HomePage() {
  return (
    <div id="home_page">
      <NavBar />

      <main id="home_main">
        <header id="home_header">
          <div>
            <h1>Groups</h1>
          </div>
        </header>

        <section id="group_cards">
          <button className="create_card" type="button">
            <div className="create_card_icon">
              <img src={addIcon} alt="Create group" />
            </div>
            <div className="create_card_text">Create Group</div>
          </button>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
