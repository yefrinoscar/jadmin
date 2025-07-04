"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, User, Mail, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/components/providers/trpc-provider"
import { CreateUserInputSchema } from "@/lib/schemas"

interface CreateUserDialogProps {
  children: React.ReactNode
  onUserCreated?: () => void
}

export function CreateUserDialog({ children, onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  
  const form = useForm<z.infer<typeof CreateUserInputSchema>>({
    resolver: zodResolver(CreateUserInputSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "technician",
    },
  })

  const createUserMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      form.reset()
      onUserCreated?.()
    },
    onError: (error) => {
      console.error("Error creating user:", error)
    },
  })

  function onSubmit(values: z.infer<typeof CreateUserInputSchema>) {
    createUserMutation.mutate(values)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      createUserMutation.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Crear Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Agrega un nuevo miembro del equipo al sistema. Asegúrate de asignar el rol apropiado.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder="Ej: Juan Pérez" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    El nombre completo del usuario como aparecerá en el sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        type="email"
                        placeholder="juan@empresa.com" 
                        className="pl-10"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Este será el email de inicio de sesión del usuario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol del Usuario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Selecciona un rol" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="technician">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          Técnico
                        </div>
                      </SelectItem>
                      <SelectItem value="client">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Cliente
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define los permisos y acceso del usuario en el sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {createUserMutation.error && (
              <div className="rounded-md bg-destructive/15 p-3">
                <div className="flex">
                  <div className="text-sm text-destructive">
                    Error al crear usuario: {createUserMutation.error.message}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={createUserMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 