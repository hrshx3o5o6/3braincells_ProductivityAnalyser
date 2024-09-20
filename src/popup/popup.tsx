import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Popup: React.FC = () => {
  const [task, setTask] = useState<string>('');
  const [siteData, setSiteData] = useState<Record<string, { totalTime: number }>>({});
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  useEffect(() => {
    chrome.storage.local.get(['currentTask', 'siteTimers', 'isEnabled'], (result) => {
      console.log('Storage data:', result); // Debug log
      if (result.currentTask) {
        setTask(result.currentTask);
      }
      if (result.siteTimers) {
        setSiteData(result.siteTimers);
      }
      setIsEnabled(result.isEnabled !== undefined ? result.isEnabled : true);
    });
  }, []);

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'setTask', task: task });
  };

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ isEnabled: newState });
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

  console.log('Chart data:', chartData); // Debug log

  return (
    <div className="popup">
      <h1>Productivity Analyzer</h1>
      <div className="toggle-container">
        <label className="switch">
          <input type="checkbox" checked={isEnabled} onChange={handleToggle} />
          <span className="slider round"></span>
        </label>
        <span>Enable Extension: {isEnabled ? 'On' : 'Off'}</span>
      </div>
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
        {Object.keys(siteData).length > 0 ? (
          <Pie data={chartData} />
        ) : (
          <p>No data available yet. Start browsing to collect data.</p>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<Popup />);