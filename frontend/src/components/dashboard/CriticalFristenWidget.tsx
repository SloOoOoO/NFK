import { AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Deadline {
  id: number;
  clientName: string;
  type: string;
  dueDate: string;
  status: 'overdue' | 'urgent' | 'soon';
  clientsCount?: number;
}

interface CriticalFristenProps {
  deadlines: Deadline[];
  className?: string;
}

export default function CriticalFristenWidget({ deadlines, className = '' }: CriticalFristenProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'urgent':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'soon':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'urgent':
        return <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <h2 className="text-xl font-semibold text-textPrimary dark:text-white mb-4">
        ⏰ Critical Fristen (Next 48h)
      </h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {deadlines.length === 0 ? (
          <div className="text-center py-8 text-textSecondary dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No critical deadlines in the next 48 hours</p>
          </div>
        ) : (
          deadlines.map((deadline) => (
            <div
              key={deadline.id}
              className={`border-l-4 p-4 rounded-r-lg ${getStatusColor(deadline.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(deadline.status)}
                    <h3 className="font-semibold text-textPrimary dark:text-white">
                      {deadline.type}
                    </h3>
                  </div>
                  <p className="text-sm text-textSecondary dark:text-gray-400">
                    {deadline.clientName}
                    {deadline.clientsCount && ` (${deadline.clientsCount} clients)`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-textPrimary dark:text-white">
                    {format(new Date(deadline.dueDate), 'dd.MM.yyyy', { locale: de })}
                  </p>
                  <p className="text-xs text-textSecondary dark:text-gray-400">
                    {format(new Date(deadline.dueDate), 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
