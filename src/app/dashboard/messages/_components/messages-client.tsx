'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MessageSquareWarning, ChevronRight, X, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  prenom: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  senderId?: string;
  createdAt: string;
  isReported?: boolean;
}

interface ReportedConversation {
  id: string;
  createdAt: string;
  reportedAt?: string;
  participants?: Participant[];
  lastMessage?: { content: string; createdAt: string };
  reportCount?: number;
}

interface MessagesClientProps {
  conversations: ReportedConversation[];
}

function ConversationMessages({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loading, startLoad] = useTransition();

  if (messages === null && !loading) {
    startLoad(async () => {
      try {
        const res = await fetch(`/api/chat-messages?id=${conversationId}`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : (data?.data ?? []));
      } catch {
        setMessages([]);
      }
    });
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-[14px]">Messages de la conversation</CardTitle>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading || messages === null ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-[13px]">Chargement...</span>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-[13px] text-muted-foreground py-8">Aucun message</p>
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {messages.map((m) => (
              <div key={m.id} className={`px-4 py-3 ${m.isReported ? 'bg-destructive/5' : ''}`}>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(m.createdAt), 'd MMM yyyy HH:mm', { locale: fr })}
                  </span>
                  {m.isReported && (
                    <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive bg-destructive/5">
                      Signalé
                    </Badge>
                  )}
                </div>
                <p className="text-[13px]">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MessagesClient({ conversations }: MessagesClientProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <MessageSquareWarning className="h-8 w-8 opacity-30" />
          <p className="text-sm">Aucun message signalé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <div key={conv.id}>
          <Card className={expanded === conv.id ? 'ring-1 ring-ring' : ''}>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <MessageSquareWarning className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">
                    {conv.participants?.map((p) => `${p.prenom} ${p.name}`).join(' · ') ?? `Conversation #${conv.id.slice(0, 8)}`}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-[12px] text-muted-foreground truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conv.reportCount && conv.reportCount > 1 && (
                    <Badge variant="outline" className="text-[11px] border-destructive/40 text-destructive bg-destructive/5">
                      {conv.reportCount} signalements
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground hidden sm:block">
                    {format(new Date(conv.createdAt), 'd MMM', { locale: fr })}
                  </span>
                  <Button
                    size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground"
                    onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                  >
                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded === conv.id ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {expanded === conv.id && (
            <ConversationMessages conversationId={conv.id} onClose={() => setExpanded(null)} />
          )}
        </div>
      ))}
    </div>
  );
}
