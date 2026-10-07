<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useCheckpoint } from '../composables/useCheckpoint.ts';
import receptionImage from '../assets/images/office_reception_atrium_1791376113723.jpg';

const emit = defineEmits<{
  (e: 'show-badge', visit: any): void;
}>();

const { stats, employees, checkIn, checkOut, lookupQuery, refreshAll } = useCheckpoint();

const kioskStep = ref<'home' | 'visitor' | 'employee' | 'checkout' | 'success'>('home');
const successMessage = ref('');
const currentTime = ref('');

// Clock interval
let timer: any = null;
function updateClock() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

onMounted(() => {
  updateClock();
  timer = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// Visitor Form State
const visitorName = ref('');
const visitorEmail = ref('');
const visitorCompany = ref('');
const visitorHost = ref('');
const visitorPurpose = ref('Business Meeting');
const visitorNda = ref(true);
const isSubmitting = ref(false);

// Employee Check-in/out State
const employeeSearch = ref('');
const employeeMatch = ref<any | null>(null);

// Fast Checkout State
const checkoutQuery = ref('');
const checkoutResult = ref<any | null>(null);

async function submitVisitorCheckin() {
  if (!visitorName.value.trim()) return;
  isSubmitting.value = true;
  const visit = await checkIn({
    type: 'visitor',
    name: visitorName.value,
    email: visitorEmail.value,
    company: visitorCompany.value,
    hostEmployee: visitorHost.value || 'Front Reception',
    purpose: visitorPurpose.value,
    ndaAgreed: visitorNda.value,
    location: 'Building A Lobby',
  });
  isSubmitting.value = false;
  if (visit) {
    successMessage.value = `Welcome ${visit.name}! Your badge is ${visit.badgeNumber}. Host ${visit.hostEmployee} has been notified.`;
    kioskStep.value = 'success';
    emit('show-badge', visit);
    resetForms();
  }
}

async function handleEmployeeLookup() {
  if (!employeeSearch.value.trim()) return;
  const res = await lookupQuery(employeeSearch.value);
  if (res && (res.visit || res.employee)) {
    employeeMatch.value = res.visit || res.employee;
  } else {
    employeeMatch.value = null;
  }
}

async function toggleEmployeePresence(emp: any) {
  isSubmitting.value = true;
  if (emp.status === 'active' || emp.currentlyOnSite) {
    // Check out
    const ok = await checkOut({ badgeNumber: emp.badgeNumber, id: emp.id });
    if (ok) {
      successMessage.value = `Goodbye, ${emp.name}! You are now checked out. Have a great day.`;
      kioskStep.value = 'success';
    }
  } else {
    // Check in
    const visit = await checkIn({
      type: 'employee',
      name: emp.name,
      email: emp.email,
      department: emp.department,
      purpose: 'Regular Shift / On-site Presence',
      location: 'Main Workspace',
    });
    if (visit) {
      successMessage.value = `Welcome back, ${emp.name}! Checked in at ${currentTime.value}.`;
      kioskStep.value = 'success';
    }
  }
  isSubmitting.value = false;
  employeeMatch.value = null;
  employeeSearch.value = '';
}

async function handleFastCheckoutLookup() {
  if (!checkoutQuery.value.trim()) return;
  const res = await lookupQuery(checkoutQuery.value);
  if (res && res.active && res.visit) {
    checkoutResult.value = res.visit;
  } else {
    checkoutResult.value = false;
  }
}

async function confirmFastCheckout() {
  if (!checkoutResult.value) return;
  isSubmitting.value = true;
  const ok = await checkOut({ id: checkoutResult.value.id, badgeNumber: checkoutResult.value.badgeNumber });
  isSubmitting.value = false;
  if (ok) {
    successMessage.value = `Checked out: ${checkoutResult.value.name} (${checkoutResult.value.badgeNumber}). Have a safe journey!`;
    kioskStep.value = 'success';
    checkoutResult.value = null;
    checkoutQuery.value = '';
  }
}

function resetForms() {
  visitorName.value = '';
  visitorEmail.value = '';
  visitorCompany.value = '';
  visitorHost.value = '';
  visitorPurpose.value = 'Business Meeting';
  visitorNda.value = true;
  employeeSearch.value = '';
  employeeMatch.value = null;
  checkoutQuery.value = '';
  checkoutResult.value = null;
}

function returnHome() {
  kioskStep.value = 'home';
  resetForms();
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-6 px-4">
    <!-- Header banner -->
    <div class="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl mb-8">
      <div class="h-48 sm:h-56 relative w-full overflow-hidden">
        <img
          :src="receptionImage"
          alt="Vanguard Headquarters Reception Lobby"
          referrerpolicy="no-referrer"
          class="w-full h-full object-cover opacity-60"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        <div class="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-1">Self-Service Lobby Terminal</div>
            <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Welcome to Vanguard Headquarters</h1>
            <p class="text-sm text-slate-300 mt-1">Please select an action below to log your arrival or departure.</p>
          </div>
          <div class="text-right bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800">
            <div class="text-xl font-mono tabular-nums font-bold text-white">{{ currentTime }}</div>
            <div class="text-xs text-slate-400">{{ stats.currentlyOnSite }} people currently on site</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step: HOME (Choice buttons) -->
    <div v-if="kioskStep === 'home'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Card 1: Visitor -->
      <button
        @click="kioskStep = 'visitor'"
        class="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl text-left transition-all shadow-md group cursor-pointer"
      >
        <div class="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-105 transition-transform">
          👤
        </div>
        <h3 class="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">I am a Visitor</h3>
        <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Guest, client, vendor, or interview candidate. Register your visit, accept NDA, and print a pass.
        </p>
        <div class="mt-4 text-xs font-semibold text-indigo-400 flex items-center gap-1">
          Begin Check-In &rarr;
        </div>
      </button>

      <!-- Card 2: Employee -->
      <button
        @click="kioskStep = 'employee'"
        class="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl text-left transition-all shadow-md group cursor-pointer"
      >
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-105 transition-transform">
          🏢
        </div>
        <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">I am an Employee</h3>
        <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Quick daily attendance check-in or check-out for registered company staff and team members.
        </p>
        <div class="mt-4 text-xs font-semibold text-emerald-400 flex items-center gap-1">
          Employee Presence &rarr;
        </div>
      </button>

      <!-- Card 3: Fast Check-Out -->
      <button
        @click="kioskStep = 'checkout'"
        class="bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all shadow-md group cursor-pointer"
      >
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-105 transition-transform">
          🚪
        </div>
        <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Fast Check-Out</h3>
        <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Departing the facility? Enter your badge number (e.g. VIS-101) or name for instant sign-out.
        </p>
        <div class="mt-4 text-xs font-semibold text-amber-400 flex items-center gap-1">
          Sign Out Now &rarr;
        </div>
      </button>
    </div>

    <!-- Step: VISITOR FORM -->
    <div v-else-if="kioskStep === 'visitor'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Visitor Registration</h2>
          <p class="text-xs text-slate-400">Please provide your details for facility security compliance.</p>
        </div>
        <button @click="returnHome" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
          ← Back to Menu
        </button>
      </div>

      <form @submit.prevent="submitVisitorCheckin" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Your Full Name *</label>
            <input
              v-model="visitorName"
              type="text"
              required
              placeholder="e.g. Samuel Thorne"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              v-model="visitorEmail"
              type="email"
              placeholder="samuel@company.com"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Your Company / Organization</label>
            <input
              v-model="visitorCompany"
              type="text"
              placeholder="e.g. Acorn Ventures"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Who Are You Visiting (Host)? *</label>
            <select
              v-model="visitorHost"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Employee Host...</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                {{ emp.name }} ({{ emp.department }})
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Purpose of Visit</label>
          <input
            v-model="visitorPurpose"
            type="text"
            placeholder="e.g. Project Technical Review"
            class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <!-- NDA Agreement -->
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start gap-3">
          <input
            v-model="visitorNda"
            type="checkbox"
            id="ndaCheck"
            class="mt-1 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <label for="ndaCheck" class="text-xs text-slate-400 cursor-pointer leading-relaxed">
            I agree to Vanguard HQ visitor safety protocols and acknowledge that proprietary intellectual property and laboratory equipment observed on premises remain strictly confidential.
          </label>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || !visitorNda"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors cursor-pointer text-sm"
        >
          {{ isSubmitting ? 'Processing Check-In...' : 'Confirm Check-In & Issue Badge' }}
        </button>
      </form>
    </div>

    <!-- Step: EMPLOYEE PRESENCE -->
    <div v-else-if="kioskStep === 'employee'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Employee Presence Terminal</h2>
          <p class="text-xs text-slate-400">Search by your name or Employee Badge ID to toggle your status.</p>
        </div>
        <button @click="returnHome" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
          ← Back to Menu
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Search Employee (Name or Badge ID)</label>
          <div class="flex gap-2">
            <input
              v-model="employeeSearch"
              @keyup.enter="handleEmployeeLookup"
              type="text"
              placeholder="e.g. Dr. Elena Rostova or EMP-014"
              class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              @click="handleEmployeeLookup"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
            >
              Lookup
            </button>
          </div>
        </div>

        <!-- Match preview card -->
        <div v-if="employeeMatch" class="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base font-bold text-white">{{ employeeMatch.name }}</div>
              <div class="text-xs text-slate-400">
                {{ employeeMatch.department || employeeMatch.role }} · Badge: <span class="font-mono text-indigo-400">{{ employeeMatch.badgeNumber }}</span>
              </div>
            </div>
            <span
              :class="[
                'text-xs px-2.5 py-1 rounded font-medium',
                (employeeMatch.status === 'active' || employeeMatch.currentlyOnSite) ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              ]"
            >
              {{ (employeeMatch.status === 'active' || employeeMatch.currentlyOnSite) ? 'Currently On Site' : 'Currently Off Site' }}
            </span>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              @click="toggleEmployeePresence(employeeMatch)"
              :disabled="isSubmitting"
              :class="[
                'px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors cursor-pointer',
                (employeeMatch.status === 'active' || employeeMatch.currentlyOnSite) ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
              ]"
            >
              {{ (employeeMatch.status === 'active' || employeeMatch.currentlyOnSite) ? 'Check Out for Today' : 'Check In to Vanguard HQ' }}
            </button>
          </div>
        </div>

        <!-- Quick staff selection list -->
        <div class="pt-4 border-t border-slate-800">
          <div class="text-xs font-medium text-slate-400 mb-2">Or select from active directory:</div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              v-for="emp in employees.slice(0, 6)"
              :key="emp.id"
              @click="toggleEmployeePresence(emp)"
              class="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
            >
              <div>
                <div class="font-semibold text-white">{{ emp.name }}</div>
                <div class="text-[11px] text-slate-400">{{ emp.department }} · {{ emp.badgeNumber }}</div>
              </div>
              <span
                :class="[
                  'text-[10px] px-1.5 py-0.5 rounded font-mono',
                  emp.currentlyOnSite ? 'text-emerald-400 bg-emerald-950' : 'text-slate-500 bg-slate-900'
                ]"
              >
                {{ emp.currentlyOnSite ? 'Checked In' : 'Off-site' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step: FAST CHECKOUT -->
    <div v-else-if="kioskStep === 'checkout'" class="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto">
      <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div>
          <h2 class="text-xl font-bold text-white">Fast Check-Out</h2>
          <p class="text-xs text-slate-400">Scan or enter your badge code to record your departure.</p>
        </div>
        <button @click="returnHome" class="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
          ← Back to Menu
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Badge Code or Visitor Name</label>
          <div class="flex gap-2">
            <input
              v-model="checkoutQuery"
              @keyup.enter="handleFastCheckoutLookup"
              type="text"
              placeholder="e.g. VIS-101, EMP-014, or David Lindholm"
              class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              @click="handleFastCheckoutLookup"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
            >
              Find
            </button>
          </div>
        </div>

        <div v-if="checkoutResult" class="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base font-bold text-white">{{ checkoutResult.name }}</div>
              <div class="text-xs text-slate-400">
                Badge: <span class="font-mono text-indigo-400">{{ checkoutResult.badgeNumber }}</span> · Host: {{ checkoutResult.hostEmployee || 'N/A' }}
              </div>
            </div>
            <span class="text-xs text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded font-mono">
              ACTIVE VISIT
            </span>
          </div>

          <div class="text-xs text-slate-400">
            Checked in at: <span class="font-mono text-slate-300">{{ new Date(checkoutResult.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
          </div>

          <button
            @click="confirmFastCheckout"
            :disabled="isSubmitting"
            class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {{ isSubmitting ? 'Confirming...' : 'Confirm Departure & Check Out' }}
          </button>
        </div>

        <div v-else-if="checkoutResult === false" class="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 text-center">
          No active check-in record found with that badge or name. Please verify code or contact reception desk.
        </div>
      </div>
    </div>

    <!-- Step: SUCCESS CONFIRMATION -->
    <div v-else-if="kioskStep === 'success'" class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto shadow-xl space-y-4">
      <div class="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
        ✓
      </div>
      <h3 class="text-xl font-bold text-white">Action Completed</h3>
      <p class="text-sm text-slate-300 leading-relaxed">{{ successMessage }}</p>
      <div class="pt-4">
        <button
          @click="returnHome"
          class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Return to Terminal Home
        </button>
      </div>
    </div>
  </div>
</template>
