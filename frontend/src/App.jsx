import { useState, useEffect } from 'react';
import { Home, Layout, Mail, Send, BarChart3, MessageSquare, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import CompanyInfo from './pages/CompanyInfo';
import CampaignScraper from './pages/CampaignScraper';
import EmailLists from './pages/EmailLists';
import EmailGeneration from './pages/EmailGeneration';
import SendCampaign from './pages/SendCampaign';
import EmailTracking from './pages/EmailTracking';
import RespondResponses from './pages/RespondResponses';
import './App.css';

const TABS = [
  { id: 'company', label: 'Company Info', icon: Home },
  { id: 'campaign', label: 'Campaign & Scraper', icon: Layout },
  { id: 'lists', label: 'Email Lists', icon: Mail },
  { id: 'generate', label: 'Generate Emails', icon: Mail },
  { id: 'send', label: 'Send Campaign', icon: Send },
  { id: 'tracking', label: 'Email Tracking', icon: BarChart3 },
  { id: 'responses', label: 'Respond', icon: MessageSquare },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('company');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // TODO: Initialize Supabase Auth and check user session
    const mockUser = { id: '1', email: 'user@dumroo.ai' };
    setUser(mockUser);
  }, []);

  function handleLogout() {
    // TODO: Logout via Supabase
    setUser(null);
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Email Outreach Platform</h1>
          <p>Sign in to continue</p>
          {/* TODO: Add Supabase Auth UI */}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="tab-content">
          {activeTab === 'company' && <CompanyInfo />}
          {activeTab === 'campaign' && <CampaignScraper />}
          {activeTab === 'lists' && <EmailLists />}
          {activeTab === 'generate' && <EmailGeneration />}
          {activeTab === 'send' && <SendCampaign />}
          {activeTab === 'tracking' && <EmailTracking />}
          {activeTab === 'responses' && <RespondResponses />}
        </div>
      </main>
    </div>
  );
}
