interface FocusSession {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

class FocusTracker {
  private currentSession: FocusSession | null = null;
  private sessions: FocusSession[] = [];
  private readonly MAX_SESSION_DURATION = 240; // 4 hours in minutes

  startFocus(taskId: string): void {
    // End any existing session
    if (this.currentSession) {
      // Check if the existing session is stuck before ending it
      const duration = this.getCurrentSessionDuration();
      if (duration > this.MAX_SESSION_DURATION) {
        console.warn(`Ending stuck focus session (${duration.toFixed(0)} minutes)`);
        this.resetCurrentSession();
      } else {
        this.endFocus();
      }
    }

    this.currentSession = {
      taskId,
      startTime: new Date()
    };

    // Save to localStorage
    localStorage.setItem('currentFocusSession', JSON.stringify(this.currentSession));
  }

  endFocus(): FocusSession | null {
    if (!this.currentSession) return null;

    const endTime = new Date();
    const duration = (endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60);

    const completedSession: FocusSession = {
      ...this.currentSession,
      endTime,
      duration: Math.min(duration, this.MAX_SESSION_DURATION) // Cap duration at maximum
    };

    this.sessions.push(completedSession);
    this.currentSession = null;

    // Save to localStorage
    localStorage.removeItem('currentFocusSession');
    this.saveSessions();

    return completedSession;
  }

  getCurrentSession(): FocusSession | null {
    return this.currentSession;
  }

  getCurrentSessionDuration(): number {
    if (!this.currentSession) return 0;
    const duration = (new Date().getTime() - this.currentSession.startTime.getTime()) / (1000 * 60);
    
    // Cap duration at maximum to prevent unrealistic times
    return Math.min(duration, this.MAX_SESSION_DURATION);
  }

  getTodaysSessions(): FocusSession[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
  }

  getTaskFocusTime(taskId: string): number {
    const taskSessions = this.getTodaysSessions().filter(s => s.taskId === taskId);
    return taskSessions.reduce((total, session) => total + (session.duration || 0), 0);
  }

  shouldWarnAboutTaskSwitch(newTaskId: string): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.taskId === newTaskId) return false;
    
    const currentDuration = this.getCurrentSessionDuration();
    return currentDuration < 3; // Warn if switching tasks after less than 3 minutes
  }

  shouldSuggestBreak(): boolean {
    if (!this.currentSession) return false;
    
    const currentDuration = this.getCurrentSessionDuration();
    return currentDuration > 120; // Suggest break after 2 hours
  }

  resetCurrentSession(): void {
    // Clear the current session without saving it
    this.currentSession = null;
    localStorage.removeItem('currentFocusSession');
  }

  clearAllSessions(): void {
    // Clear all sessions including the current one
    this.currentSession = null;
    this.sessions = [];
    localStorage.removeItem('currentFocusSession');
    localStorage.removeItem('focusSessions');
  }

  private saveSessions(): void {
    localStorage.setItem('focusSessions', JSON.stringify(this.sessions));
  }

  private loadSessions(): void {
    const saved = localStorage.getItem('focusSessions');
    if (saved) {
      this.sessions = JSON.parse(saved);
    }

    // Load current session if exists
    const currentSaved = localStorage.getItem('currentFocusSession');
    if (currentSaved) {
      this.currentSession = JSON.parse(currentSaved);
      // Convert string dates back to Date objects
      if (this.currentSession) {
        this.currentSession.startTime = new Date(this.currentSession.startTime);
        
        // Check if session has exceeded maximum duration
        const duration = (new Date().getTime() - this.currentSession.startTime.getTime()) / (1000 * 60);
        if (duration > this.MAX_SESSION_DURATION) {
          console.warn(`Focus session exceeded maximum duration (${duration.toFixed(0)} minutes). Clearing stuck session.`);
          this.resetCurrentSession();
        }
      }
    }
  }

  initialize(): void {
    this.loadSessions();
  }
}

export const focusTracker = new FocusTracker();
export type { FocusSession };