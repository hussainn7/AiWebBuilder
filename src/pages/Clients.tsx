import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Search } from "lucide-react";
import { ClientForm } from "@/components/ClientForm";
import { useQuery } from "@tanstack/react-query";
import { getClients, getEnhancedTasks } from "@/lib/api-utils";
import { Client, Task } from "@/lib/types";

const Clients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients
  });
  
  const { data: allTasks = [] } = useQuery({
    queryKey: ["enhanced-tasks"],
    queryFn: getEnhancedTasks
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
    </MainLayout>
  );
};

interface ClientCardProps {
  client: Client;
  tasksCount: number;
}

const ClientCard = ({ client, tasksCount }: ClientCardProps) => {
  return (
    <Card>
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
        
        {client.links.length > 0 && (
          <div className="space-y-2">
            {client.links.map((link, index) => (
              <a 
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
              >
                {link.replace(/https?:\/\//, '').replace(/\/$/, '')}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <span className="text-sm text-muted-foreground">
          {tasksCount} задач{tasksCount !== 1 && 'и'}
        </span>
        
        <div className="space-x-2">
          <Button variant="outline" size="sm">Проекты</Button>
          <Button variant="outline" size="sm">Задачи</Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Clients;
