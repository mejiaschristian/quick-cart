function AdminAccounts() {
    return (
        <div className="container py-4">
            <div className="mb-4">
                <p className="text-success text-uppercase fw-bold small mb-1">
                    Access
                </p>
                <h1 className="h2 mb-2">Admin Accounts List</h1>
                <p className="text-body-secondary mb-0">
                    Manage internal admin accounts and permissions.
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
                                    <th>Role</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>QuickCart Admin</td>
                                    <td>admin@quickcart.local</td>
                                    <td>Super Admin</td>
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

export default AdminAccounts;
