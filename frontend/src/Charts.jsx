import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Charts({ expenses }) {
  const categoryData = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const barData = {
    labels: Object.keys(categoryData),
    datasets: [{
      label: 'Amount (₹)',
      data: Object.values(categoryData),
      backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'],
    }],
  };

  const doughnutData = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'],
    }],
  };

  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <Bar data={barData} />
        </div>
        <div className="col-md-6">
          <Doughnut data={doughnutData} />
        </div>
      </div>
    </div>
  );
}

export default Charts;
