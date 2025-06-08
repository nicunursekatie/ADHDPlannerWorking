interface FocusSession {
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

class FocusTracker {
  private currentSession: FocusSession | null = null;
  private sessions: FocusSession[] = [];

  startFocus(taskId: string): void {
    // End any existing session
    if (this.currentSession) {
      this.endFocus();
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
      duration
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
    return (new Date().getTime() - this.currentSession.startTime.getTime()) / (1000 * 60);
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
      }
    }
  }

  initialize(): void {
    this.loadSessions();
  }
}

export const focusTracker = new FocusTracker();
export type { FocusSession };