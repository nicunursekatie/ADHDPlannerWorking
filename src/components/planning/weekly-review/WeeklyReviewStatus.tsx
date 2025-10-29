import React from 'react';
import { useApp } from '../../../context/AppContextSupabase';
import { format, formatDistanceToNow } from 'date-fns';

export const WeeklyReviewStatus: React.FC = () => {
  const { getLastWeeklyReviewDate, needsWeeklyReview } = useApp();

  const lastReviewDate = getLastWeeklyReviewDate();
  const isOverdue = needsWeeklyReview();

  if (!lastReviewDate) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-amber-800">
              No weekly review recorded yet
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Complete your first weekly review to start tracking your progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  const reviewDate = new Date(lastReviewDate);
  const daysSince = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={`border-l-4 p-4 rounded-lg ${
      isOverdue
        ? 'bg-red-50 border-red-500'
        : daysSince >= 5
        ? 'bg-yellow-50 border-yellow-500'
        : 'bg-green-50 border-green-500'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isOverdue ? (
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : daysSince >= 5 ? (
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${
            isOverdue
              ? 'text-red-800'
              : daysSince >= 5
              ? 'text-yellow-800'
              : 'text-green-800'
          }`}>
            {isOverdue
              ? 'Weekly review is overdue'
              : daysSince >= 5
              ? 'Weekly review coming up soon'
              : 'Weekly review is up to date'}
          </p>
          <div className={`mt-1 text-xs ${
            isOverdue
              ? 'text-red-700'
              : daysSince >= 5
              ? 'text-yellow-700'
              : 'text-green-700'
          }`}>
            <p>Last review: {format(reviewDate, 'MMMM d, yyyy')} ({formatDistanceToNow(reviewDate, { addSuffix: true })})</p>
            {isOverdue && <p className="mt-1">It's been {daysSince} days since your last review</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReviewStatus;
