
import React from "react";
import { ResponsiveContainer, FunnelChart as ReFunnelChart, Funnel, Tooltip, LabelList, Legend } from "recharts";

export interface FunnelStep {
  name: string;
  value: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  height?: number;
  campaignName?: string;
}

const COLORS = ["#2dd4bf", "#60a5fa", "#22c55e", "#f59e0b", "#8b5cf6"];

export const FunnelChart: React.FC<FunnelChartProps> = ({ steps, height = 350, campaignName }) => (
  <div className="w-full h-full">
    <ResponsiveContainer width="100%" height={height}>
      <ReFunnelChart>
        <Tooltip
          formatter={(v: number, n: string) => [`${v}`, n]}
          contentStyle={{ fontSize: 14 }}
        />
        <Legend />
        <Funnel
          dataKey="value"
          data={steps}
          isAnimationActive
          stroke="#666"
        >
          <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
        </Funnel>
      </ReFunnelChart>
    </ResponsiveContainer>
    {campaignName && (
      <div className="mt-2 font-bold text-center">{campaignName}</div>
    )}
  </div>
);
