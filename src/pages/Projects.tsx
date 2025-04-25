import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Search, Trash2 } from "lucide-react";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectDetail } from "@/components/ProjectDetail";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProjects, getEnhancedTasks, getProjectsWithClients, deleteProject } from "@/lib/api-utils";
import { Project, Task } from "@/lib/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const Projects = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  const { data: projects = [], isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
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
  
  // Check if user can edit a project
  const canEditProject = (project: Project) => {
    return user?.role === 'admin' || project.createdBy === user?.id;
  };

  // Check if user can delete a project
  const canDeleteProject = (project: Project) => {
    return user?.role === 'admin' || project.createdBy === user?.id;
  };
  
  // Check if user is assigned to a project
  const isUserAssignedToProject = (project: Project) => {
    if (!user) return false;
    return project.assignedUserIds && project.assignedUserIds.includes(user.id);
  };
  
  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteProject(projectToDelete.id, token || '');
      
      // Show success message
      toast.success('Проект успешно удален');
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      // Refresh data
      refetchProjects();
      queryClient.invalidateQueries({ queryKey: ["enhanced-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Не удалось удалить проект');
    }
  };
  
  // Open project details
  const openProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening project details
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };
  
  if (projectsLoading || tasksLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Загрузка проектов...</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">Проекты</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск проектов..."
                className="pl-8 w-full sm:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button className="gap-1" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Добавить проект
            </Button>
          </div>
        </div>
        
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Проекты не найдены</p>
            <p className="text-sm text-muted-foreground mt-1">Попробуйте изменить параметры поиска или добавьте новый проект</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project: Project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                tasksCount={getProjectTasksCount(project.id)}
                onDelete={canDeleteProject(project) ? (e) => openDeleteDialog(project, e) : undefined}
                onClick={() => openProjectDetails(project)}
              />
            ))}
          </div>
        )}
      </div>
      
      <ProjectForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      
      <ProjectDetail
        project={selectedProject}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Проект будет удален вместе со всеми связанными задачами.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

interface ProjectCardProps {
  project: Project;
  tasksCount: number;
  onDelete?: (e: React.MouseEvent) => void;
  onClick: () => void;
}

const ProjectCard = ({ project, tasksCount, onDelete, onClick }: ProjectCardProps) => {
  const { user } = useAuth();
  
  // Check if user can delete a project
  const canDelete = () => {
    if (!user) return false;
    return user.role === 'admin' || project.createdBy === user.id;
  };
  
  // Check if user is assigned to a project
  const isAssigned = () => {
    if (!user) return false;
    return project.assignedUserIds && project.assignedUserIds.includes(user.id);
  };
  
  return (
    <Card className="cursor-pointer hover:border-primary/50 transition-colors relative" onClick={onClick}>
      {onDelete && canDelete() && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{project.name}</h3>
            {isAssigned() && (
              <Badge variant="outline" className="bg-blue-50">Вы назначены</Badge>
            )}
          </div>
        </div>
        
        <CardDescription className="line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {project.startDate && format(new Date(project.startDate), "dd MMM yyyy", { locale: ru })}
            {project.endDate && ` - ${format(new Date(project.endDate), "dd MMM yyyy", { locale: ru })}`}
          </span>
        </div>
        
        {project.client && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {project.client.name}
            </Badge>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Badge variant={
          project.status === 'active' ? 'default' :
          project.status === 'completed' ? 'secondary' :
          'outline'
        }>
          {project.status === 'active' ? 'Активный' :
           project.status === 'completed' ? 'Завершен' :
           'На паузе'}
        </Badge>
        
        <div className="text-xs text-muted-foreground">
          {tasksCount} задач
        </div>
      </CardFooter>
    </Card>
  );
};

export default Projects;
