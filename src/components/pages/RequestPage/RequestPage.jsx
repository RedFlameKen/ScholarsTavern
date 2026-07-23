import { useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "./RequestPage.css";
import Check from "../../../assets/icons/Check.svg"
import Close from "../../../assets/icons/Close.svg"

function RequestPage() {
    const [requests, setRequests] = useState([
        {
            id: 1,
            name: "Object Oriented Programming Fundamentals Group",
            bannerUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80"
        }
    ]);

    const handleAccept = (id) => {
        alert(`Accepted request #${id}`);
        setRequests((prev) => prev.filter((item) => item.id !== id));
    };

    const handleReject = (id) => {
        alert(`Rejected request #${id}`);
        setRequests((prev) => prev.filter((item) => item.id !== id));
    };

    function RequestItem({request}) {
        return (
            <div key={request.id} className="request-card">
                {request.bannerUrl && (
                    <div
                        className="request-card-banner"
                        style={{ backgroundImage: `url(${request.bannerUrl})` }}
                    />
                )}

                <div className="request-card-content">
                    <h2 className="request-group-title">{request.name}</h2>

                    <div className="request-actions">
                        <button
                            className="action-btn accept-btn"
                            onClick={() => handleAccept(request.id)}
                            title="Accept Request"
                            aria-label="Accept Request"
                        >
                            <img src={Check} alt="" />
                        </button>

                        <button
                            className="action-btn reject-btn"
                            onClick={() => handleReject(request.id)}
                            title="Reject Request"
                            aria-label="Reject Request"
                        >
                            <img src={Close} alt="" />
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="requests-page">
            <NavBar />

            <main className="requests-main">
                <header className="header">
                    <div>
                        <h1>Group Requests</h1>
                    </div>
                </header>
                <section className="requests-list">
                    {requests.length === 0 ? (
                        <p className="no-requests-msg">No pending requests.</p>
                    ) : (
                        requests.map((request) => (
                            <RequestItem request={request}/>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}

export default RequestPage;
