<script setup lang="ts">
import { ref, computed } from 'vue';
import QRCodeDisplay from './QRCodeDisplay.vue';

const emit = defineEmits<{
  (e: 'open-mobile-portal'): void;
}>();

// Compute the current URL with check-in parameter
const checkInUrl = computed(() => {
  return `${window.location.origin}/#mobile-checkin`;
});

const isCopied = ref(false);

function copyUrl() {
  navigator.clipboard.writeText(checkInUrl.value);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2500);
}

function printPlacard() {
  window.print();
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 px-4">
    <!-- Desk Placard Card -->
    <div id="printable-badge-area" class="bg-slate-900 border-2 border-blue-600/60 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
      <!-- Decorative Lish AI Labs color bar (Blue, Green, Yellow, Red) -->
      <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-rose-500"></div>

      <div class="flex flex-col lg:flex-row items-center justify-between gap-8">
        <!-- Left: Brand and Instructions -->
        <div class="flex-1 text-center lg:text-left space-y-4">
          <div class="flex items-center justify-center lg:justify-start gap-2">
            <span class="w-3.5 h-3.5 rounded-full bg-blue-500"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span class="text-xs font-bold uppercase tracking-widest text-blue-400 ml-1">Official Security Desk</span>
          </div>

          <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Lish AI Labs
          </h1>
          <p class="text-base text-slate-300 font-medium">
            Scan to Check In & Check Out at Security Desk
          </p>

          <!-- Step Guide -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3 mt-4 text-xs">
            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
              <div>
                <strong class="text-white">Scan this QR Code</strong>
                <p class="text-slate-400">Use your smartphone camera to open the Lish AI Labs check-in portal.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
              <div>
                <strong class="text-white">First-Time Visitors & Staff: Register Your Docket</strong>
                <p class="text-slate-400">Select your docket (Technical, Annotation, HR, or Interns / Attachees) to receive your permanent Unique ID.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
              <div>
                <strong class="text-white">Returning Members: 1-Tap Check-In</strong>
                <p class="text-slate-400">Every time you reach the security desk, simply scan and enter your Unique ID to check in or out.</p>
              </div>
            </div>

            <div class="flex items-start gap-3 pt-1 border-t border-slate-800/80">
              <span class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">📍</span>
              <div>
                <strong class="text-white">300m Security Geofence Rule</strong>
                <p class="text-slate-400">Check-in is automatically locked if you are more than 300 meters away from the security desk.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Scannable QR Code and Quick Actions -->
        <div class="flex flex-col items-center shrink-0 space-y-4">
          <QRCodeDisplay
            :value="checkInUrl"
            :size="220"
            title="Lish AI Labs Security Desk Check-In"
          />

          <div class="text-center">
            <span class="text-xs font-mono text-slate-400">SCAN WITH MOBILE DEVICE</span>
          </div>

          <div class="flex flex-col sm:flex-row gap-2 w-full">
            <button
              @click="emit('open-mobile-portal')"
              class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <span>📱</span>
              <span>Launch Check-In Portal</span>
            </button>

            <button
              @click="copyUrl"
              class="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{{ isCopied ? '✓' : '🔗' }}</span>
              <span>{{ isCopied ? 'Copied!' : 'Copy Portal Link' }}</span>
            </button>
          </div>

          <button
            @click="printPlacard"
            class="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🖨️</span>
            <span>Print Desk Placard</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
