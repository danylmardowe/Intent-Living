'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartData = [
  { area: 'Health', time: 5, fill: 'var(--color-chart-1)' },
  { area: 'Career', time: 18, fill: 'var(--color-chart-2)' },
  { area: 'Growth', time: 8, fill: 'var(--color-chart-3)' },
  { area: 'Finance', time: 2, fill: 'var(--color-chart-4)' },
  { area: 'Social', time: 6, fill: 'var(--color-chart-5)' },
];

const chartConfig = {
  time: {
    label: 'Time (hours)',
  },
   health: {
    label: "Health",
    color: "hsl(var(--chart-1))",
  },
  career: {
    label: "Career",
    color: "hsl(var(--chart-2))",
  },
  growth: {
    label: "Growth",
    color: "hsl(var(--chart-3))",
  },
    finance: {
    label: "Finance",
    color: "hsl(var(--chart-4))",
  },
  social: {
    label: "Social",
    color: "hsl(var(--chart-5))",
  },
};

export default function LifeBalanceChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                dataKey="area"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}h`}
                />
                 <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="time" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </ChartContainer>
  );
}
