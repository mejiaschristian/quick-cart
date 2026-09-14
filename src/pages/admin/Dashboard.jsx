function Dashboard() {
    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Dashboard
                </p>
                <h1 className="h2 mb-2">Dashboard (Analytics)</h1>
                <p className="text-body-secondary mb-0">
                    Store activity, revenue, and performance metrics.
                </p>
            </div>

            <div className="row g-3">
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="text-muted small">
                                Today’s sales
                            </div>
                            <div className="display-6 fw-bold text-success">
                                ₱0
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="text-muted small">Orders</div>
                            <div className="display-6 fw-bold text-success">
                                0
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="text-muted small">Customers</div>
                            <div className="display-6 fw-bold text-success">
                                0
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            <div className="text-muted small">Products</div>
                            <div className="display-6 fw-bold text-success">
                                0
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
