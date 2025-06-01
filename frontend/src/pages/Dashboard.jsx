import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BookOpen, Award, Clock, BarChart2, History } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentExams, setRecentExams] = useState([]);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    failedExams: 0,
    inProgressExams: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent exams
        const examsRes = await api.get('/api/exams?limit=5');
        setRecentExams(examsRes.data);
        
        // Fetch recent attempts
        const attemptsRes = await api.get('/api/users/attempts?limit=5');
        setRecentAttempts(attemptsRes.data);
        
        // Calculate stats
        const allAttempts = await api.get('/api/users/attempts');
        const attemptData = allAttempts.data;
        
        setStats({
          totalExams: attemptData.length,
          passedExams: attemptData.filter(a => a.isPassed).length,
          failedExams: attemptData.filter(a => !a.isPassed && a.status === 'completed').length,
          inProgressExams: attemptData.filter(a => a.status === 'in-progress').length
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-1">Here's an overview of your exam progress</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'examiner') && (
          <Link
            to="/exams/create"
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create New Exam
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <BookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Exams</p>
            <p className="text-2xl font-bold">{stats.totalExams}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Passed</p>
            <p className="text-2xl font-bold">{stats.passedExams}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <BarChart2 className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-bold">{stats.failedExams}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold">{stats.inProgressExams}</p>
          </div>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Available Exams</h2>
          <Link to="/exams" className="text-sm text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentExams.length > 0 ? (
            recentExams.map((exam) => (
              <div key={exam._id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-md font-medium text-gray-900">{exam.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{exam.description.substring(0, 100)}...</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4">{exam.duration} min</span>
                  <Link
                    to={`/exams/${exam._id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">No exams available</div>
          )}
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Recent Exam Attempts</h2>
          <Link to="/history" className="text-sm text-blue-600 hover:text-blue-800">
            View History
          </Link>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentAttempts.length > 0 ? (
            recentAttempts.map((attempt) => (
              <div key={attempt._id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-md font-medium text-gray-900">{attempt.exam.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(attempt.startTime).toLocaleDateString()} • {attempt.status === 'completed' ? 'Completed' : 'In Progress'}
                  </p>
                </div>
                <div className="flex items-center">
                  {attempt.status === 'completed' ? (
                    <span className={`px-3 py-1 rounded-full text-sm ${attempt.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {attempt.isPassed ? 'Passed' : 'Failed'} ({attempt.score}%)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      In Progress
                    </span>
                  )}
                  <Link
                    to={`/attempts/${attempt._id}`}
                    className="ml-4 px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">No recent attempts</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;