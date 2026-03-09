import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
    LayoutDashboard, Search, Star, GitCompare,
    Compass, Newspaper, Menu, ChevronLeft
} from 'lucide-react';
import './Layout.css';

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar } = useApp();
    const location = useLocation();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/discover', icon: Compass, label: 'Discover' },
        { path: '/watchlist', icon: Star, label: 'Watchlist' },
        { path: '/compare', icon: GitCompare, label: 'Compare' },
        { path: '/news', icon: Newspaper, label: 'News' },
    ];

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {!sidebarCollapsed && (
                    <div className="sidebar-logo">
                        <div className="logo-icon">S</div>
                        <span className="logo-text">SharesApp</span>
                    </div>
                )}
                <button className="btn-icon sidebar-toggle" onClick={toggleSidebar}>
                    {sidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <item.icon size={20} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {!sidebarCollapsed && (
                <div className="sidebar-footer">
                    <div className="market-status">
                        <div className={`status-dot ${isMarketOpen() ? 'open' : 'closed'}`} />
                        <span>{isMarketOpen() ? 'Market Open' : 'Market Closed'}</span>
                    </div>
                </div>
            )}
        </aside>
    );
}

function isMarketOpen() {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = ist.getDay();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();
    const time = hours * 60 + minutes;
    // NSE: Mon-Fri, 9:15 AM - 3:30 PM IST
    return day >= 1 && day <= 5 && time >= 555 && time <= 930;
}
