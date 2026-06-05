// LocalStorage-backed simulated Firestore collections
const LOCAL_STORAGE_PREFIX = 'modulife_nosql_';

export const LocalDB = {
  // Helper to read a collection
  getCollection(name) {
    const rawData = localStorage.getItem(LOCAL_STORAGE_PREFIX + name);
    return rawData ? JSON.parse(rawData) : [];
  },

  // Helper to write a collection
  saveCollection(name, data) {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + name, JSON.stringify(data));
  },

  // Users Collection Operations
  getUserProfile(uid = 'local_user_default') {
    const users = this.getCollection('users');
    return users.find(u => u.uid === uid) || null;
  },

  saveUserProfile(profile) {
    const users = this.getCollection('users');
    const uid = profile.uid || 'local_user_default';
    const index = users.findIndex(u => u.uid === uid);
    const updatedProfile = { 
      ...profile, 
      uid: uid,
      updatedAt: new Date().toISOString() 
    };

    if (index !== -1) {
      users[index] = { ...users[index], ...updatedProfile };
    } else {
      updatedProfile.createdAt = new Date().toISOString();
      users.push(updatedProfile);
    }
    this.saveCollection('users', users);
    return updatedProfile;
  },

  // Time Logs Collection Operations (Firestore compatible)
  getTimeLogs(userId = 'local_user_default') {
    return this.getCollection('time_logs').filter(log => log.userId === userId);
  },

  addTimeLog(log) {
    const logs = this.getCollection('time_logs');
    const newLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      userId: log.userId || 'local_user_default',
      type: log.type, // 'work' | 'rest' | 'extra_work'
      startTime: log.startTime || new Date().toISOString(),
      endTime: log.endTime || new Date().toISOString(),
      durationSeconds: log.durationSeconds || 0
    };
    logs.push(newLog);
    this.saveCollection('time_logs', logs);
    return newLog;
  },

  // Water Logs Collection Operations (Firestore compatible)
  getWaterLogs(userId = 'local_user_default') {
    return this.getCollection('water_logs').filter(log => log.userId === userId);
  },

  addWaterLog(userId = 'local_user_default', amountMl = 250) {
    const logs = this.getCollection('water_logs');
    const newLog = {
      id: 'water_' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      timestamp: new Date().toISOString(),
      amountMl: amountMl
    };
    logs.push(newLog);
    this.saveCollection('water_logs', logs);
    return newLog;
  },

  clearWaterLogs(userId = 'local_user_default') {
    const logs = this.getCollection('water_logs').filter(log => log.userId !== userId);
    this.saveCollection('water_logs', logs);
  },

  // Quick reset for clean state
  clearAll() {
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'users');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'time_logs');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'water_logs');
  }
};
export default LocalDB;
