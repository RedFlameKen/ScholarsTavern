import { useEffect, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "./PendingPage.css";
import Close from "../../../assets/icons/Close.svg"
import { GET, POST } from "../../../request/requester";

function RequestPage() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        GET({
            endpoint: "/group/pending",
            on_finish: (response) => {
                if (!response.success) {
                    return
                }

                const requests = response.data.requests

                setRequests(requests)
            }
        })
    }, [])

    const handleCancel = (request) => {
        POST({
            endpoint: "/group/pending/cancel",
            body: {
                data: {
                    group_id: request.group_id,
                }
            },
            on_finish: (response) => {
                if (!response.success) {
                    alert("unable to cancel the request");
                    return
                }
                setRequests((prev) => prev.filter((item) => item.id !== request.id));
                alert(`Canceled request #${request.id}`);
            }

        })
    };

    function RequestItem({request}) {
        return (
            <div className="request-card">
                {request.bannerUrl && (
                    <div
                        className="request-card-banner"
                        style={{ backgroundImage: `url(${request.bannerUrl})` }}
                    />
                )}

                <div className="request-card-content">
                    <div className="request-card-labels">
                        <h2 className="request-group-title">{request.name}</h2>
                    </div>

                    <div className="request-actions">
                        <button
                            className="action-btn reject-btn"
                            onClick={() => handleCancel(request)}
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
                        <h1>Pending Requests</h1>
                    </div>
                </header>
                <section className="requests-list">
                    {requests.length === 0 ? (
                        <p className="no-requests-msg">You have no pending requests.</p>
                    ) : (
                        requests.map((request) => (
                            <RequestItem key={request.id} request={request}/>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}

export default RequestPage;
