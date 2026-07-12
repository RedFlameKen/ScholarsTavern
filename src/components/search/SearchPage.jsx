import { useState } from "react";
import NavBar from "../../nav_bar/NavBar"; 
import "../../../styles/ColorPalette.css"; 
import "./SearchPage.css";
import SearchIcon from "../../../assets/icons/Search.svg";
import PrivateIcon from "../../../assets/icons/Private.svg";
import PublicIcon from "../../../assets/icons/Public.svg";
import NoProfilePicture from "../../../assets/icons/Account.svg";

const initialGroups = [
    {
        id: 1,
        name: "Python Programming Guidance",
        is_public: true,
        tags: ["programming", "python"],
        members: ["pfp1.jpg", "pfp2.jpg", ""] 
    }
];

function SearchPage() {
    const [groupsData] = useState(initialGroups);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredGroups = groupsData.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container">
            <NavBar/>

            <div className="main-content-wrapper">
                <header className="header">
                    <h1 className="logo">Find Groups</h1>
                    <div className="search-container">
                        <span className="search-icon"> 
                            <img
                                src={SearchIcon}
                                alt="Search icon"
                                className="card_visibility_icon"
                            /> 
                        </span>
                        <input 
                            type="text" 
                            className="search-input" 
                            placeholder="Search groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                {/*Groups Object List*/}
                <main className="groups-list">
                    {filteredGroups.length === 0 ? (
                        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>No groups found.</p>
                    ) : (
                        filteredGroups.map(group => (
                            <section key={group.id} className="group-card">
                                <div className="card-header">
                                    <h2 className="group-title">{group.name}</h2>
                                    <span className="visibility-icon" title={group.is_public ? "Public" : "Private"}>
                                        <img
                                            src={group.is_public ? PublicIcon : PrivateIcon}
                                            alt={group.is_public ? "Public group" : "Private group"}
                                            className="card_visibility_icon"
                                        />
                                    </span>
                                </div>
                                
                                <div className="tags-section">
                                    <span className="tags-label">Tags</span>
                                    <div className="tags-container">
                                        {group.tags.map((tag, index) => (
                                            <span key={index} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="members-section">
                                    <span className="members-label">Members:</span>
                                    <div className="avatar-group">
                                        {group.members.map((avatarSrc, index) => (
                                            <img 
                                                key={index}
                                                className="avatar" 
                                                src={avatarSrc || NoProfilePicture} 
                                                alt="Member profile" 
                                                onError={(e) => {
                                                    e.target.src = NoProfilePicture;
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </section>
                        ))
                    )}
                </main>
            </div>
        </div>
    );
}

export default SearchPage;