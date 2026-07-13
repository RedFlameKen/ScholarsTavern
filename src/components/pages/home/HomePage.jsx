import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../../styles/ColorPalette.css";
import "./HomePage.css";
import NavBar from "../../nav_bar/NavBar";
import addIcon from "../../../assets/icons/Add.svg";
import PrivateIcon from "../../../assets/icons/Private.svg";
import PublicIcon from "../../../assets/icons/Public.svg";

import { checkAuth, POST, GET } from "../../../request/requester";

function HomePage() {
    let navigate = useNavigate();
    useEffect(() => {
        async function verify() {
            if (!(await checkAuth({})).success) {
                navigate("/login", { replace: true });
            }
        }
        verify();
    }, [navigate])

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPublic, setPublic] = useState(false);
    const [tags, setTags] = useState([""]);

    const [groups, setGroups] = useState([]);
    const [groupName, setGroupName] = useState("");

    useEffect(() => {
        GET({
            endpoint: "/group/",
            on_finish: (response) => {
                if (!response.success) {
                    return;
                }

                let memberships = response.data.memberships;
                const newGroups = memberships.map((membership) => ({
                    data: {
                        id: membership.id,
                        name: membership.name,
                        is_public: membership.is_public
                    }
                }))
                setGroups([...groups, ...newGroups]);
            }
        })
    }, [])

    function handleTagChange(index, value) {
        const updatedTags = [...tags];
        updatedTags[index] = value;
        setTags(updatedTags);
    }

    function handleTagKeyDown(e, index) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (tags[index].trim() !== "") {
                setTags([...tags, ""]);
                setTimeout(() => {
                    const inputs = document.querySelectorAll(".tag_input_field");
                    if (inputs[index + 1]) inputs[index + 1].focus();
                }, 10);
            }
        }
    }

    function handleCreateGroup(e) {
        e.preventDefault();
        if (!groupName.trim()) return;

        const newGroup = {
            data: {
                name: groupName,
                tags: tags.filter(tag => tag.trim() !== ""),
                is_public: isPublic
            }
        };

        POST({
            endpoint: "/group/create",
            body: newGroup,
            on_finish: (response) => {
                if (response.success) {
                    setGroups([...groups, newGroup]);
                }
            },
        })

        closeModal();
    }

    // TODO: onclick, view chat view
    function createGroup(group) {
        console.log(group)
        return (
            <div 
                key={group.data.id}
                className="group_card"
                onClick={() => {
                    navigate(`/chat/${group.data.id}`)
                }}
            >
                <div className="group_card_banner">
                    <h3>{group.data.name}</h3>
                </div>
                <div className="group_card_body">
                    {/* Mid section can display tags or stay clean as pictured */}
                </div>
                <div className="group_card_footer">
                    <img
                        src={group.data.is_public ? PublicIcon : PrivateIcon}
                        alt={group.data.is_public}
                        className="card_visibility_icon"
                    />
                    <button type="button" className="card_menu_btn">
                        {/* Substitute with your menu icon/SVG or use three periods */}
                        <span className="dots_icon">⋮</span>
                    </button>
                </div>
            </div>
        )
    }

    const openModal = () => {
        setGroupName("");
        setTags([""]);
        setPublic(true);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

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
                    {/* 3. Render created group cards dynamically */}
                    {groups.map((group) => (
                        createGroup(group)
                    ))}

                    {/* The Create Group Trigger Card */}
                    <button className="create_card" type="button" onClick={openModal}>
                        <div className="create_card_icon">
                            <img src={addIcon} alt="Create group" />
                        </div>
                        <div className="create_card_text">Create Group</div>
                    </button>
                </section>
            </main>

            {/* Modal Layout */}
            <div className={`modal_overlay ${isModalOpen ? 'show' : ''}`} onClick={closeModal}>
                <div className="modal_content" onClick={(e) => e.stopPropagation()}>
                    <button className="close_btn" onClick={closeModal}>&times;</button>

                    <header className="modal_header">
                        <h2>Create Group</h2>
                    </header>

                    <form className="modal_form" onSubmit={handleCreateGroup}>
                        <div className="modal_input_group">
                            <label htmlFor="group_name" className="modal_section_label">Group Name</label>
                            <input
                                type="text"
                                id="group_name"
                                placeholder="Enter Group Name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="modal_input_group">
                            <label className="modal_section_label">Tags</label>
                            {tags.map((tag, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    className="tag_input_field"
                                    placeholder={index === 0 ? "Enter Tag (Press Enter to add more)" : "Enter Other Tag"}
                                    value={tag}
                                    onChange={(e) => handleTagChange(index, e.target.value)}
                                    onKeyDown={(e) => handleTagKeyDown(e, index)}
                                />
                            ))}
                        </div>

                        <div className="modal_visibility_group">
                            <label className="modal_visibility_option">
                                <span className="modal_visibility_label_text">
                                    <img src={PublicIcon} alt="Public" className="Public_icon" />
                                    Public
                                </span>
                                <input
                                    type="radio"
                                    id="public"
                                    name="visibility"
                                    value="public"
                                    checked={isPublic}
                                    onChange={() => { setPublic(true) }}
                                />
                            </label>

                            <label className="modal_visibility_option">
                                <span className="modal_visibility_label_text">
                                    <img src={PrivateIcon} alt="Private" className="Private_icon" />
                                    Private
                                </span>
                                <input
                                    type="radio"
                                    id="private"
                                    name="visibility"
                                    value="private"
                                    checked={!isPublic}
                                    onChange={() => { setPublic(false) }}
                                />
                            </label>
                        </div>

                        <button type="submit" className="modal_submit_btn">Create</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
