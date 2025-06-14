
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { TrendData } from '@/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: TrendData;
  className?: string;
  iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  iconColor = "#10B981"
}) => {
  const getTrendIcon = (trendType: 'up' | 'down' | 'flat') => {
    switch (trendType) {
      case 'up':
        return ArrowUp;
      case 'down':
        return ArrowDown;
      case 'flat':
        return Minus;
    }
  };

  const getTrendColor = (trendType: 'up' | 'down' | 'flat') => {
    switch (trendType) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'flat':
        return 'text-gray-500';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
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
            {trend && (
              <div className="flex items-center space-x-1 mt-2">
                <div className={cn("flex items-center", getTrendColor(trend.trend))}>
                  {React.createElement(getTrendIcon(trend.trend), { className: "h-3 w-3" })}
                  <span className="text-xs font-medium ml-1">
                    {Math.abs(trend.percentage).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">vs. mês anterior</span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            "bg-primary/10"
          )}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
