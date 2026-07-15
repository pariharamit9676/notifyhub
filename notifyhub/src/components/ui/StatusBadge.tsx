import React from 'react';

type StatusType = 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'FAILED' | 'BOUNCE' | 'DROPPED' | 'QUEUED' | 'PROCESSING';

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100/50 dot-emerald';
      case 'FAILED':
      case 'BOUNCE':
      case 'DROPPED':
        return 'bg-red-50 text-red-700 border-red-100/50 dot-red';
      case 'OPENED':
      case 'CLICKED':
        return 'bg-blue-50 text-blue-700 border-blue-100/50 dot-blue';
      case 'QUEUED':
        return 'bg-slate-50 text-slate-700 border-slate-200/50 dot-slate';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-100/50 dot-amber animate-pulse-dot';
    }
  };

  const getDotClass = (styles: string) => {
    if (styles.includes('dot-emerald')) return 'bg-emerald-500';
    if (styles.includes('dot-red')) return 'bg-red-500';
    if (styles.includes('dot-blue')) return 'bg-blue-500';
    if (styles.includes('dot-slate')) return 'bg-slate-400';
    return 'bg-amber-500 animate-pulse';
  };

  const getLabel = () => {
    if (status === 'SENT') return 'Sent';
    if (status === 'DELIVERED') return 'Delivered';
    if (status === 'OPENED') return 'Opened';
    if (status === 'CLICKED') return 'Clicked';
    if (status === 'FAILED') return 'Failed';
    if (status === 'BOUNCE' || status === 'DROPPED') return 'Bounced';
    if (status === 'QUEUED') return 'Queued';
    return 'Processing';
  };

  const styles = getStyles();

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotClass(styles)}`}></span>
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
