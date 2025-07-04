"use client";

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Shield,
  ShieldCheck,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  technician: "bg-blue-100 text-blue-800",
  manager: "bg-purple-100 text-purple-800",
  viewer: "bg-gray-100 text-gray-800",
};

const roleIcons: Record<string, any> = {
  admin: ShieldCheck,
  technician: User,
  manager: Shield,
  viewer: UserCheck,
};

export function UserList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const { data: users, isLoading, error } = trpc.users.getAll.useQuery();

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error al cargar usuarios: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600">Gestiona los miembros del equipo y sus permisos</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Todos los Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="manager">Gerente</SelectItem>
                <SelectItem value="technician">Técnico</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Miembros del Equipo ({filteredUsers?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers && filteredUsers.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[700px]">
                    <TableHeader>
                      <TableRow className="h-10">
                        <TableHead className="px-2 py-2 text-xs font-medium">Usuario</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Email</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Rol</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Se Unió</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Última Actividad</TableHead>
                        <TableHead className="w-10 px-2 py-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user: any) => {
                        const RoleIcon = roleIcons[user.role] || User;

                        return (
                          <TableRow key={user.id} className="h-12">
                            <TableCell className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {user.assigned_tickets_count || 0} tickets
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <Badge className={`${roleColors[user.role]} text-xs`}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              {user.created_at ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs">{format(new Date(user.created_at), "MMM dd, yyyy")}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              {user.last_sign_in_at ? (
                                <span className="text-xs text-gray-600">
                                  {format(new Date(user.last_sign_in_at), "MMM dd, HH:mm")}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Nunca</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Usuario
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Shield className="w-4 h-4 mr-2" />
                                    Cambiar Rol
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Desactivar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user: any) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  
                  return (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.assigned_tickets_count || 0} tickets asignados
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="w-4 h-4 mr-2" />
                              Cambiar Rol
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <div className="mt-1 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Rol:</span>
                          <div className="mt-1">
                            <Badge className={`${roleColors[user.role]} text-xs`}>
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Se Unió:</span>
                          <div className="mt-1">
                            {user.created_at ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs">{format(new Date(user.created_at), "MMM dd, yyyy")}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Última Actividad:</span>
                          <div className="mt-1">
                            {user.last_sign_in_at ? (
                              <span className="text-xs text-gray-600">
                                {format(new Date(user.last_sign_in_at), "MMM dd, HH:mm")}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Nunca</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No se encontraron usuarios</p>
              <p className="text-sm text-gray-400">
                {searchTerm || roleFilter !== "all" 
                  ? "Intenta ajustar tus criterios de búsqueda" 
                  : "Comienza agregando miembros del equipo"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 