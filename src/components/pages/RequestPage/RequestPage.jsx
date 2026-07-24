import { useEffect, useState } from "react";
import NavBar from "../../nav_bar/NavBar";
import "./RequestPage.css";
import Check from "../../../assets/icons/Check.svg"
import Close from "../../../assets/icons/Close.svg"
import { GET, POST } from "../../../request/requester";

function RequestPage() {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        GET({
            endpoint: "/group/request",
            on_finish: (response) => {
                if (!response.success) {
                    return
                }

                const requests = response.data.requests

                setRequests(requests)
            }
        })
    }, [])

    const handleAccept = (request) => {
        POST({
            endpoint: "/group/request/approve",
            body: {
                data: {
                    group_id: request.group_id,
                    requester_id: request.requester.id
                }
            },
            on_finish: (response) => {
                if (!response.success) {
                    alert("unable to accept the request");
                    return
                }
                setRequests((prev) => prev.filter((item) => item.id !== request.id));
                alert(`Accepted request #${request.id}`);
            }
        })
    };

    const handleReject = (request) => {
        POST({
            endpoint: "/group/request/reject",
            body: {
                data: {
                    group_id: request.group_id,
                    requester_id: request.requester.id
                }
            },
            on_finish: (response) => {
                if (!response.success) {
                    alert("unable to reject the request");
                    return
                }
                setRequests((prev) => prev.filter((item) => item.id !== request.id));
                alert(`Rejected request #${request.id}`);
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
                        <p>{`Requester: ${request.requester.first_name} ${request.requester.last_name}`}</p>
                    </div>

                    <div className="request-actions">
                        <button
                            className="action-btn accept-btn"
                            onClick={() => handleAccept(request)}
                            title="Accept Request"
                            aria-label="Accept Request"
                        >
                            <img src={Check} alt="" />
                        </button>

                        <button
                            className="action-btn reject-btn"
                            onClick={() => handleReject(request)}
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
                        <h1>Join Requests</h1>
                    </div>
                </header>
                <section className="requests-list">
                    {requests.length === 0 ? (
                        <p className="no-requests-msg">No join requests yet.</p>
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
