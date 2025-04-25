import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Admin = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('team');
  
  // User management
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'employee' as 'team-lead' | 'employee'
  });
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!token
  });
  
  // Fetch tasks for workload analysis
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
    enabled: !!token
  });
  
  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await fetch('http://localhost:5001/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      if (!response.ok) throw new Error('Failed to add user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setNewUser({ email: '', firstName: '', lastName: '', password: '', role: 'employee' });
      toast.success('User added successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add user');
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  });
  
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(newUser);
  };
  
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  // Calculate employee workload data
  const employeeWorkloadData = users.map((user: any) => {
    const userTasks = tasks.filter((task: any) => 
      task.assignees && task.assignees.some((assignee: any) => assignee.id === user.id)
    );
    
    const tasksInProgress = userTasks.filter((task: any) => task.status === 'in-progress').length;
    const tasksCompleted = userTasks.filter((task: any) => task.status === 'completed').length;
    const tasksPending = userTasks.filter((task: any) => task.status === 'draft').length;
    const tasksReview = userTasks.filter((task: any) => task.status === 'under-review').length;
    
    return {
      name: `${user.firstName} ${user.lastName}`,
      total: userTasks.length,
      inProgress: tasksInProgress,
      completed: tasksCompleted,
      pending: tasksPending,
      review: tasksReview
    };
  });
  
  // Calculate task status distribution
  const taskStatusData = [
    { status: 'Draft', count: tasks.filter((task: any) => task.status === 'draft').length },
    { status: 'In Progress', count: tasks.filter((task: any) => task.status === 'in-progress').length },
    { status: 'Under Review', count: tasks.filter((task: any) => task.status === 'under-review').length },
    { status: 'Completed', count: tasks.filter((task: any) => task.status === 'completed').length },
    { status: 'Canceled', count: tasks.filter((task: any) => task.status === 'canceled').length },
  ];
  
  return (
    <MainLayout title="Team Management">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="workload">Employee Workload</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
        </TabsList>
        
        {/* Team Management Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Team Member</CardTitle>
              <CardDescription>Create a new user account</CardDescription>
            </CardHeader>
            <form onSubmit={handleAddUser}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newUser.role}
                    onValueChange={(value: 'team-lead' | 'employee') => 
                      setNewUser({...newUser, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-lead">Team Lead</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending ? 'Adding...' : 'Add Team Member'}
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Manage Team Members</CardTitle>
              <CardDescription>View and manage existing team members</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <p className="text-center py-4">Loading team members...</p>
              ) : users.length === 0 ? (
                <p className="text-center py-4">No team members found</p>
              ) : (
                <div className="space-y-4">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className="inline-block px-2 py-1 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          {user.role === 'admin' ? 'Admin' : user.role === 'team-lead' ? 'Team Lead' : 'Employee'}
                        </span>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending || user.role === 'admin'}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Employee Workload Tab */}
        <TabsContent value="workload">
          <Card>
            <CardHeader>
              <CardTitle>Employee Workload</CardTitle>
              <CardDescription>Current task distribution among team members</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks || isLoadingUsers ? (
                <p className="text-center py-4">Loading workload data...</p>
              ) : employeeWorkloadData.length === 0 ? (
                <p className="text-center py-4">No workload data available</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={employeeWorkloadData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inProgress" name="In Progress" fill="#8884d8" />
                      <Bar dataKey="pending" name="Pending" fill="#82ca9d" />
                      <Bar dataKey="review" name="Under Review" fill="#ffc658" />
                      <Bar dataKey="completed" name="Completed" fill="#0088fe" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Analytics Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Task Status Distribution</CardTitle>
              <CardDescription>Overview of tasks by their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <p className="text-center py-4">Loading task data...</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={taskStatusData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Number of Tasks" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Admin;
