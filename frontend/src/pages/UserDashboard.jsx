import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaHistory, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserDashboard = () => {
  const userId = useSelector(state => state.auth.user?._id);
  const navigate = useNavigate();

  const [volunteeringHistory, setVolunteeringHistory] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchIssueRequests = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/issues/requested/${userId}`);
        const issueDetails = res.data;
        const completed = issueDetails.filter(issue => issue.status === 'Completed');
        const pending = issueDetails.filter(issue => issue.status !== 'Completed');

        setVolunteeringHistory(completed);
        setPendingTasks(pending);
      } catch (error) {
        console.error("Error fetching issue requests or issues:", error);
      }
    };

    fetchIssueRequests();
  }, [userId]);

  const totalTasks = volunteeringHistory.length + pendingTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((volunteeringHistory.length / totalTasks) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      {/* Task Completion Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <FaCheckCircle className="text-green-500 mr-2" />
          <h2 className="text-xl font-semibold">Task Completion</h2>
        </div>
        <div className="mb-2 text-sm text-gray-700">
          Completed {volunteeringHistory.length} out of {totalTasks} tasks
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-gray-600 font-medium">
          {completionPercentage}% completed
        </div>
      </div>

      {/* Volunteering History Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-4">
          <FaHistory className="text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold">Volunteering History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {volunteeringHistory.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4">{item.title}</td>
                  <td className="px-6 py-4">{new Date(item.deadline).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Tasks Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <FaClock className="text-red-500 mr-2" />
          <h2 className="text-xl font-semibold">Pending Tasks</h2>
        </div>
        <div className="space-y-4">
          {pendingTasks.map((task, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => navigate(`/issues/${task._id}`)}
            >
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600">Due: {new Date(task.deadline).toLocaleDateString()}</p>
              <p className="mt-2 text-sm text-gray-500">
                <strong>Status:</strong>{" "}
                <span className={`font-semibold ${task.status === 'Open' ? 'text-blue-500' : 'text-yellow-500'}`}>
                  {task.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
