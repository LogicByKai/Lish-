<script setup lang="ts">
import { useAuth } from '../composables/useAuth.ts';

defineProps<{
  currentTab: string;
}>();

const emit = defineEmits<{
  (e: 'update:currentTab', tab: string): void;
  (e: 'open-checkin'): void;
  (e: 'open-auth'): void;
  (e: 'open-evacuation'): void;
}>();

const { currentUser, isAuthenticated, logout } = useAuth();
</script>

<template>
  <header class="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
    <!-- Brand colorful top accent line (Blue, Green, Yellow, Red) -->
    <div class="h-1 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-rose-500"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Zone 1: Single text element wordmark with brand color indicators -->
      <div class="flex items-center gap-3">
        <a 
          href="#" 
          @click.prevent="emit('update:currentTab', 'qr-stand')"
          class="text-lg font-extrabold tracking-tight text-white flex items-center gap-2 hover:text-blue-300 transition-colors"
        >
          <div class="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black">
            L
          </div>
          <span>Lish AI Labs</span>
          <div class="flex items-center gap-1 ml-1" title="Lish AI Labs Identity">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          </div>
        </a>
      </div>

      <!-- Zone 2: 4-6 clean text navigation links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          @click="emit('update:currentTab', 'qr-stand')"
          :class="[
            'transition-colors py-1 hover:text-white cursor-pointer flex items-center gap-1.5',
            currentTab === 'qr-stand' ? 'text-white border-b-2 border-blue-500 font-bold' : 'text-slate-400'
          ]"
        >
          <span>📷</span>
          <span>Security Desk QR</span>
        </button>

        <button
          @click="emit('update:currentTab', 'mobile-portal')"
          :class="[
            'transition-colors py-1 hover:text-white cursor-pointer flex items-center gap-1.5',
            currentTab === 'mobile-portal' ? 'text-white border-b-2 border-blue-500 font-bold' : 'text-slate-400'
          ]"
        >
          <span>📱</span>
          <span>Mobile Check-In</span>
        </button>

        <button
          @click="emit('update:currentTab', 'roster')"
          :class="[
            'transition-colors py-1 hover:text-white cursor-pointer',
            currentTab === 'roster' ? 'text-white border-b-2 border-blue-500 font-bold' : 'text-slate-400'
          ]"
        >
          Live Roster
        </button>

        <button
          @click="emit('update:currentTab', 'equipment')"
          :class="[
            'transition-colors py-1 hover:text-white cursor-pointer',
            currentTab === 'equipment' ? 'text-white border-b-2 border-blue-500 font-bold' : 'text-slate-400'
          ]"
        >
          Lab Assets
        </button>

        <button
          @click="emit('update:currentTab', 'logs')"
          :class="[
            'transition-colors py-1 hover:text-white cursor-pointer',
            currentTab === 'logs' ? 'text-white border-b-2 border-blue-500 font-bold' : 'text-slate-400'
          ]"
        >
          Access Ledger
        </button>

        <button
          @click="emit('open-evacuation')"
          class="text-rose-400 hover:text-rose-300 transition-colors py-1 cursor-pointer font-medium"
        >
          Roll Call
        </button>
      </nav>

      <!-- Zone 3: 1-2 primary actions -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('update:currentTab', 'mobile-portal')"
          class="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-colors cursor-pointer"
        >
          + Check In
        </button>

        <!-- Authenticated Profile or Login button -->
        <template v-if="isAuthenticated && currentUser">
          <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div class="text-right hidden sm:block">
              <div class="text-xs font-medium text-white leading-tight truncate max-w-[130px]">
                {{ currentUser.name }}
              </div>
              <div class="text-[11px] text-slate-400 capitalize">
                {{ currentUser.badgeNumber }}
              </div>
            </div>
            <button
              @click="logout"
              title="Sign Out"
              class="text-xs px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </template>
        <template v-else>
          <button
            @click="emit('open-auth')"
            class="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Staff Login
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
