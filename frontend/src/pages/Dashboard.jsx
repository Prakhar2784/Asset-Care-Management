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
    <section className="dashboard-page" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        .dashboard-page {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          background-color: #F4F6F5 !important;
        }
        
        .dash-sidebar {
          background-color: #051C12 !important;
          border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        
        .dash-sidebar h2 {
          color: #FFFFFF !important;
        }
        
        .nav-item {
          color: #879A91 !important;
        }
        
        .nav-item:hover {
          background-color: rgba(255,255,255,0.03) !important;
          color: #FFFFFF !important;
        }
        
        .nav-item.active {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #FFFFFF !important;
          border-left: 3px solid #B4F105 !important;
        }
        
        .btn-primary {
          background-color: #051C12 !important;
          color: #B4F105 !important;
          border: 1px solid #051C12 !important;
          border-radius: 12px !important;
          font-weight: 800 !important;
        }
        
        .btn-primary:hover {
          background-color: #072F1F !important;
        }
        
        .dash-card {
          background: #FFFFFF !important;
          border: 1.5px solid #E9EFEF !important;
          box-shadow: 0 10px 30px rgba(11, 19, 15, 0.04) !important;
          border-radius: 18px !important;
          padding: 24px !important;
        }
        
        .dash-card p {
          color: #6C7E75 !important;
          font-weight: 700 !important;
        }
        
        .dash-card h2 {
          color: #0B130F !important;
          font-weight: 800 !important;
        }
        
        .trend-badge {
          background-color: rgba(180, 241, 5, 0.15) !important;
          color: #051C12 !important;
          border-radius: 50rem !important;
          font-weight: 800 !important;
        }
        
        .dash-panel {
          background: #FFFFFF !important;
          border: 1.5px solid #E9EFEF !important;
          box-shadow: 0 10px 30px rgba(11, 19, 15, 0.04) !important;
          border-radius: 18px !important;
        }
        
        .dash-ticket {
          border-bottom: 1px solid #E9EFEF !important;
        }
        
        .ticket-id {
          color: #051C12 !important;
          background-color: rgba(180, 241, 5, 0.15) !important;
          font-weight: 800 !important;
          border-radius: 6px !important;
          padding: 2px 6px !important;
        }
        
        .status-badge {
          border-radius: 6px !important;
          font-weight: 800 !important;
        }
      `}</style>
      <aside className="dash-sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="IAssetCare" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <h2>IAssetCare</h2>
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