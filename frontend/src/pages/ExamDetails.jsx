import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Award, AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState(false);
  const [canTakeExam, setCanTakeExam] = useState(true);
  const [retakeDate, setRetakeDate] = useState(null);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setLoading(true);

        // Fetch exam details
        const examRes = await api.get(`/api/exams/${id}`);
        setExam(examRes.data);

        // Fetch user's attempts for this exam
        const attemptsRes = await api.get(`/api/attempts/attempts/${id}`);
        setAttempts(attemptsRes.data);

        // Check if user can take the exam
        const lastAttempt = attemptsRes.data.sort(
          (a, b) => new Date(b.endTime || b.startTime).getTime() - new Date(a.endTime || a.startTime).getTime()
        )[0];

        // Check for in-progress attempt
        const inProgressAttempt = attemptsRes.data.find((a) => a.status === 'in-progress');
        if (inProgressAttempt) {
          setCanTakeExam(true);
          return;
        }

        // Check retake conditions
        if (lastAttempt && lastAttempt.status === 'completed') {
          if (!examRes.data.allowRetake) {
            setCanTakeExam(false);
          } else {
            const retakeDate = new Date(lastAttempt.endTime);
            retakeDate.setDate(retakeDate.getDate() + examRes.data.retakeAfterDays);

            if (new Date() < retakeDate) {
              setCanTakeExam(false);
              setRetakeDate(retakeDate);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching exam details:', error);
        toast.error('Failed to load exam details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExamDetails();
    }
  }, [id]);

  const handleStartExam = async () => {
    try {
      setStartingExam(true);
      const res = await api.post(`/api/attempts/exams/${id}/start`);
      navigate(`/exams/${id}/take`, { state: { attemptId: res.data._id } });
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error(error.response?.data?.msg || 'Failed to start exam');
    } finally {
      setStartingExam(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!exam) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Not Found</h2>
        <p className="text-gray-600 mb-6">The exam you're looking for doesn't exist or has been removed.</p>
        <Link to="/exams" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Back to Exams
        </Link>
      </div>
    );
  }

  // Find the most recent attempt
  const lastAttempt = attempts.length > 0
    ? attempts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0]
    : null;

  // Check if there's an in-progress attempt
  const inProgressAttempt = attempts.find((a) => a.status === 'in-progress');

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{exam.title}</h1>
          <p className="text-gray-600 mb-6 whitespace-pre-line">{exam.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-lg font-semibold">{exam.duration} minutes</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg flex items-center">
              <Award className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Passing Score</p>
                <p className="text-lg font-semibold">{exam.passingScore}%</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg flex items-center">
              <div className={`h-8 w-8 mr-3 ${exam.allowRetake ? 'text-purple-600' : 'text-gray-600'}`}>
                {exam.allowRetake ? <CheckCircle /> : <XCircle />}
              </div>
              <div>
                <p className="text-sm text-gray-600">Retakes</p>
                <p className="text-lg font-semibold">
                  {exam.allowRetake ? `After ${exam.retakeAfterDays} days` : 'Not allowed'}
                </p>
              </div>
            </div>
          </div>

          {user?.role === 'student' && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold mb-4">Your Exam Status</h2>

              {attempts.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <p className="text-gray-600">You haven't attempted this exam yet.</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-medium mb-2">Previous Attempts</h3>
                  <div className="space-y-2">
                    {attempts.slice(0, 3).map((attempt) => (
                      <div key={attempt._id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(attempt.startTime).toLocaleDateString()} {new Date(attempt.startTime).toLocaleTimeString()}
                          </p>
                          <p className="text-sm font-medium">
                            {attempt.status === 'completed' ? (
                              <>
                                {attempt.isPassed ? (
                                  <span className="text-green-600">Passed ({attempt.score}%)</span>
                                ) : (
                                  <span className="text-red-600">Failed ({attempt.score}%)</span>
                                )}
                              </>
                            ) : (
                              <span className="text-yellow-600">In Progress</span>
                            )}
                          </p>
                        </div>
                        <Link
                          to={`/attempts/${attempt._id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}

                    {attempts.length > 3 && (
                      <Link to="/history" className="text-sm text-blue-600 hover:text-blue-800 block mt-2">
                        View all attempts
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {inProgressAttempt ? (
                <button
                  onClick={() => navigate(`/exams/${id}/take`, { state: { attemptId: inProgressAttempt._id } })}
                  className="w-full py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors flex justify-center items-center"
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Continue Exam in Progress
                </button>
              ) : canTakeExam ? (
                <button
                  onClick={handleStartExam}
                  disabled={startingExam}
                  className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex justify-center items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {startingExam ? (
                    'Starting Exam...'
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 mr-2" />
                      Start Exam
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {!exam.allowRetake ? (
                          'This exam does not allow retakes.'
                        ) : (
                          <>
                            You can retake this exam after {retakeDate?.toLocaleDateString()}.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetails;