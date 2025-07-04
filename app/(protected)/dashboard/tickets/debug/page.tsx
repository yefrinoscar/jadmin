"use client";

import { trpc } from "@/components/providers/trpc-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const { data: session } = trpc.auth.getSession.useQuery();
  const { data: testResult } = trpc.tickets.testConnection.useQuery();
  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = trpc.tickets.getAll.useQuery();
  const { data: clients, isLoading: clientsLoading, error: clientsError } = trpc.clients.getAll.useQuery();
  const { data: users, isLoading: usersLoading, error: usersError } = trpc.users.getAll.useQuery();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug Information</h1>
      
      {/* Session Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Simple Database Test</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Tickets Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Query (Full)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>Loading: {ticketsLoading ? 'Yes' : 'No'}</div>
            {ticketsError && (
              <div>
                <div className="text-red-600 font-semibold">Error:</div>
                <pre className="bg-red-50 p-4 rounded text-sm overflow-auto text-red-800">
                  {JSON.stringify(ticketsError, null, 2)}
                </pre>
              </div>
            )}
            {tickets && (
              <div>
                <div className="text-green-600 font-semibold">Success: {tickets.length} tickets found</div>
                <pre className="bg-green-50 p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(tickets, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clients Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Clients Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>Loading: {clientsLoading ? 'Yes' : 'No'}</div>
            {clientsError && (
              <div>
                <div className="text-red-600 font-semibold">Error:</div>
                <pre className="bg-red-50 p-4 rounded text-sm overflow-auto text-red-800">
                  {JSON.stringify(clientsError, null, 2)}
                </pre>
              </div>
            )}
            {clients && (
              <div>
                <div className="text-green-600 font-semibold">Success: {clients.length} clients found</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Users Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>Loading: {usersLoading ? 'Yes' : 'No'}</div>
            {usersError && (
              <div>
                <div className="text-red-600 font-semibold">Error:</div>
                <pre className="bg-red-50 p-4 rounded text-sm overflow-auto text-red-800">
                  {JSON.stringify(usersError, null, 2)}
                </pre>
              </div>
            )}
            {users && (
              <div>
                <div className="text-green-600 font-semibold">Success: {users.length} users found</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 