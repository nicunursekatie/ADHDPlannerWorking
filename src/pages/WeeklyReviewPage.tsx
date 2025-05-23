import React from 'react';
import WeeklyReviewSystemFixed from '../components/planning/weekly-review/WeeklyReviewSystemFixed';

const WeeklyReviewPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-amber-100 rounded-lg shadow-sm p-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Weekly Review</h1>
          <p className="text-amber-800">Review your progress and plan for the week ahead</p>
        </div>
      </div>
      
      <WeeklyReviewSystemFixed />
      
      <div className="bg-amber-50 rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-amber-900 mb-3">Weekly Review Benefits</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-yellow-50 border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">Prevents Things From Slipping</h3>
            <p className="text-sm text-amber-800">
              Regular reviews ensure important tasks don't get forgotten or neglected over time.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-50 border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">Reduces Mental Load</h3>
            <p className="text-sm text-amber-800">
              When you trust your system, your brain can stop trying to remember everything.
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-50 border border-amber-200">
            <h3 className="font-medium text-amber-900 mb-2">Builds Better Habits</h3>
            <p className="text-sm text-amber-800">
              Regular reflection helps you identify patterns and make meaningful improvements.
            </p>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-amber-800">
          <p>
            <strong className="text-amber-900">Pro Tip:</strong> Try to schedule your weekly review for the same time each week. 
            Many people find Friday afternoons or Sunday evenings work well.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReviewPage;