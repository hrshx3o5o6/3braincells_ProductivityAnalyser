import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Popup: React.FC = () => {
  const [task, setTask] = useState<string>('');
  const [siteData, setSiteData] = useState<Record<string, { totalTime: number }>>({});

  useEffect(() => {
    chrome.storage.local.get(['currentTask', 'siteTimers'], (result) => {
      if (result.currentTask) {
        setTask(result.currentTask);
      }
      if (result.siteTimers) {
        setSiteData(result.siteTimers);
      }
    });
  }, []);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'setTask', task: task });
  };

  const chartData = {
    labels: Object.keys(siteData),
    datasets: [
      {
        data: Object.values(siteData).map(site => site.totalTime / 60000), // Convert to minutes
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
      },
    ],
  };

  return (
    <div className="popup">
      <h1>Productivity Analyzer</h1>
      <form onSubmit={handleTaskSubmit}>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What are you working on?"
        />
        <button type="submit">Set Task</button>
      </form>
      <div className="chart-container">
        <h2>Time Spent on Sites (minutes)</h2>
        <Pie data={chartData} />
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Popup />);