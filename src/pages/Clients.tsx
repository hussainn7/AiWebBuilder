import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomBadge } from "@/components/ui/custom-badge";
import { ExternalLink, Plus, Search, Calendar, FileText, Clock, Link2, Trash2 } from "lucide-react";
import { ClientForm } from "@/components/ClientForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClients, getEnhancedTasks, getProjects, deleteClient } from "@/lib/api-utils";
import { Client, Task, Project } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: clients = [], refetch: refetchClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => getClients(token || '')
  });
  
  const { data: allTasks = [] } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: () => getEnhancedTasks(token || '')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(token || '')
  });
  
  // Filter clients based on search query
  const filteredClients = (clients as Client[]).filter((client: Client) => 
    searchQuery === "" ||
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get tasks count for each client
  const getClientTasksCount = (clientId: string) => {
    return (allTasks as Task[]).filter(task => task.clientId === clientId).length;
  };

  // Get projects count for each client
  const getClientProjectsCount = (clientId: string) => {
    return (projects as Project[]).filter(project => project.clientId === clientId).length;
  };
  
  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(clientToDelete.id, token || '');
      
      // Show success message
      toast.success('Клиент успешно удален');
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      
      // If client details dialog is open and we're deleting the selected client, close it
      if (selectedClient && selectedClient.id === clientToDelete.id) {
        setClientDetailsOpen(false);
        setSelectedClient(null);
      }
      
      // Refresh data
      refetchClients();
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Не удалось удалить клиента');
    }
  };
  
  // Check if user can delete a client
  const canDeleteClient = (client: Client) => {
    return user?.role === 'admin' || client.createdBy === user?.id;
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening client details
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  return (
    <MainLayout title="Клиенты">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск клиентов..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button className="w-full sm:w-auto gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить клиента
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <ClientCard 
            key={client.id} 
            client={client} 
            tasksCount={getClientTasksCount(client.id)}
            projectsCount={getClientProjectsCount(client.id)}
            onClick={() => {
              setSelectedClient(client);
              setClientDetailsOpen(true);
            }}
            onDelete={canDeleteClient(client) ? (e) => openDeleteDialog(client, e) : undefined}
          />
        ))}
        
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-muted-foreground">Клиенты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
      
      <ClientForm open={dialogOpen} onOpenChange={setDialogOpen} />

      {selectedClient && (
        <ClientDetailsDialog 
          client={selectedClient} 
          open={clientDetailsOpen} 
          onOpenChange={setClientDetailsOpen}
          tasks={(allTasks as Task[]).filter(task => task.clientId === selectedClient.id)}
          projects={(projects as Project[]).filter(project => project.clientId === selectedClient.id)}
          onDelete={canDeleteClient(selectedClient) ? () => {
            setClientToDelete(selectedClient);
            setDeleteDialogOpen(true);
          } : undefined}
        />
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Клиент будет удален вместе со всеми связанными задачами.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

interface ClientCardProps {
  client: Client;
  tasksCount: number;
  projectsCount: number;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const ClientCard = ({ client, tasksCount, projectsCount, onClick, onDelete }: ClientCardProps) => {
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors relative" onClick={onClick}>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg pr-6">{client.name}</CardTitle>
        <CardDescription className="line-clamp-2">{client.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm mb-4">{client.description}</p>
        
        {client.links && client.links.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ссылки:</h4>
            <div className="space-y-1">
              {client.links.map((link, index) => (
                <a 
                  key={index} 
                  href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{tasksCount} задач</span>
        </div>
        <div className="flex items-center gap-1">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{projectsCount} проектов</span>
        </div>
      </CardFooter>
    </Card>
  );
};

interface ClientDetailsDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  projects: Project[];
  onDelete?: () => void;
}

const ClientDetailsDialog = ({ client, open, onOpenChange, tasks, projects, onDelete }: ClientDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Filter tasks for this client
  const clientTasks = tasks.filter(task => task.clientId === client.id);
  
  // Filter projects for this client
  const clientProjects = projects.filter(project => project.clientId === client.id);

  // Sort tasks by date (newest first)
  const sortedTasks = [...clientTasks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Group tasks by project
  const tasksByProject = clientTasks.reduce((acc, task) => {
    const projectId = task.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl">{client.name}</DialogTitle>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="mt-6">
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "overview" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("overview")}
            >
              Обзор
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "projects" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("projects")}
            >
              Проекты ({projects.length})
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "tasks" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("tasks")}
            >
              Задачи ({tasks.length})
            </button>
          </div>
          
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Описание</h3>
                  <p className="text-sm text-muted-foreground">{client.description}</p>
                </div>
                
                {client.website && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Веб-сайт</h3>
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1 hover:underline"
                    >
                      {client.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {client.contactPerson && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Контактное лицо</h3>
                    <p className="text-sm text-muted-foreground">{client.contactPerson}</p>
                  </div>
                )}
                
                {client.contactEmail && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Email</h3>
                    <a 
                      href={`mailto:${client.contactEmail}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {client.contactEmail}
                    </a>
                  </div>
                )}
                
                {client.contactPhone && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Телефон</h3>
                    <a 
                      href={`tel:${client.contactPhone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {client.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === "projects" && (
            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Нет проектов для этого клиента</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {project.startDate && format(new Date(project.startDate), "dd MMM yyyy", { locale: ru })}
                            {project.endDate && ` - ${format(new Date(project.endDate), "dd MMM yyyy", { locale: ru })}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {clientTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Нет задач для этого клиента</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.keys(tasksByProject).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(tasksByProject).map(([projectId, tasks]) => {
                        const project = projectId !== 'no-project' 
                          ? clientProjects.find(p => p.id === projectId) 
                          : null;
                        
                        return (
                          <div key={projectId} className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              {project ? project.name : 'Задачи без проекта'}
                              <CustomBadge variant={project?.status === 'active' ? 'default' : 
                                project?.status === 'completed' ? 'secondary' : 'outline'}>
                                {project?.status === 'active' ? 'Активный' : 
                                 project?.status === 'completed' ? 'Завершен' : 'На паузе'}
                              </CustomBadge>
                            </h4>
                            <div className="space-y-2">
                              {tasks.map(task => (
                                <Card key={task.id}>
                                  <CardHeader className="p-3 pb-2">
                                    <div className="flex justify-between items-start">
                                      <CardTitle className="text-base">{task.title}</CardTitle>
                                      <CustomBadge variant={
                                        task.status === 'completed' ? 'success' :
                                        task.status === 'in-progress' ? 'default' :
                                        task.status === 'under-review' ? 'warning' :
                                        task.status === 'canceled' ? 'destructive' : 'secondary'
                                      }>
                                        {task.status === 'draft' ? 'Черновик' :
                                         task.status === 'in-progress' ? 'В процессе' :
                                         task.status === 'under-review' ? 'На проверке' :
                                         task.status === 'completed' ? 'Завершено' : 'Отменено'}
                                      </CustomBadge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>Срок: {format(new Date(task.dueDate), 'dd MMM yyyy', {locale: ru})}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Нет задач для этого клиента</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Clients;
