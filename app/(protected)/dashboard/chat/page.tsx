import { Suspense } from "react";
import { HydrateClient } from "@/trpc/server";
import { ChatContent } from "./_components/chat-content";

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-200px)] rounded-lg border bg-background overflow-hidden animate-pulse">
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <div className="h-5 bg-muted rounded w-32 mb-3" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 rounded-lg">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4" />
          <div className="h-5 bg-muted rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <div className="space-y-4 pt-6">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Chat de Soporte</h1>
        <p className="text-muted-foreground">
          Gestiona las conversaciones de soporte y responde cuando la IA requiera asistencia humana
        </p>
      </div>

      <HydrateClient>
        <Suspense fallback={<ChatSkeleton />}>
          <ChatContent />
        </Suspense>
      </HydrateClient>
    </div>
  );
}
