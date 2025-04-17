
import { cn } from "@/lib/utils";
import { Status } from "@/lib/types";

const statusLabels: Record<Status, string> = {
  'draft': 'Черновик',
  'in-progress': 'В процессе',
  'under-review': 'На проверке',
  'completed': 'Завершено',
  'canceled': 'Отменено'
};

// Shorter labels for mobile
const statusLabelsMobile: Record<Status, string> = {
  'draft': 'Черн.',
  'in-progress': 'В проц.',
  'under-review': 'Пров.',
  'completed': 'Заверш.',
  'canceled': 'Отмен.'
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
  useMobileLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, className, useMobileLabel = false, size = 'md' }: StatusBadgeProps) => {
  const label = useMobileLabel ? statusLabelsMobile[status] : statusLabels[status];
  
  return (
    <span className={cn(
      `inline-flex items-center rounded-full text-xs font-medium`,
      {
        'px-2 py-0.5': size === 'md',
        'px-1.5 py-0.5 text-[10px]': size === 'sm',
        'px-2.5 py-0.5 text-sm': size === 'lg',
        
        'bg-gray-100 text-gray-800': status === 'draft',
        'bg-blue-100 text-blue-800': status === 'in-progress',
        'bg-yellow-100 text-yellow-800': status === 'under-review',
        'bg-green-100 text-green-800': status === 'completed',
        'bg-red-100 text-red-800': status === 'canceled',
      },
      className
    )}>
      {label}
    </span>
  );
};

export default StatusBadge;
