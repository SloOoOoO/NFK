import { Bell, FileText, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MorningBriefingProps {
  urgentDeadlines: number;
  newDocuments: number;
  unreadMessages: number;
}

export default function MorningBriefingWidget({ urgentDeadlines, newDocuments, unreadMessages }: MorningBriefingProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold text-textPrimary dark:text-white mb-4">
        ☀️ Morning Briefing
      </h2>
      
      <div className="space-y-4">
        <Link to="/portal/cases" className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-textPrimary dark:text-white">Urgent Deadlines</span>
          </div>
          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{urgentDeadlines}</span>
        </Link>
        
        <Link to="/portal/documents" className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-textPrimary dark:text-white">New Documents</span>
          </div>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{newDocuments}</span>
        </Link>
        
        <Link to="/portal/messages" className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-textPrimary dark:text-white">Unread Messages</span>
          </div>
          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{unreadMessages}</span>
        </Link>
      </div>
    </div>
  );
}
