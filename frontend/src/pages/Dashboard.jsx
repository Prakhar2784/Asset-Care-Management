import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { label: "Total Assets", value: "1,248", trend: "+12.5%", isPositive: true },
    { label: "In Warranty", value: "824", trend: "+4.2%", isPositive: true },
    { label: "Open Tickets", value: "31", trend: "-2.1%", isPositive: true },
    { label: "Pending Approvals", value: "12", trend: "Requires Action", isAlert: true },
  ];

  const recentTickets = [
    { id: "SRV-089", issue: "Dell Latitude 5420 display flickering", status: "Pending Approval", priority: "High" },
    { id: "SRV-088", issue: "Voltas 1.5T AC cooling degraded", status: "Vendor Assigned", priority: "Medium" },
    { id: "SRV-087", issue: "Canon ImageRunner paper jam", status: "Resolved", priority: "Low" },
  ];

  return (
    <section className="dashboard-page">
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">AC</div>
          <h2>AssetCare</h2>
        </div>
        
        <nav className="sidebar-nav">
          <Link className="nav-item" to="/">Website</Link>
          <Link className="nav-item active" to="/dashboard">Dashboard</Link>
          <Link className="nav-item" to="/modules">Modules</Link>
          <Link className="nav-item" to="/workflow">Workflow</Link>
        </nav>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="header-text">
            <h1>System Overview</h1>
            <p>Real-time telemetry for asset service and warranty management.</p>
          </div>
          <Link to="/" className="btn btn-primary">
            Exit to Website
          </Link>
        </header>

        <div className="dash-cards">
          {stats.map((stat, index) => (
            <div className="dash-card" key={index}>
              <div className="card-header">
                <p>{stat.label}</p>
              </div>
              <div className="card-body">
                <h2>{stat.value}</h2>
                <span className={`trend-badge ${stat.isAlert ? 'alert' : (stat.isPositive ? 'positive' : 'negative')}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <div className="panel-header">
            <h3>Recent Service Tickets</h3>
            <button className="btn-text">View All</button>
          </div>

          <div className="ticket-list">
            {recentTickets.map((ticket) => (
              <div className="dash-ticket" key={ticket.id}>
                <div className="ticket-info">
                  <span className="ticket-id">{ticket.id}</span>
                  <h4>{ticket.issue}</h4>
                </div>
                <div className="ticket-meta">
                  <span className={`status-badge ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
};

export default Dashboard;