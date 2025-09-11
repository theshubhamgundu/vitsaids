import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Crown, 
  Key, 
  User,
  UserPlus,
  UserMinus,
  Check,
  X
} from 'lucide-react';

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'admin' | 'attendee';
  joinedAt: Date;
  isOnline: boolean;
}

interface UserRoleManagerProps {
  users: UserRole[];
  currentUser: UserRole;
  onUpdateRole: (userId: string, newRole: 'organizer' | 'admin' | 'attendee') => void;
  onClose: () => void;
  isOpen: boolean;
}

export function UserRoleManager({ 
  users, 
  currentUser, 
  onUpdateRole, 
  onClose, 
  isOpen 
}: UserRoleManagerProps) {
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'admin' | 'attendee'>>({});

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Key className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'attendee') => {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const applyChanges = () => {
    Object.entries(pendingChanges).forEach(([userId, newRole]) => {
      onUpdateRole(userId, newRole);
    });
    setPendingChanges({});
    onClose();
  };

  const cancelChanges = () => {
    setPendingChanges({});
    onClose();
  };

  const getPendingRole = (user: UserRole) => {
    return pendingChanges[user.id] || user.role;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const canManageRoles = currentUser.role === 'organizer';

  if (!canManageRoles) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Promote attendees to admins or demote admins to attendees
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {users
            .filter(user => user.id !== currentUser.id) // Don't show current user
            .map((user) => {
              const currentRole = getPendingRole(user);
              const hasChange = pendingChanges[user.id] !== undefined;

              return (
                <div 
                  key={user.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    hasChange 
                      ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{user.name}</span>
                        {getRoleIcon(currentRole)}
                        <Badge className={`text-xs ${getRoleBadgeColor(currentRole)}`}>
                          {currentRole}
                        </Badge>
                        {hasChange && (
                          <Badge variant="outline" className="text-xs text-blue-600">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.role === 'attendee' && currentRole === 'attendee' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Promote
                      </Button>
                    )}

                    {user.role === 'admin' && currentRole === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user.id, 'attendee')}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Demote
                      </Button>
                    )}

                    {user.role === 'attendee' && currentRole === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => handleRoleChange(user.id, 'attendee')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel Promotion
                      </Button>
                    )}

                    {user.role === 'admin' && currentRole === 'attendee' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                        onClick={() => handleRoleChange(user.id, 'admin')}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel Demotion
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={cancelChanges}>
            Cancel
          </Button>
          <Button 
            onClick={applyChanges}
            disabled={!hasChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-1" />
            Apply Changes
          </Button>
        </div>

        {hasChanges && (
          <div className="text-sm text-muted-foreground text-center pt-2">
            {Object.keys(pendingChanges).length} role change(s) pending
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}