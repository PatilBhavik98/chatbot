import { API_BASE } from '../config';

const TOKEN_KEY = 'chatbot_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export const api = {
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  conversations: () => request('/api/conversations'),
  startConversation: (peerEmail) =>
    request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ peerEmail }),
    }),
  messages: (conversationId) => request(`/api/messages/${conversationId}`),
};