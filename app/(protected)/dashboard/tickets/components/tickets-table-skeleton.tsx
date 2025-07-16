"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function TicketsTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter and Actions Row */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Skeleton className="h-8 w-full md:w-[250px]" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-[80px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="w-full rounded-lg border bg-background overflow-hidden relative">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)]">
            <Table className="relative">
              <TableHeader className="bg-muted sticky top-0 z-20">
                <TableRow>
                  <TableHead className="sticky left-0 z-30 bg-muted">
                    <Skeleton className="h-4 w-[30px]" />
                  </TableHead>
                  <TableHead className="sticky left-[50px] z-30 bg-muted">
                    <Skeleton className="h-4 w-[80px]" />
                  </TableHead>
                  <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="sticky left-0 z-10 bg-background">
                      <Skeleton className="h-4 w-[30px]" />
                    </TableCell>
                    <TableCell className="sticky left-[50px] z-10 bg-background">
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Skeleton className="h-5 w-[180px] mb-1" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-[60px]" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                <div>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
                <div>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
                <div>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
                <div>
                  <Skeleton className="h-4 w-[60px] mb-1" />
                  <div className="flex flex-wrap gap-1">
                    <Skeleton className="h-5 w-[40px]" />
                    <Skeleton className="h-5 w-[40px]" />
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex flex-col space-y-4 px-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Skeleton className="h-5 w-[150px]" />
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <Skeleton className="h-5 w-[100px]" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
