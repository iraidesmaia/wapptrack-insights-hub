
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  className?: string;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
  iconColor = "#10B981"
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <h4 className="text-2xl font-bold tracking-tight mt-2">
              {value}
            </h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
            {trend && trendValue && (
              <div className="flex items-center space-x-1 mt-2">
                <span className={cn(
                  "text-xs font-medium",
                  trend === 'up' ? "text-green-600" : trend === 'down' ? "text-red-600" : "text-gray-500"
                )}>
                  {trendValue}
                </span>
                <span className="text-xs text-muted-foreground">vs. período anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            trend === 'up' ? "bg-primary/10" : trend === 'down' ? "bg-red-100" : "bg-primary/10"
          )}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
