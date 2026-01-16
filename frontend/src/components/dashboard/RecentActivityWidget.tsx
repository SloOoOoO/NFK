import { FileText, Briefcase, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Activity {
  id: number;
  type: 'document' | 'case' | 'message';
  description: string;
  timestamp: string;
  actor: string;
}

interface RecentActivityProps {
  activities: Activity[];
  className?: string;
}

export default function RecentActivityWidget({ activities, className = '' }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'case':
        return <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 dark:bg-blue-900/40';
      case 'case':
        return 'bg-green-100 dark:bg-green-900/40';
      case 'message':
        return 'bg-purple-100 dark:bg-purple-900/40';
      default:
        return 'bg-gray-100 dark:bg-gray-900/40';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <h2 className="text-xl font-semibold text-textPrimary dark:text-white mb-4">
        📋 Recent Activity
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-textSecondary dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityBg(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-textPrimary dark:text-white font-medium mb-1">
                  {activity.description}
                </p>
                <p className="text-xs text-textSecondary dark:text-gray-400">
                  {activity.actor} • {formatDistanceToNow(new Date(activity.timestamp), { 
                    addSuffix: true,
                    locale: de 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
