"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, FieldErrors } from "react-hook-form"
import { z } from "zod"
import { Loader2, User, Mail, Shield, Lock, RefreshCw, Eye, EyeOff, Building, Plus, Phone, MapPin, AlertCircle, XCircle } from "lucide-react"
import { generateReadablePassword } from "@/lib/utils/password-generator"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTRPC } from "@/trpc/client"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { CreateUserInputSchema, UserRoleSchema, USER_ROLE_LABELS, ClientSchema } from "@/lib/schemas"

interface CreateUserDialogProps {
  children: React.ReactNode
  onUserCreated?: () => void
}

export function CreateUserDialog({ children, onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  


  // Create a schema that includes all fields from CreateUserInputSchema plus password
  // and optional new client fields
  const CreateUserSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    name: z.string().min(1, 'Name is required'),
    role: UserRoleSchema,
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    client_id: z.string().uuid('Please select a valid client').optional(),
    create_new_client: z.boolean().optional(),
  })
  .refine(data => {
    // If role is client and not creating a new client, client_id is required
    if (data.role === 'client' && !data.create_new_client) {
      return !!data.client_id;
    }
    return true;
  }, {
    message: "Client selection is required for users with 'client' role",
    path: ["client_id"],
  })

  
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  const form = useForm<z.infer<typeof CreateUserSchema>>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "technician",
      password: "",
      client_id: undefined,
      create_new_client: false,
    },
  })
  
  // Watch the role field to show/hide client selection
  const role = useWatch({
    control: form.control,
    name: "role",
    defaultValue: "technician"
  })
  
  // Watch the create_new_client field to toggle between client selection and new client creation
  const createNewClient = useWatch({
    control: form.control,
    name: "create_new_client",
    defaultValue: false
  })
  
  // Define client interface
  interface Client {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  }
  
  // Fetch clients for the dropdown using the correct pattern for tRPC v10 with React Query
  const { data: clientsData, isLoading: isLoadingClients } = useQuery(trpc.clients.getAll.queryOptions())
  const clients: Client[] = clientsData || []
  
  // Use React Query's useMutation with tRPC client
  const { mutateAsync: createUser, error, isPending, reset } = useMutation(trpc.users.create.mutationOptions({
    onSuccess: () => {
      setOpen(false)
      form.reset()
      queryClient.invalidateQueries()
      onUserCreated?.()
    },
    onError: (error) => {
      console.error("Error creating user:", error)
    },
  }))

  function onSubmit(values: z.infer<typeof CreateUserSchema>) {
    // Reset any previous errors
    setFormErrors([]);
    
    // Prepare the data for the mutation
    const userData = {
      email: values.email,
      name: values.name,
      role: values.role,
      password: values.password,
      client_id: values.create_new_client ? undefined : values.client_id
    }
    
    // Pass the data to the mutation
    createUser(userData)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      reset()
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Contraseña" 
                        className="pl-10 pr-24"
                        {...field} 
                      />
                      <div className="absolute right-0 top-0 h-full flex">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-full px-2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-full rounded-l-none"
                          onClick={() => {
                            const password = generateReadablePassword();
                            form.setValue("password", password);
                            // Create a temporary input to copy to clipboard
                            const tempInput = document.createElement("input");
                            tempInput.value = password;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand("copy");
                            document.body.removeChild(tempInput);
                            
                            // Simplemente mostrar la contraseña sin toast
                            
                            // Show the password
                            setShowPassword(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Generar
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Contraseña para iniciar sesión en el sistema.
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
                  <FormDescription>
                    Define los permisos y acceso del usuario en el sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Client association - only shown when role is 'client' */}
            {role === "client" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="create_new_client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente Asociado</FormLabel>
                      <Tabs
                        defaultValue={field.value ? "new" : "existing"}
                        className="w-full"
                        onValueChange={(value) => {
                          field.onChange(value === "new");
                          if (value === "existing") {
                            // No need to set new_client as it's not in the schema
                          } else {
                            form.setValue("client_id", undefined);
                          }
                        }}
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="existing">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              Cliente Existente
                            </div>
                          </TabsTrigger>
                          <TabsTrigger value="new">
                            <div className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Nuevo Cliente
                            </div>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="existing" className="pt-4">
                          <FormField
                            control={form.control}
                            name="client_id"
                            render={({ field }) => (
                              <FormItem>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={isLoadingClients}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-muted-foreground" />
                                        <SelectValue placeholder="Selecciona un cliente" />
                                      </div>
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {isLoadingClients ? (
                                      <SelectItem value="loading" disabled>
                                        <div className="flex items-center gap-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Cargando clientes...
                                        </div>
                                      </SelectItem>
                                    ) : clients.length === 0 ? (
                                      <SelectItem value="none" disabled>
                                        No hay clientes disponibles
                                      </SelectItem>
                                    ) : (
                                      clients.map((client: Client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                          <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-muted-foreground" />
                                            {client.name}{client.company_name ? ` - ${client.company_name}` : ''}
                                          </div>
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Selecciona el cliente al que pertenece este usuario.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        <TabsContent value="new" className="space-y-4 pt-4">
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nombre del cliente" />
                            </div>
                          
                            <div className="flex items-center">
                              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Nombre de la empresa (opcional)" />
                            </div>
                          
                            <div className="flex items-center">
                              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Email del cliente (opcional)" />
                            </div>
                          
                            <div className="flex items-center">
                              <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Teléfono del cliente (opcional)" />
                            </div>
                          
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Dirección del cliente (opcional)" />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </FormItem>
                  )}
                />
              </div>
            )}



            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending && (
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
