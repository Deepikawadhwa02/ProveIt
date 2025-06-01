import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Clock, Users, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExams, setFilteredExams] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/exams');
        setExams(res.data);
        setFilteredExams(res.data);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  useEffect(() => {
    const results = exams.filter(
      (exam) =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExams(results);
  }, [searchTerm, exams]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Available Exams</h1>
        <div className="mt-4 md:mt-0 w-full md:w-64">
          <input
            type="text"
            placeholder="Search exams..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No exams found. Please try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h2>
                <p className="text-gray-600 mb-4 line-clamp-3">{exam.description}</p>

                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center text-gray-700">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm">{exam.duration} minutes</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Award className="h-4 w-4 mr-1" />
                    <span className="text-sm">Pass: {exam.passingScore}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    Added {new Date(exam.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/exams/${exam._id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamList;