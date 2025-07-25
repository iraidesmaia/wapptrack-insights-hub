import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { MessageSquare } from 'lucide-react';

interface MessageTooltipProps {
  message: string;
  maxLength?: number;
}

const MessageTooltip = ({ message, maxLength = 50 }: MessageTooltipProps) => {
  if (!message) return null;

  const truncatedMessage = message.length > maxLength 
    ? `${message.substring(0, maxLength)}...` 
    : message;

  if (message.length <= maxLength) {
    return (
      <div className="flex items-center space-x-2 max-w-xs">
        <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground">
          {message}
        </span>
      </div>
    );
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center space-x-2 max-w-xs cursor-help hover:bg-muted/50 p-1 rounded transition-colors">
          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {truncatedMessage}
          </span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3" side="top">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Última Mensagem</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default MessageTooltip;