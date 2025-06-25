import React, { useMemo } from 'react';
import { Clock, TrendingUp, TrendingDown, Target, Calendar, BarChart3, Award, AlertTriangle } from 'lucide-react';
import { Task } from '../../types';
import Card from '../common/Card';

interface TimeTrackingAnalyticsProps {
  tasks: Task[];
  showDetailedBreakdown?: boolean;
}

interface TimeTrackingData {
  totalTasksWithTimeData: number;
  totalEstimatedTime: number;
  totalActualTime: number;
  averageAccuracy: number;
  accuracyTrend: 'improving' | 'declining' | 'stable';
  tasksByPerformance: {
    early: Task[];
    onTime: Task[];
    late: Task[];
  };
  weeklyStats: Array<{
    week: string;
    tasksCompleted: number;
    totalTime: number;
    accuracy: number;
  }>;
}

export const TimeTrackingAnalytics: React.FC<TimeTrackingAnalyticsProps> = ({
  tasks,
  showDetailedBreakdown = false
}) => {
  const analytics: TimeTrackingData = useMemo(() => {
    const completedTasksWithTime = tasks.filter(task => 
      task.completed && 
      task.estimatedMinutes && 
      task.actualMinutesSpent &&
      task.completedAt
    );

    if (completedTasksWithTime.length === 0) {
      return {
        totalTasksWithTimeData: 0,
        totalEstimatedTime: 0,
        totalActualTime: 0,
        averageAccuracy: 0,
        accuracyTrend: 'stable',
        tasksByPerformance: { early: [], onTime: [], late: [] },
        weeklyStats: []
      };
    }

    const totalEstimated = completedTasksWithTime.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
    const totalActual = completedTasksWithTime.reduce((sum, task) => sum + (task.actualMinutesSpent || 0), 0);
    const averageAccuracy = totalEstimated > 0 ? totalActual / totalEstimated : 0;

    // Categorize tasks by performance
    const tasksByPerformance = completedTasksWithTime.reduce((acc, task) => {
      const ratio = (task.actualMinutesSpent || 0) / (task.estimatedMinutes || 1);
      if (ratio < 0.8) {
        acc.early.push(task);
      } else if (ratio > 1.5) {
        acc.late.push(task);
      } else {
        acc.onTime.push(task);
      }
      return acc;
    }, { early: [], onTime: [], late: [] } as { early: Task[]; onTime: Task[]; late: Task[] });

    // Calculate trend (simplified - comparing first half vs second half)
    const sortedTasks = completedTasksWithTime.sort((a, b) => 
      new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
    );
    const midpoint = Math.floor(sortedTasks.length / 2);
    const firstHalfAccuracy = sortedTasks.slice(0, midpoint).reduce((sum, task) => {
      return sum + ((task.actualMinutesSpent || 0) / (task.estimatedMinutes || 1));
    }, 0) / Math.max(midpoint, 1);
    const secondHalfAccuracy = sortedTasks.slice(midpoint).reduce((sum, task) => {
      return sum + ((task.actualMinutesSpent || 0) / (task.estimatedMinutes || 1));
    }, 0) / Math.max(sortedTasks.length - midpoint, 1);

    let accuracyTrend: 'improving' | 'declining' | 'stable' = 'stable';
    const trendDifference = Math.abs(secondHalfAccuracy - firstHalfAccuracy);
    if (trendDifference > 0.2) {
      accuracyTrend = Math.abs(secondHalfAccuracy - 1) < Math.abs(firstHalfAccuracy - 1) ? 'improving' : 'declining';
    }

    // Weekly stats (last 4 weeks)
    const now = new Date();
    const weeklyStats = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekTasks = completedTasksWithTime.filter(task => {
        const completedDate = new Date(task.completedAt!);
        return completedDate >= weekStart && completedDate <= weekEnd;
      });

      const weekTotalTime = weekTasks.reduce((sum, task) => sum + (task.actualMinutesSpent || 0), 0);
      const weekTotalEstimated = weekTasks.reduce((sum, task) => sum + (task.estimatedMinutes || 0), 0);
      const weekAccuracy = weekTotalEstimated > 0 ? weekTotalTime / weekTotalEstimated : 0;

      weeklyStats.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        tasksCompleted: weekTasks.length,
        totalTime: weekTotalTime,
        accuracy: weekAccuracy
      });
    }

    return {
      totalTasksWithTimeData: completedTasksWithTime.length,
      totalEstimatedTime: totalEstimated,
      totalActualTime: totalActual,
      averageAccuracy,
      accuracyTrend,
      tasksByPerformance,
      weeklyStats
    };
  }, [tasks]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

  if (analytics.totalTasksWithTimeData === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Tracking Data Yet</h3>
          <p className="text-gray-600 mb-4">
            Complete some tasks with time estimates to see your productivity insights.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Add estimated time to your tasks and track actual time when completing them 
              to build a personalized productivity profile.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Time Tracking Overview</h3>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            analytics.accuracyTrend === 'improving' ? 'bg-green-100 text-green-700' :
            analytics.accuracyTrend === 'declining' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {analytics.accuracyTrend === 'improving' ? <TrendingUp className="w-3 h-3" /> :
             analytics.accuracyTrend === 'declining' ? <TrendingDown className="w-3 h-3" /> :
             <Target className="w-3 h-3" />}
            {analytics.accuracyTrend}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{analytics.totalTasksWithTimeData}</div>
            <div className="text-sm text-gray-600">Tasks Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatTime(analytics.totalEstimatedTime)}</div>
            <div className="text-sm text-gray-600">Estimated Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(analytics.totalActualTime)}</div>
            <div className="text-sm text-gray-600">Actual Total</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              analytics.averageAccuracy > 1.2 ? 'text-red-600' :
              analytics.averageAccuracy < 0.8 ? 'text-green-600' :
              'text-blue-600'
            }`}>
              {formatPercentage(analytics.averageAccuracy)}
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-green-600">{analytics.tasksByPerformance.early.length}</div>
            <div className="text-sm text-green-700">Finished Early</div>
            <div className="text-xs text-green-600 mt-1">
              {analytics.totalTasksWithTimeData > 0 ? 
                formatPercentage(analytics.tasksByPerformance.early.length / analytics.totalTasksWithTimeData) : '0%'}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-blue-600">{analytics.tasksByPerformance.onTime.length}</div>
            <div className="text-sm text-blue-700">On Time</div>
            <div className="text-xs text-blue-600 mt-1">
              {analytics.totalTasksWithTimeData > 0 ? 
                formatPercentage(analytics.tasksByPerformance.onTime.length / analytics.totalTasksWithTimeData) : '0%'}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">{analytics.tasksByPerformance.late.length}</div>
            <div className="text-sm text-red-700">Took Longer</div>
            <div className="text-xs text-red-600 mt-1">
              {analytics.totalTasksWithTimeData > 0 ? 
                formatPercentage(analytics.tasksByPerformance.late.length / analytics.totalTasksWithTimeData) : '0%'}
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Trends */}
      {analytics.weeklyStats.some(week => week.tasksCompleted > 0) && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium text-gray-900">Weekly Trends</h4>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {analytics.weeklyStats.map((week, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium text-gray-900">{week.week}</div>
                <div className="text-xs text-gray-600 mt-1">{week.tasksCompleted} tasks</div>
                <div className="text-xs text-gray-600">{formatTime(week.totalTime)}</div>
                {week.tasksCompleted > 0 && (
                  <div className={`text-xs font-medium mt-1 ${
                    week.accuracy > 1.2 ? 'text-red-600' :
                    week.accuracy < 0.8 ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {formatPercentage(week.accuracy)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Insights */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-orange-600" />
          <h4 className="font-medium text-gray-900">Insights & Recommendations</h4>
        </div>
        <div className="space-y-3">
          {analytics.averageAccuracy < 0.8 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">You're a Speed Demon! ⚡</div>
                  <div className="text-sm text-green-700 mt-1">
                    You consistently finish tasks faster than estimated. Consider being more ambitious with your daily goals.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {analytics.averageAccuracy > 1.5 && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="font-medium text-orange-800">Estimation Challenge 🎯</div>
                  <div className="text-sm text-orange-700 mt-1">
                    Tasks are taking longer than expected. Try breaking large tasks into smaller chunks or adding buffer time.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {analytics.averageAccuracy >= 0.8 && analytics.averageAccuracy <= 1.2 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-800">Excellent Estimator! 🎯</div>
                  <div className="text-sm text-blue-700 mt-1">
                    Your time estimates are very accurate. This helps with realistic planning and reduces stress.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {analytics.accuracyTrend === 'improving' && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">Improving Trend! 📈</div>
                  <div className="text-sm text-green-700 mt-1">
                    Your estimation accuracy is getting better over time. Keep it up!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TimeTrackingAnalytics;