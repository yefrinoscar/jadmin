"use client";

import { useState } from "react";
import { trpc } from "@/components/providers/trpc-provider";
import { 
  Plus, 
  Search, 
  Tag, 
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  maintenance: "bg-yellow-100 text-yellow-800",
};

const statusIcons: Record<string, any> = {
  active: CheckCircle,
  inactive: XCircle,
  maintenance: AlertCircle,
};

export function ServiceTagList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: serviceTags, isLoading, error } = trpc.serviceTags.getAll.useQuery();
  const { data: clients } = trpc.clients.getAll.useQuery();

  const filteredServiceTags = serviceTags?.filter((serviceTag) => {
    const matchesSearch = 
      serviceTag.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceTag.product_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serviceTag.clients?.company_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = clientFilter === "all" || serviceTag.client_id === clientFilter;
    const matchesStatus = statusFilter === "all" || serviceTag.status === statusFilter;

    return matchesSearch && matchesClient && matchesStatus;
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
            <p className="text-red-600">Error al cargar etiquetas de servicio: {error.message}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas de Servicio</h1>
          <p className="text-gray-600">Gestiona productos de hardware y etiquetas de servicio</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Etiqueta de Servicio
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
                  placeholder="Buscar etiquetas de servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todos los Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Clientes</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Todos los Estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Etiquetas de Servicio ({filteredServiceTags?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServiceTags && filteredServiceTags.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table className="w-full min-w-[900px]">
                    <TableHeader>
                      <TableRow className="h-10">
                        <TableHead className="px-2 py-2 text-xs font-medium">Etiqueta de Servicio</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Modelo del Producto</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Cliente</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Estado</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Fecha de Compra</TableHead>
                        <TableHead className="px-2 py-2 text-xs font-medium">Garantía</TableHead>
                        <TableHead className="w-10 px-2 py-2"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServiceTags.map((serviceTag) => {
                        const StatusIcon = statusIcons[serviceTag.status];
                        const isWarrantyExpired = serviceTag.warranty_end_date && 
                          new Date(serviceTag.warranty_end_date) < new Date();

                        return (
                          <TableRow key={serviceTag.id} className="h-12">
                            <TableCell className="font-medium px-2 py-2">
                              <div className="flex items-center gap-2">
                                <Tag className="w-3 h-3 text-blue-600" />
                                <span className="text-sm">{serviceTag.tag}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <span className="text-sm">{serviceTag.product_model}</span>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                <span className="text-sm">{serviceTag.clients?.company_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              <Badge className={`${statusColors[serviceTag.status]} text-xs`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {serviceTag.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              {serviceTag.purchase_date ? (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs">{format(new Date(serviceTag.purchase_date), "MMM dd, yyyy")}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2 py-2">
                              {serviceTag.warranty_end_date ? (
                                <div className={`flex items-center gap-1 ${
                                  isWarrantyExpired ? "text-red-600" : "text-gray-700"
                                }`}>
                                  <AlertCircle className={`w-3 h-3 ${
                                    isWarrantyExpired ? "text-red-500" : "text-gray-400"
                                  }`} />
                                  <span className="text-xs">{format(new Date(serviceTag.warranty_end_date), "MMM dd, yyyy")}</span>
                                  {isWarrantyExpired && (
                                    <Badge variant="destructive" className="ml-1 text-xs">
                                      Vencida
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
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
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
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
                {filteredServiceTags.map((serviceTag) => {
                  const StatusIcon = statusIcons[serviceTag.status];
                  const isWarrantyExpired = serviceTag.warranty_end_date && 
                    new Date(serviceTag.warranty_end_date) < new Date();

                  return (
                    <Card key={serviceTag.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-4 h-4 text-blue-600" />
                            <h3 className="font-medium text-sm">{serviceTag.tag}</h3>
                          </div>
                          <p className="text-xs text-gray-500">{serviceTag.product_model}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusColors[serviceTag.status]} text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {serviceTag.status}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Cliente:</span>
                          <div className="mt-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{serviceTag.clients?.company_name}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha de Compra:</span>
                          <div className="mt-1">
                            {serviceTag.purchase_date ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs">{format(new Date(serviceTag.purchase_date), "MMM dd, yyyy")}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Garantía:</span>
                          <div className="mt-1">
                            {serviceTag.warranty_end_date ? (
                              <div className={`flex items-center gap-1 ${
                                isWarrantyExpired ? "text-red-600" : "text-gray-700"
                              }`}>
                                <AlertCircle className={`w-3 h-3 ${
                                  isWarrantyExpired ? "text-red-500" : "text-gray-400"
                                }`} />
                                <span className="text-xs">{format(new Date(serviceTag.warranty_end_date), "MMM dd, yyyy")}</span>
                                {isWarrantyExpired && (
                                  <Badge variant="destructive" className="ml-1 text-xs">
                                    Vencida
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
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
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No se encontraron etiquetas de servicio</p>
              <p className="text-sm text-gray-400">
                {searchTerm || clientFilter !== "all" || statusFilter !== "all" 
                  ? "Intenta ajustar tus criterios de búsqueda" 
                  : "Comienza agregando tu primera etiqueta de servicio"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 