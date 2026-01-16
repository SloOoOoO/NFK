import { TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenuePulseProps {
  casesClosedThisMonth: number;
  casesClosedLastMonth: number;
  trend: 'up' | 'down';
  percentageChange: number;
}

export default function RevenuePulseWidget({ 
  casesClosedThisMonth, 
  casesClosedLastMonth, 
  trend, 
  percentageChange 
}: RevenuePulseProps) {
  const data = [
    { name: 'Last Month', value: casesClosedLastMonth },
    { name: 'This Month', value: casesClosedThisMonth },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold text-textPrimary dark:text-white mb-4">
        📊 Performance Pulse
      </h2>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-textSecondary dark:text-gray-400">Cases Closed This Month</p>
          <p className="text-3xl font-bold text-primary dark:text-blue-400">{casesClosedThisMonth}</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            <span className="text-xl font-bold">{Math.abs(percentageChange)}%</span>
          </div>
          <p className="text-xs text-textSecondary dark:text-gray-400">vs last month</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="currentColor" className="dark:text-gray-400" />
          <YAxis tick={{ fontSize: 12 }} stroke="currentColor" className="dark:text-gray-400" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
