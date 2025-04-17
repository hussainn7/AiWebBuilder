
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { addClient } from "@/lib/api-utils";

const clientSchema = z.object({
  name: z.string().min(1, "Название клиента обязательно"),
  contactInfo: z.string().min(1, "Контактная информация обязательна"),
  description: z.string().min(1, "Описание обязательно"),
  links: z.string().optional(),
  status: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientForm({ open, onOpenChange }: ClientFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactInfo: "",
      description: "",
      links: "",
      status: true,
    },
  });

  async function onSubmit(values: ClientFormValues) {
    try {
      const links = values.links ? values.links.split("\n").filter(link => link.trim() !== "") : [];
      
      await addClient({
        name: values.name,
        contactInfo: values.contactInfo,
        description: values.description,
        links: links,
        status: values.status ? "active" : "inactive",
      });
      
      toast.success("Клиент успешно добавлен");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding client:", error);
      toast.error("Ошибка при добавлении клиента");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить клиента</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название компании" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Контактная информация</FormLabel>
                  <FormControl>
                    <Input placeholder="Email, телефон" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Описание клиента" {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="links"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ссылки (одна на строку)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Активный статус</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit">Добавить</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
