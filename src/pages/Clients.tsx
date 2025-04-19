import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Search, Calendar, FileText, Clock, Link2 } from "lucide-react";
import { ClientForm } from "@/components/ClientForm";
import { useQuery } from "@tanstack/react-query";
import { getClients, getEnhancedTasks, getProjects } from "@/lib/api-utils";
import { Client, Task, Project } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients
  });
  
  const { data: allTasks = [] } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: getEnhancedTasks
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects
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

  // Open client details dialog
  const openClientDetails = (client: Client) => {
    setSelectedClient(client);
    setClientDetailsOpen(true);
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
            onClick={() => openClientDetails(client)}
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
          tasks={allTasks as Task[]}
          projects={projects as Project[]}
        />
      )}
    </MainLayout>
  );
};

interface ClientCardProps {
  client: Client;
  tasksCount: number;
  projectsCount: number;
  onClick: () => void;
}

const ClientCard = ({ client, tasksCount, projectsCount, onClick }: ClientCardProps) => {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {client.name}
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status === 'active' ? 'Активный' : 'Неактивный'}
          </Badge>
        </CardTitle>
        <CardDescription>{client.contactInfo}</CardDescription>
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
}

const ClientDetailsDialog = ({ client, open, onOpenChange, tasks, projects }: ClientDetailsDialogProps) => {
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
          <DialogTitle className="flex justify-between items-center">
            {client.name}
            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
              {client.status === 'active' ? 'Активный' : 'Неактивный'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Контактная информация:</h3>
                <p className="text-sm">{client.contactInfo}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium">Описание:</h3>
                <p className="text-sm">{client.description}</p>
              </div>

              {client.links && client.links.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium">Ссылки:</h3>
                  <div className="space-y-1 mt-2">
                    {client.links.map((link, index) => (
                      <a 
                        key={index} 
                        href={link.startsWith('http') ? link : `https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium">Проекты ({clientProjects.length}):</h3>
                {clientProjects.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {clientProjects.map(project => (
                      <div key={project.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{project.name}</h4>
                          <Badge variant={project.status === 'active' ? 'default' : 
                            project.status === 'completed' ? 'success' : 'secondary'}>
                            {project.status === 'active' ? 'Активный' : 
                             project.status === 'completed' ? 'Завершен' : 'На паузе'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Начало: {format(new Date(project.startDate), 'dd MMM yyyy', {locale: ru})}</span>
                          {project.endDate && (
                            <span>- {format(new Date(project.endDate), 'dd MMM yyyy', {locale: ru})}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">Нет связанных проектов</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">Статистика:</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-medium">Всего задач</h4>
                    <p className="text-2xl font-bold">{clientTasks.length}</p>
                  </div>
                  <div className="p-3 border rounded-md">
                    <h4 className="text-sm font-medium">Всего проектов</h4>
                    <p className="text-2xl font-bold">{clientProjects.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <h3 className="text-lg font-medium">Задачи по проектам</h3>
            
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
                        <Badge variant="outline">{tasks.length}</Badge>
                      </h4>
                      <div className="space-y-2">
                        {tasks.map(task => (
                          <div key={task.id} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center">
                              <h5 className="font-medium">{task.title}</h5>
                              <Badge variant={
                                task.status === 'completed' ? 'success' :
                                task.status === 'in-progress' ? 'default' :
                                task.status === 'under-review' ? 'warning' :
                                task.status === 'canceled' ? 'destructive' : 'secondary'
                              }>
                                {task.status === 'completed' ? 'Завершена' :
                                 task.status === 'in-progress' ? 'В работе' :
                                 task.status === 'under-review' ? 'На проверке' :
                                 task.status === 'canceled' ? 'Отменена' : 'Черновик'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Срок: {format(new Date(task.dueDate), 'dd MMM yyyy', {locale: ru})}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Нет задач для этого клиента</p>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h3 className="text-lg font-medium">История взаимодействий</h3>
            
            {sortedTasks.length > 0 ? (
              <div className="space-y-4">
                {sortedTasks.map(task => {
                  const project = task.projectId 
                    ? clientProjects.find(p => p.id === task.projectId) 
                    : null;
                  
                  return (
                    <div key={task.id} className="flex gap-4 p-4 border rounded-md">
                      <div className="flex-shrink-0 mt-0.5">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <h4 className="font-medium">{task.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              task.status === 'completed' ? 'success' :
                              task.status === 'in-progress' ? 'default' :
                              task.status === 'under-review' ? 'warning' :
                              task.status === 'canceled' ? 'destructive' : 'secondary'
                            }>
                              {task.status === 'completed' ? 'Завершена' :
                               task.status === 'in-progress' ? 'В работе' :
                               task.status === 'under-review' ? 'На проверке' :
                               task.status === 'canceled' ? 'Отменена' : 'Черновик'}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-muted-foreground">
                          {project && (
                            <div className="flex items-center gap-1">
                              <Link2 className="h-3 w-3" />
                              <span>Проект: {project.name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Создана: {format(new Date(task.createdAt), 'dd MMM yyyy', {locale: ru})}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Срок: {format(new Date(task.dueDate), 'dd MMM yyyy', {locale: ru})}</span>
                          </div>
                        </div>
                        
                        {task.comments && task.comments.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-2">Комментарии:</h5>
                            <div className="space-y-2">
                              {task.comments.map(comment => (
                                <div key={comment.id} className="text-xs p-2 bg-muted rounded-md">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{comment.user.name}</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm', {locale: ru})}
                                    </span>
                                  </div>
                                  <p className="mt-1">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Нет истории взаимодействий для этого клиента</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Clients;
