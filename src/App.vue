<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TopNav from './components/TopNav.vue';
import SecurityDeskQR from './components/SecurityDeskQR.vue';
import MobileCheckIn from './components/MobileCheckIn.vue';
import LiveRoster from './components/LiveRoster.vue';
import EquipmentManager from './components/EquipmentManager.vue';
import ActivityLogs from './components/ActivityLogs.vue';
import AuthModal from './components/AuthModal.vue';
import VisitorCheckInModal from './components/VisitorCheckInModal.vue';
import BadgePassModal from './components/BadgePassModal.vue';
import EvacuationModal from './components/EvacuationModal.vue';

import { useAuth } from './composables/useAuth.ts';
import { useCheckpoint, type VisitRecord } from './composables/useCheckpoint.ts';

const { fetchMe } = useAuth();
const { refreshAll, actionMessage } = useCheckpoint();

const currentTab = ref<string>('qr-stand');

// Modals
const showAuthModal = ref<boolean>(false);
const showCheckInModal = ref<boolean>(false);
const showBadgeModal = ref<boolean>(false);
const showEvacuationModal = ref<boolean>(false);
const selectedBadgeVisit = ref<VisitRecord | null>(null);

function handleShowBadge(visit: VisitRecord) {
  selectedBadgeVisit.value = visit;
  showBadgeModal.value = true;
}

function handleCheckInSuccess(visit: VisitRecord) {
  handleShowBadge(visit);
}

onMounted(async () => {
  if (window.location.hash === '#mobile-checkin') {
    currentTab.value = 'mobile-portal';
  }
  await fetchMe();
  await refreshAll();
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
    <!-- Action toast -->
    <transition
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="actionMessage"
        class="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-semibold backdrop-blur-md"
        :class="[
          actionMessage.type === 'success'
            ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-300'
            : 'bg-slate-900/90 border-rose-500/50 text-rose-300'
        ]"
      >
        <span class="text-sm">{{ actionMessage.type === 'success' ? '✓' : '⚠️' }}</span>
        <span>{{ actionMessage.text }}</span>
      </div>
    </transition>

    <!-- Top Navigation -->
    <TopNav
      :current-tab="currentTab"
      @update:current-tab="currentTab = $event"
      @open-checkin="currentTab = 'mobile-portal'"
      @open-auth="showAuthModal = true"
      @open-evacuation="showEvacuationModal = true"
    />

    <!-- Main Workspace Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Security Desk QR Display Placard -->
      <section v-if="currentTab === 'qr-stand'">
        <SecurityDeskQR
          @open-mobile-portal="currentTab = 'mobile-portal'"
        />
      </section>

      <!-- Mobile Check-In Portal (Destination of QR Code Scan) -->
      <section v-else-if="currentTab === 'mobile-portal'">
        <MobileCheckIn
          @back-to-desk="currentTab = 'qr-stand'"
        />
      </section>

      <!-- Live Roster View -->
      <section v-else-if="currentTab === 'roster'">
        <LiveRoster
          @show-badge="handleShowBadge"
          @open-checkin="showCheckInModal = true"
        />
      </section>

      <!-- Equipment & Lab Assets View -->
      <section v-else-if="currentTab === 'equipment'">
        <EquipmentManager />
      </section>

      <!-- Activity Logs View -->
      <section v-else-if="currentTab === 'logs'">
        <ActivityLogs />
      </section>
    </main>

    <!-- Modals -->
    <AuthModal
      v-if="showAuthModal"
      @close="showAuthModal = false"
    />

    <VisitorCheckInModal
      v-if="showCheckInModal"
      @close="showCheckInModal = false"
      @success="handleCheckInSuccess"
    />

    <BadgePassModal
      v-if="showBadgeModal"
      :visit="selectedBadgeVisit"
      @close="showBadgeModal = false"
    />

    <EvacuationModal
      v-if="showEvacuationModal"
      @close="showEvacuationModal = false"
    />
  </div>
</template>
