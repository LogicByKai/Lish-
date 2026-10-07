import { ref, computed } from 'vue';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'employee' | 'security';
  department: string;
  badgeNumber: string;
  avatarUrl?: string;
  createdAt: string;
}

const token = ref<string | null>(localStorage.getItem('vanguard_token'));
const currentUser = ref<User | null>(null);
const currentActiveVisit = ref<any | null>(null);
const isLoading = ref<boolean>(false);
const authError = ref<string | null>(null);

export function useAuth() {
  const isAuthenticated = computed(() => !!currentUser.value && !!token.value);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isStaff = computed(() => currentUser.value?.role === 'admin' || currentUser.value?.role === 'receptionist');

  async function fetchMe() {
    if (!token.value) {
      currentUser.value = null;
      currentActiveVisit.value = null;
      return;
    }
    isLoading.value = true;
    authError.value = null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        currentUser.value = data.user;
        currentActiveVisit.value = data.activeVisit;
      } else {
        // Token invalid
        logout();
      }
    } catch (err: any) {
      console.error('Failed to restore session:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        authError.value = data.error || 'Login failed';
        return false;
      }
      token.value = data.token;
      currentUser.value = data.user;
      localStorage.setItem('vanguard_token', data.token);
      await fetchMe();
      return true;
    } catch (err: any) {
      authError.value = err.message || 'Network error during login';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(params: {
    name: string;
    email: string;
    password: string;
    role?: string;
    department?: string;
    badgeNumber?: string;
  }): Promise<boolean> {
    isLoading.value = true;
    authError.value = null;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        authError.value = data.error || 'Registration failed';
        return false;
      }
      token.value = data.token;
      currentUser.value = data.user;
      localStorage.setItem('vanguard_token', data.token);
      await fetchMe();
      return true;
    } catch (err: any) {
      authError.value = err.message || 'Network error during registration';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    if (token.value) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token.value}` },
        });
      } catch (err) {
        // ignore
      }
    }
    token.value = null;
    currentUser.value = null;
    currentActiveVisit.value = null;
    localStorage.removeItem('vanguard_token');
  }

  return {
    token,
    currentUser,
    currentActiveVisit,
    isAuthenticated,
    isAdmin,
    isStaff,
    isLoading,
    authError,
    login,
    register,
    logout,
    fetchMe,
  };
}
