
import { User } from "@/lib/types";
import UserAvatar from "./UserAvatar";

interface UserAvatarGroupProps {
  users: User[];
  max?: number;
}

const UserAvatarGroup = ({ users, max = 3 }: UserAvatarGroupProps) => {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <div key={user.id} className="relative inline-block border-2 border-background rounded-full">
          <UserAvatar user={user} size="sm" />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className="relative inline-block bg-secondary text-secondary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs border-2 border-background">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default UserAvatarGroup;
