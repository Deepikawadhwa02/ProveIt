import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const TakeExam = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attemptId = location.state?.attemptId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examInfo, setExamInfo] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const maxWarnings = 3; // Maximum number of warnings before auto-submit

  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);

  const handleForceSubmit = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      console.log('Force submitting exam...');

      // First, save current answers
      await api.post(`/api/attempts/${attemptId}/submit`, {
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          question: questionId,
          selectedOption
        }))
      });

      // Then force submit
      const response = await api.post(`/api/attempts/${attemptId}/force-submit`);

      if (response.data) {
        toast.success('Exam has been submitted due to multiple warnings');
        setTimeout(() => {
          navigate(`/attempts/${attemptId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error force submitting:', error);
      toast.error('Failed to submit exam');
      setSubmitting(false);
    }
  }, [attemptId, answers, navigate, submitting]);

  const handleTabSwitch = useCallback(async () => {
    if (!attemptId || submitting) return;

    const newCount = warningCount + 1;
    console.log('Tab switch detected, current count:', warningCount, 'new count:', newCount);

    // Update local state immediately
    setWarningCount(newCount);

    // Show warning toast
    toast.error(`Warning ${newCount}/${maxWarnings}: Tab switching is not allowed!`, {
      duration: 3000
    });

    try {
      // Log violation to backend
      const response = await api.post(`/api/attempts/${attemptId}/violation`, {
        type: 'tab_switch',
        warningCount: newCount
      });

      console.log('Violation logged, response:', response.data);

      // If max warnings reached, submit exam
      if (newCount >= maxWarnings) {
        toast.error('Maximum warnings reached. Submitting exam...', {
          duration: 3000
        });
        await handleForceSubmit();
      }
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  }, [attemptId, warningCount, handleForceSubmit, submitting]);

  // Set up visibility change detection
  useEffect(() => {
    let lastWarningTime = 0;
    const warningCooldown = 1000; // 1 second cooldown between warnings

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastWarningTime >= warningCooldown) {
          lastWarningTime = now;
          handleTabSwitch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [warningCount, handleTabSwitch]);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);

        if (!attemptId) {
          toast.error('No active attempt found');
          navigate(`/exams/${id}`);
          return;
        }

        // Fetch attempt details
        const attemptRes = await api.get(`/api/attempts/${attemptId}`);
        const attempt = attemptRes.data;

        // Check if attempt is still in progress
        if (attempt.status !== 'in-progress') {
          toast.error('This attempt has already been completed');
          navigate(`/attempts/${attemptId}`);
          return;
        }

        // Fetch exam info
        const examRes = await api.get(`/api/exams/${id}`);
        setExamInfo(examRes.data);

        // Set start time and calculate time left
        const startTime = new Date(attempt.startTime);
        setStartTime(startTime);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + examRes.data.duration);

        const now = new Date();

        console.log("Start time:", startTime);
        console.log("End time:", endTime);
        console.log("Current time:", now);

        const timeLeftMs = Math.max(0, endTime.getTime() - now.getTime());
        console.log("Time left (ms):", timeLeftMs);

        if (timeLeftMs < 10000) { // Less than 10 seconds left
          toast.error('Time is almost up! You have 10 seconds to finish.');
          setTimeLeft(10); // At least give 10 seconds
        } else {
          setTimeLeft(Math.floor(timeLeftMs / 1000));
        }

        // Fetch questions
        const questionsRes = await api.get(`/api/exams/${id}/questions`);
        setQuestions(questionsRes.data);

        // Initialize answers from attempt
        setAnswers(attempt.answers || []);

      } catch (error) {
        console.error('Error fetching exam data:', error);
        toast.error('Failed to load exam');
        navigate(`/exams/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [id, attemptId, navigate]);

  // Set up timer
  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Set up auto-save
  useEffect(() => {
    if (answers.length > 0 && !autoSaveRef.current) {
      // Auto-save every 30 seconds
      autoSaveRef.current = setInterval(() => {
        saveAnswers();
      }, 30000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
    };
  }, [answers]);

  const saveAnswers = async () => {
    try {
      setAutoSaving(true);
      await api.post(`/api/attempts/${attemptId}/save`, { answers });
      toast.success('Progress saved', { id: 'auto-save' });
    } catch (error) {
      console.error('Error saving answers:', error);
      toast.error('Failed to save progress', { id: 'auto-save' });
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const answerIndex = newAnswers.findIndex(a => a.question === questionId);

      if (answerIndex !== -1) {
        newAnswers[answerIndex] = {
          ...newAnswers[answerIndex],
          selectedOption: optionIndex
        };
      } else {
        newAnswers.push({
          question: questionId,
          selectedOption: optionIndex
        });
      }

      return newAnswers;
    });
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    try {
      setSubmitting(true);

      // Check if all questions are answered
      const unansweredCount = questions.length - answers.filter(a => a.selectedOption !== undefined).length;

      if (unansweredCount > 0) {
        const confirmed = window.confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`);
        if (!confirmed) {
          setSubmitting(false);
          return;
        }
      }

      await api.post(`/api/attempts/${attemptId}/submit`, {
        answers: answers.map(a => ({
          question: a.question,
          selectedOption: a.selectedOption
        })),
        isAutoSubmit,
        warningCount // Include final warning count
      });
      toast.success('Exam submitted successfully');
      navigate(`/attempts/${attemptId}`);

    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.question === currentQuestion?._id);
  const answeredCount = answers.filter(a => a.selectedOption !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Exam Header */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{examInfo?.title}</h1>
          <p className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center">
          <div className={`flex items-center ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
            <Clock className="h-5 w-5 mr-1" />
            <span className="font-medium">{formatTime(timeLeft)}</span>
          </div>

          {warningCount > 0 && (
            <div className="ml-6 text-amber-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Warnings: {warningCount}/{maxWarnings}</span>
            </div>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="ml-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-1" />
            {submitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="bg-white rounded-lg shadow p-4 md:col-span-1">
          <h2 className="text-lg font-medium mb-4">Questions</h2>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const isAnswered = answers.some(a => a.question === q._id && a.selectedOption !== undefined);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={q._id}
                  onClick={() => goToQuestion(index)}
                  className={`h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium
                    ${isCurrent ? 'bg-blue-600 text-white' : ''}
                    ${isAnswered && !isCurrent ? 'bg-green-100 text-green-800' : ''}
                    ${!isAnswered && !isCurrent ? 'bg-gray-100 text-gray-800' : ''}
                    hover:bg-blue-500 hover:text-white transition-colors`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Answered: {answeredCount}/{questions.length}</span>
              <span>Remaining: {questions.length - answeredCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {autoSaving && (
            <div className="mt-4 text-sm text-gray-600 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              Saving progress...
            </div>
          )}
        </div>

        {/* Question and Options */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-3">
          {currentQuestion ? (
            <>
              <h2 className="text-xl font-semibold mb-6">
                {currentQuestionIndex + 1}. {currentQuestion.text}
              </h2>

              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={option._id}
                    onClick={() => handleAnswerSelect(currentQuestion._id, index)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors
                      ${currentAnswer?.selectedOption === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                  >
                    <div className="flex items-start">
                      <div className={`h-6 w-6 flex items-center justify-center rounded-full border mr-3
                        ${currentAnswer?.selectedOption === index
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300'}`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div className="text-gray-800">{option.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={goToPrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 flex items-center text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5 mr-1" />
                  Previous
                </button>

                <button
                  onClick={goToNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-4 py-2 flex items-center text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-1" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No questions available</h2>
              <p className="text-gray-600">There are no questions for this exam.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TakeExam;