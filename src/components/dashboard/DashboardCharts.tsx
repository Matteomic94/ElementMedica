/**
 * DashboardCharts Component
 * Gestisce la visualizzazione dei grafici della dashboard (Doughnut e Bar)
 * Estratto dal Dashboard.tsx monolitico per migliorare la modularità
 */

import React from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardChartsProps {
  // Props per personalizzare i dati dei grafici in futuro
  className?: string;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  className = ""
}) => {
  // Dati per il grafico Doughnut (Training Status Overview)
  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dati per il grafico Bar (Monthly Statistics)
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Employees',
        data: [12, 19, 8, 15, 12, 18],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Completed Courses',
        data: [7, 11, 5, 8, 3, 14],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
    ],
  };

  // Opzioni comuni per i grafici
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Training Status Overview - Doughnut Chart */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Training Status Overview
        </h2>
        <div className="h-80 flex items-center justify-center">
          <Doughnut
            data={doughnutData}
            options={chartOptions}
          />
        </div>
      </div>

      {/* Monthly Statistics - Bar Chart */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Monthly Statistics
        </h2>
        <div className="h-80">
          <Bar
            data={barData}
            options={chartOptions}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;