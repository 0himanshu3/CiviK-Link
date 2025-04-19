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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-10 tracking-tight">
          My Dashboard
        </h1>

        {/* Task Completion Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 transition hover:shadow-2xl">
          <div className="flex items-center mb-6">
            <FaCheckCircle className="text-green-500 mr-3 text-2xl" />
            <h2 className="text-2xl font-semibold text-gray-700">Task Completion</h2>
          </div>
          <div className="mb-3 text-base text-gray-700">
            <span className="font-bold text-green-600">{volunteeringHistory.length}</span> out of <span className="font-bold">{totalTasks}</span> tasks completed
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-5 rounded-full transition-all duration-700"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="mt-3 text-sm text-gray-600 font-medium">
            {completionPercentage}% completed
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-h-100">
          {/* Volunteering History Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 transition hover:shadow-2xl">
            <div className="flex items-center mb-6">
              <FaHistory className="text-blue-500 mr-3 text-2xl" />
              <h2 className="text-2xl font-semibold text-gray-700">Volunteering History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Timeline</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteeringHistory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-400">No completed tasks yet.</td>
                    </tr>
                  )}
                  {volunteeringHistory.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 font-medium text-gray-700">{item.title}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(item.deadline).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
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
          <div className="bg-white rounded-2xl shadow-lg p-8 transition hover:shadow-2xl">
            <div className="flex items-center mb-6">
              <FaClock className="text-red-500 mr-3 text-2xl" />
              <h2 className="text-2xl font-semibold text-gray-700">Pending Tasks</h2>
            </div>
            {pendingTasks.length === 0 && (
              <div className="text-center text-gray-400 py-8">No pending tasks. Great job!</div>
            )}
            <div className="space-y-5">
              {pendingTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-5 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition group shadow-sm"
                  onClick={() => navigate(`/issues/${task._id}`)}
                >
                  <h3 className="font-semibold text-lg text-blue-700 group-hover:underline">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Due: <span className="font-medium">{new Date(task.deadline).toLocaleDateString()}</span></p>
                  <p className="mt-2 text-sm">
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
      </div>
    </div>
  );
};

export default UserDashboard;
