<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckpoint, type VisitRecord } from '../composables/useCheckpoint.ts';
import { useAuth } from '../composables/useAuth.ts';

const emit = defineEmits<{
  (e: 'show-badge', visit: VisitRecord): void;
  (e: 'open-checkin'): void;
}>();

const { stats, visits, checkOut, bulkCheckOut } = useCheckpoint();
const { isStaff, isAdmin } = useAuth();

const filterDocket = ref<string>('all');
const filterStatus = ref<'active' | 'all'>('active');
const searchQuery = ref('');

const filteredVisits = computed(() => {
  return visits.value.filter((v) => {
    if (filterStatus.value === 'active' && v.status !== 'active') return false;
    if (filterDocket.value !== 'all') {
      if (filterDocket.value === 'tech' && !v.department?.includes('Technical')) return false;
      if (filterDocket.value === 'annt' && !v.department?.includes('Annotation')) return false;
      if (filterDocket.value === 'hr' && !v.department?.includes('HR')) return false;
      if (filterDocket.value === 'intern' && !v.department?.includes('Intern')) return false;
      if (filterDocket.value === 'visitor' && v.type !== 'visitor' && !v.department?.includes('Visitor')) return false;
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      return (
        v.name.toLowerCase().includes(q) ||
        v.badgeNumber.toLowerCase().includes(q) ||
        (v.department && v.department.toLowerCase().includes(q)) ||
        (v.hostEmployee && v.hostEmployee.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q))
      );
    }
    return true;
  });
});

function getDocketColorClass(docket?: string): string {
  if (!docket) return 'text-slate-400';
  if (docket.includes('Technical')) return 'text-blue-400 font-semibold';
  if (docket.includes('Annotation')) return 'text-emerald-400 font-semibold';
  if (docket.includes('HR')) return 'text-amber-400 font-semibold';
  if (docket.includes('Intern')) return 'text-rose-400 font-semibold';
  return 'text-slate-300';
}

