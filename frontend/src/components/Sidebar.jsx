import { LogOut } from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ tabs, activeTab, onTabChange, user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">PR Outreach</h1>
        <p className="tagline">Email Campaign Manager</p>
      </div>

      <nav className="sidebar-nav">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
