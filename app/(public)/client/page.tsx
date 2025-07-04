"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Lock, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientTicketList } from "./components/client-ticket-list";

export default function ClientPortalPage() {
  const [credentials, setCredentials] = useState({ company: "", password: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [error, setError] = useState("");

  // Check if already authenticated
  useEffect(() => {
    const savedAuth = localStorage.getItem("client-auth");
    if (savedAuth) {
      const auth = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setClientData(auth);
    }
  }, []);

  const handleLogin = async () => {
    // Mock authentication - in real app, this would call your tRPC endpoint
    if (credentials.company && credentials.password) {
      const mockClientData = {
        id: "client-1",
        company_name: credentials.company,
        name: "Client Contact",
        email: "contact@client.com"
      };
      
      setClientData(mockClientData);
      setIsAuthenticated(true);
      setError("");
      
      // Save to localStorage
      localStorage.setItem("client-auth", JSON.stringify(mockClientData));
    } else {
      setError("Por favor ingresa tanto el nombre de la empresa como la contraseña");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setClientData(null);
    setCredentials({ company: "", password: "" });
    localStorage.removeItem("client-auth");
  };

  if (isAuthenticated && clientData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className=" border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {clientData.company_name}
                  </h1>
                  <p className="text-sm text-gray-600">Portal del Cliente</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tus Tickets de Soporte</h2>
            <p className="text-gray-600">Ve y rastrea tus solicitudes de soporte técnico</p>
          </div>

          {/* Client Ticket List */}
          <ClientTicketList clientId={clientData.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Portal del Cliente</CardTitle>
          <p className="text-gray-600">Accede a tus tickets de soporte</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre de la Empresa</label>
              <Input
                type="text"
                placeholder="Ingresa el nombre de tu empresa"
                value={credentials.company}
                onChange={(e) => setCredentials(prev => ({ ...prev, company: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700">Código de Acceso</label>
              <Input
                type="password"
                placeholder="Ingresa tu código de acceso"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <Button onClick={handleLogin} className="w-full">
              <Lock className="w-4 h-4 mr-2" />
              Acceder al Portal
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>¿Necesitas ayuda para acceder a tu cuenta?</p>
            <p>Contacta a tu representante de soporte.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 