import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import MorningBriefingWidget from '../../components/dashboard/MorningBriefingWidget';
import RevenuePulseWidget from '../../components/dashboard/RevenuePulseWidget';
import CriticalFristenWidget from '../../components/dashboard/CriticalFristenWidget';
import RecentActivityWidget from '../../components/dashboard/RecentActivityWidget';
import { authAPI } from '../../services/api';
import axios from 'axios';

interface DashboardData {
  briefing: {
    urgentDeadlines: number;
    newDocuments: number;
    unreadMessages: number;
  };
  performance: {
    casesClosedThisMonth: number;
    casesClosedLastMonth: number;
    trend: 'up' | 'down';
    percentageChange: number;
  };
  deadlines: Array<{
    id: number;
    clientName: string;
    type: string;
    dueDate: string;
    status: 'overdue' | 'urgent' | 'soon';
    clientsCount?: number;
  }>;
  activities: Array<{
    id: number;
    type: 'document' | 'case' | 'message';
    description: string;
    timestamp: string;
    actor: string;
  }>;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    briefing: { urgentDeadlines: 0, newDocuments: 0, unreadMessages: 0 },
    performance: { casesClosedThisMonth: 0, casesClosedLastMonth: 0, trend: 'up', percentageChange: 0 },
    deadlines: [],
    activities: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all dashboard data in parallel
      const [userRes, briefingRes, performanceRes, deadlinesRes, activitiesRes] = await Promise.allSettled([
        authAPI.getCurrentUser(),
        axios.get('/api/v1/dashboard/briefing', config),
        axios.get('/api/v1/dashboard/performance', config),
        axios.get('/api/v1/dashboard/deadlines', config),
        axios.get('/api/v1/dashboard/activities', config),
      ]);

      // Process current user
      if (userRes.status === 'fulfilled') {
        setCurrentUser(userRes.value.data);
      }

      // Process briefing data
      if (briefingRes.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, briefing: briefingRes.value.data }));
      }

      // Process performance data
      if (performanceRes.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, performance: performanceRes.value.data }));
      }

      // Process deadlines data
      if (deadlinesRes.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, deadlines: deadlinesRes.value.data }));
      }

      // Process activities data
      if (activitiesRes.status === 'fulfilled') {
        setDashboardData(prev => ({ ...prev, activities: activitiesRes.value.data }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Welcome Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Command Center{currentUser?.firstName ? `, ${currentUser.firstName} ${currentUser.lastName}` : ''} 👋
              </h1>
              <p className="text-white/90 text-lg">
                {new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                🎯
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-textSecondary dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Bento Grid Layout - 2x2 on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <MorningBriefingWidget 
                urgentDeadlines={dashboardData.briefing.urgentDeadlines}
                newDocuments={dashboardData.briefing.newDocuments}
                unreadMessages={dashboardData.briefing.unreadMessages}
              />
              
              <RevenuePulseWidget 
                casesClosedThisMonth={dashboardData.performance.casesClosedThisMonth}
                casesClosedLastMonth={dashboardData.performance.casesClosedLastMonth}
                trend={dashboardData.performance.trend}
                percentageChange={dashboardData.performance.percentageChange}
              />
              
              <CriticalFristenWidget 
                deadlines={dashboardData.deadlines}
                className="md:col-span-2"
              />
              
              <RecentActivityWidget 
                activities={dashboardData.activities}
                className="md:col-span-2"
              />
            </div>

            {/* Quick Actions Section */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-textPrimary dark:text-white mb-4">⚡ Quick Actions</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/portal/clients" className="block">
                  <button className="w-full btn-primary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                    <span>👥</span>
                    <span>Clients</span>
                  </button>
                </Link>
                <Link to="/portal/cases" className="block">
                  <button className="w-full btn-primary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                    <span>📁</span>
                    <span>Cases</span>
                  </button>
                </Link>
                <Link to="/portal/documents" className="block">
                  <button className="w-full btn-secondary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                    <span>📤</span>
                    <span>Documents</span>
                  </button>
                </Link>
                <Link to="/portal/calendar" className="block">
                  <button className="w-full btn-secondary text-left flex items-center gap-3 hover:scale-105 transition-transform">
                    <span>📅</span>
                    <span>Calendar</span>
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
