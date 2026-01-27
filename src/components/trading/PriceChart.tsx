import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PriceChartProps {
  data: number[];
  labels?: string[];
  isPositive?: boolean;
  height?: number;
}

export const PriceChart = ({ data, labels, isPositive = true, height = 200 }: PriceChartProps) => {
  const defaultLabels = data.map((_, i) => `${i + 1}`);
  
  const chartData = {
    labels: labels || defaultLabels,
    datasets: [
      {
        data,
        borderColor: isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)',
        backgroundColor: isPositive 
          ? 'hsla(160, 84%, 39%, 0.1)' 
          : 'hsla(0, 84%, 60%, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: isPositive ? 'hsl(160, 84%, 39%)' : 'hsl(0, 84%, 60%)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'hsl(222, 47%, 10%)',
        titleColor: 'hsl(210, 40%, 98%)',
        bodyColor: 'hsl(210, 40%, 98%)',
        borderColor: 'hsl(222, 30%, 18%)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `₹${context.raw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
