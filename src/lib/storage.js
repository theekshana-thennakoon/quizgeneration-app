// Simulated Local Storage Database

// Users
export const getUsers = () => JSON.parse(localStorage.getItem('qm_users') || '[]');
export const saveUser = (user) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem('qm_users', JSON.stringify(users));
};

export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

// Quizzes
export const getQuizzes = () => JSON.parse(localStorage.getItem('qm_quizzes') || '[]');
export const getUserQuizzes = (userEmail) => {
  const quizzes = getQuizzes();
  return quizzes.filter(q => q.userEmail === userEmail).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const saveQuiz = (quiz) => {
  const quizzes = getQuizzes();
  quizzes.push(quiz);
  localStorage.setItem('qm_quizzes', JSON.stringify(quizzes));
};

// Current Session
export const getSession = () => JSON.parse(localStorage.getItem('qm_session') || 'null');
export const setSession = (user) => localStorage.setItem('qm_session', JSON.stringify(user));
export const clearSession = () => localStorage.removeItem('qm_session');

// Shared Quizzes (public, no login required)
export const saveSharedQuiz = (quiz) => {
  const shareId = 'share_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const shared = JSON.parse(localStorage.getItem('qm_shared') || '{}');
  shared[shareId] = { ...quiz, shareId, sharedAt: new Date().toISOString() };
  localStorage.setItem('qm_shared', JSON.stringify(shared));
  return shareId;
};

export const getSharedQuiz = (shareId) => {
  const shared = JSON.parse(localStorage.getItem('qm_shared') || '{}');
  return shared[shareId] || null;
};