function calculateDuration(checkInTime: string, checkOutTime?: string): string {
  const start = new Date(checkInTime).getTime();
  const end = checkOutTime ? new Date(checkOutTime).getTime() : Date.now();
  const diffMinutes = Math.floor((end - start) / 60000);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins}m`;
}

async function handleCheckOut(visit: VisitRecord) {
  await checkOut({ id: visit.id, badgeNumber: visit.badgeNumber });
}

async function handleBulkCheckOutAllActive() {
  const activeIds = visits.value.filter((v) => v.status === 'active').map((v) => v.id);
  if (!activeIds.length) return;
  if (confirm(`Check out all ${activeIds.length} active personnel on premises?`)) {
    await bulkCheckOut(activeIds);
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Stats / KPI Cards with Lish AI Labs Palette -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div class="text-xs text-slate-400 font-medium">Currently On Premises</div>
        <div class="text-2xl font-bold font-mono tabular-nums text-white mt-1">
          {{ stats.currentlyOnSite }}
          <span class="text-xs font-sans text-slate-500 font-normal">/ 150 cap</span>
        </div>
        <div class="text-[11px] text-emerald-400 mt-2 flex items-center gap-1.5 font-medium">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Security Desk Verified (≤300m)</span>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-slate-400 font-medium">Technical & Research Staff</div>
        <div class="text-2xl font-bold font-mono tabular-nums text-blue-400 mt-1">
          {{ visits.filter(v => v.status === 'active' && v.department?.includes('Technical')).length }}
        </div>
        <div class="text-[11px] text-slate-400 mt-2">
          <span>AI / ML & Infrastructure</span>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-slate-400 font-medium">Annotation & Data Team</div>
        <div class="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
          {{ visits.filter(v => v.status === 'active' && v.department?.includes('Annotation')).length }}
        </div>
        <div class="text-[11px] text-slate-400 mt-2">
          <span>Active Dataset Labelers</span>
        </div>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div class="text-xs text-slate-400 font-medium">Interns & HR Personnel</div>
        <div class="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
          {{ visits.filter(v => v.status === 'active' && (v.department?.includes('Intern') || v.department?.includes('HR'))).length }}
        </div>
        <div class="text-[11px] text-slate-400 mt-2">
          <span>Attachees & Culture Lead</span>
        </div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Active status toggle -->
        <div class="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            @click="filterStatus = 'active'"
            :class="[
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              filterStatus === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            ]"
          >
            Active On Site ({{ stats.currentlyOnSite }})
          </button>
          <button
            @click="filterStatus = 'all'"
            :class="[
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
              filterStatus === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            ]"
          >
            All Logs
          </button>
        </div>

        <!-- Docket Segmented Filter -->
        <div class="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            @click="filterDocket = 'all'"
            :class="['px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', filterDocket === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
          >
            All Dockets
          </button>
          <button
            @click="filterDocket = 'tech'"
            :class="['px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', filterDocket === 'tech' ? 'bg-blue-900/60 text-blue-200 border border-blue-700' : 'text-slate-400 hover:text-white']"
          >
            Technical
          </button>
          <button
            @click="filterDocket = 'annt'"
            :class="['px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', filterDocket === 'annt' ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700' : 'text-slate-400 hover:text-white']"
          >
            Annotation
          </button>
          <button
            @click="filterDocket = 'hr'"
            :class="['px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', filterDocket === 'hr' ? 'bg-amber-900/60 text-amber-200 border border-amber-700' : 'text-slate-400 hover:text-white']"
          >
            HR
          </button>
          <button
            @click="filterDocket = 'intern'"
            :class="['px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer', filterDocket === 'intern' ? 'bg-rose-900/60 text-rose-200 border border-rose-700' : 'text-slate-400 hover:text-white']"
          >
            Interns
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search unique ID, name, docket..."
          class="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full sm:w-60"
        />

        <button
          v-if="isStaff || isAdmin"
          @click="handleBulkCheckOutAllActive"
          :disabled="stats.currentlyOnSite === 0"
          class="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
        >
          Check Out All
        </button>

        <button
          @click="emit('open-checkin')"
          class="whitespace-nowrap px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
        >
          + Check In
        </button>
      </div>
    </div>

    <!-- Live Roster Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th class="py-3.5 px-4">Attendee</th>
              <th class="py-3.5 px-4">Unique ID</th>
              <th class="py-3.5 px-4">Docket / Department</th>
              <th class="py-3.5 px-4">Location</th>
              <th class="py-3.5 px-4">Arrival</th>
              <th class="py-3.5 px-4">Duration</th>
              <th class="py-3.5 px-4">Geofence / Status</th>
              <th class="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="v in filteredVisits"
              :key="v.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3.5 px-4">
                <div class="font-bold text-white">{{ v.name }}</div>
                <div class="text-[11px] text-slate-400">
                  {{ v.email || '—' }}
                </div>
              </td>

              <!-- Unique ID -->
              <td class="py-3.5 px-4">
                <span class="font-mono tabular-nums font-bold text-blue-400 px-2 py-0.5 bg-blue-950/40 rounded border border-blue-900/50">
                  {{ v.badgeNumber }}
                </span>
              </td>

              <!-- Docket -->
              <td class="py-3.5 px-4">
                <div :class="getDocketColorClass(v.department)">{{ v.department || 'General' }}</div>
                <div class="text-[11px] text-slate-400 truncate max-w-[180px]">{{ v.purpose }}</div>
              </td>

              <td class="py-3.5 px-4 text-slate-300">
                {{ v.location }}
              </td>

              <td class="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                {{ new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </td>

              <td class="py-3.5 px-4 font-mono tabular-nums text-slate-400">
                {{ calculateDuration(v.checkInTime, v.checkOutTime) }}
              </td>

              <!-- Geofence & Status -->
              <td class="py-3.5 px-4">
                <div v-if="v.status === 'active'" class="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>On Site (≤300m)</span>
                </div>
                <div v-else class="text-slate-500">
                  Checked Out
                </div>
              </td>

              <td class="py-3.5 px-4 text-right space-x-2">
                <button
                  @click="emit('show-badge', v)"
                  title="View Badge Card"
                  class="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  ID Pass
                </button>

                <button
                  v-if="v.status === 'active'"
                  @click="handleCheckOut(v)"
                  class="px-2.5 py-1 text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg text-[11px] transition-colors cursor-pointer font-bold"
                >
                  Check Out
                </button>
              </td>
            </tr>

            <tr v-if="filteredVisits.length === 0">
              <td colspan="8" class="py-12 text-center text-slate-400">
                <div class="text-sm font-medium">No attendees match this filter</div>
                <div class="text-xs text-slate-500 mt-1">Attendees who scan the security desk QR code will appear here.</div>
                <button
                  @click="emit('open-checkin')"
                  class="mt-4 px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors cursor-pointer font-bold"
                >
                  + Log Check-In
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
