
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
    <span className={cn(`status-badge status-${status}`, className)}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
