function OrderList() {
    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Sales
                </p>
                <h1 className="h2 mb-2">Order List</h1>
                <p className="text-body-secondary mb-0">
                    Review recent customer orders and fulfillment status.
                </p>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Status</th>
                                    <th>Total</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>#1001</td>
                                    <td>Christian Mejias</td>
                                    <td>
                                        <span className="badge text-bg-success">
                                            Pending
                                        </span>
                                    </td>
                                    <td>₱850.00</td>
                                    <td>2026-09-14</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderList;
