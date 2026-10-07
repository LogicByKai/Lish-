<script setup lang="ts">
import type { VisitRecord } from '../composables/useCheckpoint.ts';
import badgeImage from '../assets/images/visitor_badge_mockup_1791376144609.jpg';

const props = defineProps<{
  visit: VisitRecord | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function printBadge() {
  window.print();
}
</script>

<template>
  <div v-if="visit" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 overflow-hidden">
      <!-- Colorful brand bar -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-rose-500"></div>

      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        aria-label="Close"
      >
        ✕
      </button>

      <div class="mb-4">
        <h3 class="text-lg font-bold text-white tracking-tight">Lish AI Labs Security Credential</h3>
        <p class="text-xs text-slate-400">Official security desk pass with unique docket ID.</p>
      </div>

      <!-- Printable Area -->
      <div id="printable-badge-area" class="bg-white text-slate-900 rounded-2xl p-5 shadow-inner border border-slate-200">
        <!-- Badge Header -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded bg-blue-600 text-white font-bold text-xs flex items-center justify-center">L</div>
            <span class="text-xs font-black uppercase tracking-wider text-blue-900">Lish AI Labs</span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
            SECURITY DESK VERIFIED
          </span>
        </div>

        <!-- Badge Body -->
        <div class="flex gap-4 items-center mb-4">
          <div class="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
            <img
              :src="badgeImage"
              alt="Security Badge ID"
              referrerpolicy="no-referrer"
              class="w-full h-full object-cover"
            />
          </div>
          <div>
            <div class="text-sm font-mono font-extrabold text-blue-600">{{ visit.badgeNumber }}</div>
            <div class="text-lg font-bold text-slate-950 leading-tight mt-0.5">{{ visit.name }}</div>
            <div class="text-xs font-semibold text-slate-700 mt-0.5">{{ visit.department || 'Technical Department' }}</div>
          </div>
        </div>

        <!-- Meta Details -->
        <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4">
          <div>
            <div class="text-slate-400">Registered Docket:</div>
            <div class="font-bold text-slate-800">{{ visit.department || 'Technical' }}</div>
          </div>
          <div>
            <div class="text-slate-400">Location:</div>
            <div class="font-semibold text-slate-800">{{ visit.location }}</div>
          </div>
          <div>
            <div class="text-slate-400">Check-In Time:</div>
            <div class="font-mono tabular-nums text-slate-700">
              {{ new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
          <div>
            <div class="text-slate-400">Security Clearance:</div>
            <div class="font-mono text-emerald-600 font-bold">LEVEL 2 LABS</div>
          </div>
        </div>

        <!-- Security Footer with Barcode -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
          <div>
            <div>Must be worn visibly within 300m perimeter.</div>
            <div class="text-[9px] text-slate-400">Scan at Security Desk upon exit.</div>
          </div>
          <div class="w-14 h-12 bg-slate-950 text-white rounded p-1 flex flex-col justify-between items-center text-[7px] font-mono">
            <div class="tracking-tighter font-bold">SCAN ID</div>
            <div class="text-[8px] font-mono text-blue-300">{{ visit.badgeNumber }}</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 mt-5">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer transition-colors"
        >
          Dismiss
        </button>
        <button
          @click="printBadge"
          class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/30"
        >
          <span>🖨️</span>
          <span>Print Physical Pass</span>
        </button>
      </div>
    </div>
  </div>
</template>
