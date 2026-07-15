import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  bgClass: string;
  loading?: boolean;
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, bgClass, loading, description }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{loading ? '...' : value}</h3>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div className={`text-xl ${bgClass} p-2.5 rounded-lg border border-gray-100`}>{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
