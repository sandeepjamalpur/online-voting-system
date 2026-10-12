import React, { useEffect, useRef } from 'react';
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  Title,
} from 'chart.js';

Chart.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  Title
);

interface DoughnutChartProps {
  labels: string[];
  data: number[];
  colors?: string[];
  title?: string;
  showLegend?: boolean;
}

export const DoughnutChartComponent: React.FC<DoughnutChartProps> = ({
  labels,
  data,
  colors = ['#0B3B2C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
  title,
  showLegend = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const total = data.reduce((a, b) => a + b, 0);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: showLegend,
            position: 'bottom',
            labels: {
              font: { size: 11, family: 'system-ui, -apple-system, sans-serif', weight: 'bold' },
              padding: 12,
              boxWidth: 10,
              boxHeight: 10,
              color: '#334155',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = Number(context.raw) || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                return ` ${context.label}: ${val} votes (${pct}%)`;
              },
            },
          },
          title: title
            ? {
                display: true,
                text: title,
                font: { size: 13, weight: 'bold' },
                color: '#1e293b',
                padding: { bottom: 10 },
              }
            : { display: false },
        },
        cutout: '65%',
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [labels, data, colors, title, showLegend]);

  return (
    <div className="w-full h-64 relative flex items-center justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
};

interface BarChartProps {
  labels: string[];
  data: number[];
  datasetLabel?: string;
  colors?: string[];
  horizontal?: boolean;
  title?: string;
}

export const BarChartComponent: React.FC<BarChartProps> = ({
  labels,
  data,
  datasetLabel = 'Votes',
  colors = ['#0B3B2C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
  horizontal = false,
  title,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const bgColors = labels.map((_, i) => colors[i % colors.length] || '#0B3B2C');

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: datasetLabel,
            data,
            backgroundColor: bgColors,
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: !horizontal, color: '#f1f5f9' },
            ticks: {
              precision: 0,
              font: { size: 11, family: 'system-ui, -apple-system, sans-serif' },
              color: '#475569',
            },
          },
          y: {
            beginAtZero: true,
            grid: { display: horizontal, color: '#f1f5f9' },
            ticks: {
              precision: 0,
              font: { size: 11, family: 'system-ui, -apple-system, sans-serif' },
              color: '#475569',
            },
          },
        },
        plugins: {
          legend: { display: false },
          title: title
            ? {
                display: true,
                text: title,
                font: { size: 13, weight: 'bold' },
                color: '#1e293b',
                padding: { bottom: 10 },
              }
            : { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${item.raw} votes`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [labels, data, datasetLabel, colors, horizontal, title]);

  return (
    <div className="w-full h-64 relative">
      <canvas ref={canvasRef} />
    </div>
  );
};
