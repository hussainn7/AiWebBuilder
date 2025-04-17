
import { cn } from "@/lib/utils";
import { Status } from "@/lib/types";

const statusLabels: Record<Status, string> = {
  'draft': 'Черновик',
  'in-progress': 'В процессе',
  'under-review': 'На проверке',
  'completed': 'Завершено',
  'canceled': 'Отменено'
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  return (
    <span className={cn(
      `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`,
      {
        'bg-gray-100 text-gray-800': status === 'draft',
        'bg-blue-100 text-blue-800': status === 'in-progress',
        'bg-yellow-100 text-yellow-800': status === 'under-review',
        'bg-green-100 text-green-800': status === 'completed',
        'bg-red-100 text-red-800': status === 'canceled',
      },
      className
    )}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
