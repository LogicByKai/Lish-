<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckpoint, type VisitRecord } from '../composables/useCheckpoint.ts';

const { visits, resetDatabase } = useCheckpoint();

const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'checked_out'>('all');

const filtered = computed(() => {
  return visits.value.filter((v) => {
    if (statusFilter.value !== 'all' && v.status !== statusFilter.value) return false;
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      return (
        v.name.toLowerCase().includes(q) ||
        v.badgeNumber.toLowerCase().includes(q) ||
        (v.company && v.company.toLowerCase().includes(q)) ||
        (v.hostEmployee && v.hostEmployee.toLowerCase().includes(q))
      );
    }
    return true;
  });
});

function exportCSV() {
  const headers = ['ID', 'Badge Number', 'Type', 'Name', 'Email', 'Company', 'Host', 'Purpose', 'Location', 'Check-In', 'Check-Out', 'Status', 'Duration (Minutes)'];
  const rows = filtered.value.map((v) => [
    v.id,
    v.badgeNumber,
    v.type,
    `"${v.name.replace(/"/g, '""')}"`,
    v.email || '',
    `"${(v.company || '').replace(/"/g, '""')}"`,
    `"${(v.hostEmployee || '').replace(/"/g, '""')}"`,
    `"${(v.purpose || '').replace(/"/g, '""')}"`,
    `"${(v.location || '').replace(/"/g, '""')}"`,
    v.checkInTime,
    v.checkOutTime || '',
    v.status,
    v.durationMinutes || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `vanguard_checkins_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-white tracking-tight">Facility Access Ledger & Audit Trail</h2>
        <p class="text-xs text-slate-400 mt-0.5">Comprehensive chronological database of all check-in and check-out events.</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="resetDatabase"
          title="Reset database to seed records"
          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors cursor-pointer"
        >
          Reset Demo Data
        </button>
        <button
          @click="exportCSV"
          class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>📥</span>
          <span>Export CSV</span>
        </button>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
        <button
          @click="statusFilter = 'all'"
          :class="['px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          All Records ({{ visits.length }})
        </button>
        <button
          @click="statusFilter = 'active'"
          :class="['px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', statusFilter === 'active' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          Active Only
        </button>
        <button
          @click="statusFilter = 'checked_out'"
          :class="['px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', statusFilter === 'checked_out' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          Completed Only
        </button>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter logs by attendee or badge..."
        class="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
      />
    </div>

    <!-- Ledger Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th class="py-3 px-4">Badge</th>
              <th class="py-3 px-4">Attendee</th>
              <th class="py-3 px-4">Type</th>
              <th class="py-3 px-4">Organization</th>
              <th class="py-3 px-4">Host / Department</th>
              <th class="py-3 px-4">Arrival Timestamp</th>
              <th class="py-3 px-4">Departure Timestamp</th>
              <th class="py-3 px-4">Dwell Duration</th>
              <th class="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="v in filtered"
              :key="v.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4 font-mono font-semibold text-indigo-400 tabular-nums">
                {{ v.badgeNumber }}
              </td>
              <td class="py-3 px-4">
                <div class="font-medium text-white">{{ v.name }}</div>
                <div class="text-[11px] text-slate-400">{{ v.email }}</div>
              </td>
              <td class="py-3 px-4 capitalize text-slate-300">
                {{ v.type }}
              </td>
              <td class="py-3 px-4 text-slate-300">
                {{ v.company || 'Vanguard HQ' }}
              </td>
              <td class="py-3 px-4 text-slate-300">
                {{ v.hostEmployee || v.department || '—' }}
              </td>
              <td class="py-3 px-4 font-mono tabular-nums text-slate-300">
                {{ new Date(v.checkInTime).toLocaleString() }}
              </td>
              <td class="py-3 px-4 font-mono tabular-nums text-slate-400">
                {{ v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : '—' }}
              </td>
              <td class="py-3 px-4 font-mono tabular-nums text-slate-300">
                {{ v.durationMinutes ? `${v.durationMinutes} min` : 'In Session' }}
              </td>
              <td class="py-3 px-4 text-right">
                <span
                  :class="[
                    'text-[11px] px-2 py-0.5 rounded font-mono',
                    v.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                  ]"
                >
                  {{ v.status === 'active' ? 'Active' : 'Departed' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
