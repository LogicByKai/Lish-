<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth.ts';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { login, register, isLoading, authError } = useAuth();

const mode = ref<'login' | 'register'>('login');

// Login form
const loginEmail = ref('');
const loginPassword = ref('');

// Registration form
const regName = ref('');
const regEmail = ref('');
const regPassword = ref('');
const regRole = ref<'employee' | 'receptionist' | 'admin'>('employee');
const regDepartment = ref('Engineering');
const regBadge = ref('');

const formError = ref<string | null>(null);

async function handleLogin() {
  formError.value = null;
  if (!loginEmail.value || !loginPassword.value) {
    formError.value = 'Please provide both email and password.';
    return;
  }
  const ok = await login(loginEmail.value, loginPassword.value);
  if (ok) {
    emit('close');
  }
}

async function handleRegister() {
  formError.value = null;
  if (!regName.value || !regEmail.value || !regPassword.value) {
    formError.value = 'Please fill out all required fields.';
    return;
  }
  if (regPassword.value.length < 6) {
    formError.value = 'Password must be at least 6 characters.';
    return;
  }
  const ok = await register({
    name: regName.value,
    email: regEmail.value,
    password: regPassword.value,
    role: regRole.value,
    department: regDepartment.value,
    badgeNumber: regBadge.value || undefined,
  });
  if (ok) {
    emit('close');
  }
}

function fillDemo(email: string, pass: string) {
  mode.value = 'login';
  loginEmail.value = email;
  loginPassword.value = pass;
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        aria-label="Close"
      >
        ✕
      </button>

      <!-- Tabs -->
      <div class="flex items-center gap-4 border-b border-slate-800 pb-3 mb-6">
        <button
          @click="mode = 'login'"
          :class="['text-base font-semibold pb-1 transition-colors', mode === 'login' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200']"
        >
          Sign In
        </button>
        <button
          @click="mode = 'register'"
          :class="['text-base font-semibold pb-1 transition-colors', mode === 'register' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200']"
        >
          Create Account
        </button>
      </div>

      <!-- Error banners -->
      <div v-if="authError || formError" class="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-xs">
        {{ authError || formError }}
      </div>

      <!-- LOGIN FORM -->
      <form v-if="mode === 'login'" @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Corporate Email</label>
          <input
            v-model="loginEmail"
            type="email"
            placeholder="e.g. admin@vanguardhq.com"
            required
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <input
            v-model="loginPassword"
            type="password"
            placeholder="••••••••"
            required
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
        >
          {{ isLoading ? 'Verifying Credentials...' : 'Sign In' }}
        </button>

        <!-- Quick Demo Accounts -->
        <div class="mt-6 pt-4 border-t border-slate-800">
          <div class="text-xs text-slate-400 mb-2">Quick Demo Access:</div>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="fillDemo('admin@vanguardhq.com', 'Admin@123')"
              class="px-2 py-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-center truncate cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              @click="fillDemo('reception@vanguardhq.com', 'Reception@123')"
              class="px-2 py-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-center truncate cursor-pointer"
            >
              Reception
            </button>
            <button
              type="button"
              @click="fillDemo('elena.rostova@vanguardhq.com', 'Elena@123')"
              class="px-2 py-1.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-center truncate cursor-pointer"
            >
              Staff
            </button>
          </div>
        </div>
      </form>

      <!-- REGISTRATION FORM -->
      <form v-else @submit.prevent="handleRegister" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Full Legal Name</label>
          <input
            v-model="regName"
            type="text"
            placeholder="Jane Doe"
            required
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Corporate Email</label>
          <input
            v-model="regEmail"
            type="email"
            placeholder="jane.doe@vanguardhq.com"
            required
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Role</label>
            <select
              v-model="regRole"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="employee">Staff / Employee</option>
              <option value="receptionist">Receptionist</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Department</label>
            <input
              v-model="regDepartment"
              type="text"
              placeholder="Engineering"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              v-model="regPassword"
              type="password"
              placeholder="Min 6 chars"
              required
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Badge ID (Optional)</label>
            <input
              v-model="regBadge"
              type="text"
              placeholder="EMP-105"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
        >
          {{ isLoading ? 'Creating Account...' : 'Complete Registration' }}
        </button>
      </form>
    </div>
  </div>
</template>
