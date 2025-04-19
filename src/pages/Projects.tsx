import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Search } from "lucide-react";
import { ProjectForm } from "@/components/ProjectForm";
import { useQuery } from "@tanstack/react-query";
import { getProjects, getEnhancedTasks, getProjectsWithClients } from "@/lib/api-utils";
import { Project, Task } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

const Projects = () => {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects-with-clients"],
    queryFn: () => getProjectsWithClients(token),
    enabled: !!token
  });
  
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: () => getEnhancedTasks(token),
    enabled: !!token
  });
  
  // Filter projects based on search query
  const filteredProjects = projects.filter((project: Project) => 
    searchQuery === "" ||
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get tasks count for each project
  const getProjectTasksCount = (projectId: string) => {
    return allTasks.filter(task => task.projectId === projectId).length;
  };
  
  if (projectsLoading || tasksLoading) {
    return (
      <MainLayout title="Проекты">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Загрузка проектов...</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title="Проекты">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск проектов..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button className="w-full sm:w-auto gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить проект
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            tasksCount={getProjectTasksCount(project.id)}
          />
        ))}
        
        {filteredProjects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-muted-foreground">Проекты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
      
      <ProjectForm open={dialogOpen} onOpenChange={setDialogOpen} />
    </MainLayout>
  );
};

interface ProjectCardProps {
  project: Project;
  tasksCount: number;
}

const ProjectCard = ({ project, tasksCount }: ProjectCardProps) => {
  // Status color mapping
  const statusColors = {
    'active': 'default',
    'completed': 'secondary',
    'on-hold': 'outline'
  };
  
  // Status text mapping
  const statusText = {
    'active': 'Активный',
    'completed': 'Завершен',
    'on-hold': 'На паузе'
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd MMM yyyy", { locale: ru });
    } catch (error) {
      return "Нет даты";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              {project.client ? `Клиент: ${project.client.name}` : "Без клиента"}
            </CardDescription>
          </div>
          <Badge variant={statusColors[project.status] as any}>
            {statusText[project.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm mb-4">{project.description}</p>
        
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>Начало: {formatDate(project.startDate)}</span>
          </div>
          
          {project.endDate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>Конец: {formatDate(project.endDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">
          {tasksCount} {tasksCount === 1 ? 'задача' : tasksCount > 1 && tasksCount < 5 ? 'задачи' : 'задач'}
        </span>
        
        <div className="space-x-2">
          <Button variant="outline" size="sm">Детали</Button>
          <Button variant="outline" size="sm">Задачи</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Projects;
