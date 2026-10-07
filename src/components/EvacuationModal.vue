<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckpoint } from '../composables/useCheckpoint.ts';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { visits } = useCheckpoint();

const accountedMap = ref<Record<string, boolean>>({});

const activePersonnel = computed(() => {
  return visits.value.filter((v) => v.status === 'active');
});

const accountedCount = computed(() => {
  return Object.values(accountedMap.value).filter(Boolean).length;
});

function toggleAccounted(id: string) {
  accountedMap.value[id] = !accountedMap.value[id];
}

function markAllAccounted() {
  activePersonnel.value.forEach((p) => {
    accountedMap.value[p.id] = true;
  });
}

function printMusterList() {
  window.print();
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
    <div class="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative text-slate-100 my-8">
      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        aria-label="Close"
      >
        ✕
      </button>

      <!-- Header with Emergency status -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
            <h2 class="text-xl font-bold text-white tracking-tight">Facility Evacuation & Safety Roll Call</h2>
          </div>
          <p class="text-xs text-rose-300/80 mt-1">
            Real-time emergency muster headcount. Account for all on-site personnel immediately.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-right">
            <div class="text-xs text-slate-400">Accounted Headcount</div>
            <div class="text-base font-bold font-mono text-emerald-400 tabular-nums">
              {{ accountedCount }} / {{ activePersonnel.length }}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
        <span class="text-slate-400">
          Assembly Point: <strong class="text-white">North Courtyard Pavilion</strong>
        </span>
        <div class="flex items-center gap-2">
          <button
            @click="markAllAccounted"
            class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
          >
            Mark All Accounted
          </button>
          <button
            @click="printMusterList"
            class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded transition-colors cursor-pointer"
          >
            Print Muster Sheet
          </button>
        </div>
      </div>

      <!-- Personnel List -->
      <div class="max-h-96 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950">
        <div
          v-for="p in activePersonnel"
          :key="p.id"
          @click="toggleAccounted(p.id)"
          :class="[
            'p-3 flex items-center justify-between cursor-pointer transition-colors text-xs',
            accountedMap[p.id] ? 'bg-emerald-950/20 text-slate-200' : 'hover:bg-slate-900 text-white'
          ]"
        >
          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              :checked="accountedMap[p.id]"
              @click.stop="toggleAccounted(p.id)"
              class="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <div>
              <div class="font-semibold flex items-center gap-2">
                <span>{{ p.name }}</span>
                <span class="font-mono text-xs text-indigo-400">({{ p.badgeNumber }})</span>
                <span class="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-300 rounded">
                  {{ p.type }}
                </span>
              </div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                Location: <span class="text-slate-200">{{ p.location }}</span>
                <span v-if="p.hostEmployee"> · Host: {{ p.hostEmployee }}</span>
                <span v-if="p.phone"> · Phone: {{ p.phone }}</span>
              </div>
            </div>
          </div>

          <div class="text-right">
            <span
              :class="[
                'text-[10px] font-mono px-2 py-0.5 rounded font-bold',
                accountedMap[p.id] ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-950 text-rose-400 border border-rose-800'
              ]"
            >
              {{ accountedMap[p.id] ? 'ACCOUNTED' : 'UNVERIFIED' }}
            </span>
          </div>
        </div>

        <div v-if="activePersonnel.length === 0" class="p-8 text-center text-slate-400 text-xs">
          Building is completely clear. No active attendees registered on premises.
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <button
          @click="emit('close')"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg cursor-pointer transition-colors"
        >
          Close Roster
        </button>
      </div>
    </div>
  </div>
</template>
