function CustomerAccounts() {
    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Accounts
                </p>
                <h1 className="h2 mb-2">Customer Accounts List</h1>
                <p className="text-body-secondary mb-0">
                    Review registered customer profiles and account activity.
                </p>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Christian Mejias</td>
                                    <td>christianmejiasgd@gmail.com</td>
                                    <td>09123456789</td>
                                    <td>
                                        <span className="badge text-bg-success">
                                            Active
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomerAccounts;
