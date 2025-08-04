"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, User as UserIcon, Mail, Shield } from "lucide-react"

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
import { UpdateUserInputSchema, UserRoleSchema, USER_ROLE_LABELS, User } from "@/lib/schemas"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"

interface EditUserDialogProps {
  children: React.ReactNode
  user: User
  onUserUpdated?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ children, user, onUserUpdated, open, onOpenChange }: EditUserDialogProps) {
  const form = useForm<z.infer<typeof UpdateUserInputSchema>>({
    resolver: zodResolver(UpdateUserInputSchema),
    defaultValues: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
  const trpc = useTRPC()

  // Update form values when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    }
  }, [user, form])

  const updateOptions = trpc.users.update.mutationOptions({
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
      onUserUpdated?.()
    },
    onError: (error) => {
      console.error("Error updating user:", error)
    },
  })

  const updateMutation = useMutation(updateOptions)

  function onSubmit(values: z.infer<typeof UpdateUserInputSchema>) {
    updateMutation.mutate(values)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      form.reset()
      updateMutation.reset()
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
            <UserIcon className="w-5 h-5" />
            Editar Usuario
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del usuario. Los cambios se aplicarán inmediatamente.
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
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={true}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Selecciona un rol" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserRoleSchema.enum).map((role) => {
                        // Define role colors mapping
                        const roleColors: Record<string, string> = {
                          superadmin: "bg-purple-500",
                          admin: "bg-red-500",
                          technician: "bg-blue-500",
                          client: "bg-green-500",
                          manager: "bg-purple-500",
                          viewer: "bg-gray-500"
                        };
                        
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${roleColors[role] || "bg-gray-500"}`}></div>
                              {USER_ROLE_LABELS[role] || role}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex items-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    No se puede cambiar el rol después de crear un usuario.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {updateMutation.error && (
              <div className="rounded-md bg-destructive/15 p-3">
                <div className="flex">
                  <div className="text-sm text-destructive">
                    Error al actualizar usuario: {updateMutation.error.message}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
