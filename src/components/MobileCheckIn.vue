<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useCheckpoint } from '../composables/useCheckpoint.ts';
import { useGeolocation } from '../composables/useGeolocation.ts';

const emit = defineEmits<{
  (e: 'back-to-desk'): void;
}>();

const { checkIn, checkOut, lookupQuery, notify } = useCheckpoint();
const { distanceMeters, isInRange, maxAllowedMeters, geoStatus, isSimulated, setSimulatedDistance, requestLocation } = useGeolocation();

// Modes: 'returning' (has Unique ID) | 'register' (first time sign up) | 'success'
const mode = ref<'returning' | 'register' | 'success'>('returning');

// Saved Unique ID from local device storage
const savedUniqueId = ref<string>(localStorage.getItem('lish_saved_unique_id') || '');
const inputUniqueId = ref<string>(savedUniqueId.value);
const isSubmitting = ref(false);
const resultData = ref<any | null>(null);

// Registration Form State
const regName = ref('');
const regEmail = ref('');
const regPhone = ref('');
const regDocket = ref<'Technical Department' | 'Annotation Department' | 'HR Department' | 'Interns / Attachees' | 'Visitor / External Guest'>('Technical Department');
const regPurpose = ref('Daily Work & Research Shift');
const regSupervisor = ref('');
const regNda = ref(true);

onMounted(() => {
  requestLocation();
  if (!savedUniqueId.value) {
    mode.value = 'register';
  }
});

// Returning Member Check-In / Check-Out
async function handleQuickCheckIn() {
  if (!inputUniqueId.value.trim()) {
    notify('Please enter your Unique ID number.', 'error');
    return;
  }
  if (!isInRange.value) {
    notify(`Geofence restriction: You are ${distanceMeters.value}m away. Must be within ${maxAllowedMeters}m to check in.`, 'error');
    return;
  }

  isSubmitting.value = true;
  const lookup = await lookupQuery(inputUniqueId.value.trim());

  if (lookup && lookup.found) {
    const person = lookup.visit || lookup.employee;
    if (lookup.active) {
      // Already checked in -> Offer check-out
      const ok = await checkOut({ badgeNumber: person.badgeNumber, id: person.id });
      if (ok) {
        resultData.value = {
          action: 'checkout',
          name: person.name,
          uniqueId: person.badgeNumber,
          docket: person.department || 'Lish AI Labs',
          message: `Goodbye, ${person.name}! Successfully checked out from Lish AI Labs.`,
        };
        mode.value = 'success';
      }
    } else {
      // Check in
      const visit = await checkIn({
        type: person.type || 'employee',
        name: person.name,
        email: person.email,
        department: person.department,
        purpose: 'Daily Shift & Research at Lish AI Labs',
        location: 'Lish AI Labs - Main Floor',
        badgeNumber: person.badgeNumber,
        distanceMeters: distanceMeters.value || undefined,
      } as any);

      if (visit) {
        localStorage.setItem('lish_saved_unique_id', visit.badgeNumber);
        resultData.value = {
          action: 'checkin',
          name: visit.name,
          uniqueId: visit.badgeNumber,
          docket: visit.department,
          message: `Welcome to Lish AI Labs, ${visit.name}! You are now checked in.`,
        };
        mode.value = 'success';
      }
    }
  } else {
    notify('Unique ID not recognized. If this is your first time, please sign up below.', 'error');
  }
  isSubmitting.value = false;
}

// First-Time Sign-Up & Docket Registration
async function handleFirstTimeRegistration() {
  if (!regName.value.trim()) {
    notify('Please provide your full legal name.', 'error');
    return;
  }
  if (!isInRange.value) {
    notify(`Geofence restriction: You are ${distanceMeters.value}m away. Must be within ${maxAllowedMeters}m to check in.`, 'error');
    return;
  }

  isSubmitting.value = true;
  const visit = await checkIn({
    type: regDocket.value.includes('Visitor') ? 'visitor' : 'employee',
    name: regName.value.trim(),
    email: regEmail.value.trim(),
    phone: regPhone.value.trim(),
    department: regDocket.value,
    hostEmployee: regSupervisor.value || 'Self',
    purpose: regPurpose.value,
    location: 'Lish AI Labs Security Desk',
    ndaAgreed: regNda.value,
    distanceMeters: distanceMeters.value || undefined,
  } as any);

  isSubmitting.value = false;

  if (visit) {
    localStorage.setItem('lish_saved_unique_id', visit.badgeNumber);
    savedUniqueId.value = visit.badgeNumber;
    inputUniqueId.value = visit.badgeNumber;
    resultData.value = {
      action: 'registered',
      name: visit.name,
      uniqueId: visit.badgeNumber,
      docket: visit.department,
      message: `Registration complete! Your permanent Unique ID is ${visit.badgeNumber}.`,
    };
    mode.value = 'success';
  }
}

function handleDone() {
  mode.value = 'returning';
  resultData.value = null;
}
</script>

<template>
  <div class="max-w-xl mx-auto py-4 px-4 sm:px-6 space-y-6">
    <!-- Back to Desk Display -->
    <div class="flex items-center justify-between">
      <button
        @click="emit('back-to-desk')"
        class="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>←</span>
        <span>Back to Security Desk Display</span>
      </button>

      <span class="text-xs font-mono text-blue-400 font-semibold tracking-wider">
        MOBILE CHECK-IN PORTAL
      </span>
    </div>

    <!-- Header Card with Lish AI Labs Brand Colors -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
      <!-- Top Colorful Accent line: Blue, Green, Yellow, Red -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-rose-500"></div>

      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-600/30">
          L
        </div>
        <div>
          <h1 class="text-2xl font-black text-white tracking-tight">Lish AI Labs</h1>
          <p class="text-xs text-slate-400">Security Desk Digital Check-In</p>
        </div>
      </div>

      <!-- Live Geolocation Distance Meter (< 300m Rule) -->
      <div class="mt-4 p-3.5 rounded-2xl border transition-all"
        :class="[
          isInRange
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
        ]"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full"
              :class="isInRange ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'"
            ></span>
            <span class="text-xs font-bold uppercase tracking-wider">
              {{ isInRange ? '✓ Geofence Verified' : '⚠️ Geofence Lock (>300m)' }}
            </span>
          </div>

          <div class="text-xs font-mono font-bold tabular-nums">
            {{ distanceMeters !== null ? `${distanceMeters}m from Desk` : 'Measuring...' }}
          </div>
        </div>

        <p class="text-[11px] mt-1.5 leading-relaxed" :class="isInRange ? 'text-emerald-300/80' : 'text-rose-300'">
          <template v-if="isInRange">
            You are within the 300m perimeter of Lish AI Labs Security Desk. Check-in is authorized.
          </template>
          <template v-else>
            You are <strong>{{ distanceMeters }}m away</strong> from the security desk. Check-in is locked until you are within 300m.
          </template>
        </p>

        <!-- Demo location simulator toggle -->
        <div class="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          <span class="text-slate-400">Test Geofence Range:</span>
          <div class="flex items-center gap-1.5">
            <button
              @click="setSimulatedDistance(18)"
              :class="['px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors', distanceMeters === 18 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white']"
            >
              Inside Desk (18m)
            </button>
            <button
              @click="setSimulatedDistance(450)"
              :class="['px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors', distanceMeters === 450 ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white']"
            >
              Away (450m)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode: SUCCESS STATE (ID Card issued or checked-in) -->
    <div v-if="mode === 'success' && resultData" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
      <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl font-bold"
        :class="resultData.action === 'checkout' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'"
      >
        {{ resultData.action === 'checkout' ? '👋' : '✓' }}
      </div>

      <div>
        <h2 class="text-2xl font-bold text-white tracking-tight">{{ resultData.name }}</h2>
        <p class="text-sm text-slate-300 mt-1">{{ resultData.message }}</p>
      </div>

      <!-- Digital Pass Card -->
      <div class="bg-white text-slate-900 rounded-2xl p-5 shadow-lg border border-slate-200 text-left">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">L</div>
            <span class="text-xs font-bold tracking-wider uppercase text-blue-900">Lish AI Labs</span>
          </div>
          <span class="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-800 rounded border border-blue-200">
            DIGITAL CREDENTIAL
          </span>
        </div>

        <div class="py-4">
          <div class="text-xs text-slate-500">Unique ID Number:</div>
          <div class="text-2xl font-mono font-extrabold text-blue-700 tracking-tight">{{ resultData.uniqueId }}</div>

          <div class="mt-3 flex items-center justify-between text-xs">
            <div>
              <span class="text-slate-500">Registered Docket:</span>
              <div class="font-bold text-slate-900">{{ resultData.docket }}</div>
            </div>
            <div class="text-right">
              <span class="text-slate-500">Timestamp:</span>
              <div class="font-mono text-slate-700">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
            </div>
          </div>
        </div>

        <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span>Saved to your device for instant future check-ins.</span>
          <span class="font-mono font-bold text-blue-600">LISH AI LABS</span>
        </div>
      </div>

      <button
        @click="handleDone"
        class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
      >
        Done
      </button>
    </div>

    <!-- Mode: RETURNING MEMBER (Has Unique ID) -->
    <div v-else-if="mode === 'returning'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 class="text-lg font-bold text-white">Returning Member Check-In</h2>
          <p class="text-xs text-slate-400">Scan at desk and enter your Unique ID to check in or out.</p>
        </div>
        <button
          @click="mode = 'register'"
          class="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
        >
          First time? Sign Up &rarr;
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">Enter Your Unique ID Number</label>
          <input
            v-model="inputUniqueId"
            type="text"
            placeholder="e.g. LISH-TECH-101, LISH-ANNT-201..."
            class="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-base text-white focus:outline-none focus:border-blue-500 font-mono tracking-wide uppercase placeholder:text-slate-600"
          />
        </div>

        <!-- Quick suggestion if saved in storage or demo IDs -->
        <div class="space-y-1.5">
          <div class="text-[11px] text-slate-400 font-medium">Quick tap preset IDs:</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <button
              @click="inputUniqueId = 'LISH-TECH-101'"
              class="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
            >
              <div class="font-mono font-bold text-blue-400 text-[11px]">LISH-TECH-101</div>
              <div class="text-[10px] text-slate-400 truncate">Technical · Kaelen</div>
            </button>
            <button
              @click="inputUniqueId = 'LISH-ANNT-201'"
              class="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
            >
              <div class="font-mono font-bold text-emerald-400 text-[11px]">LISH-ANNT-201</div>
              <div class="text-[10px] text-slate-400 truncate">Annotation · Amina</div>
            </button>
            <button
              @click="inputUniqueId = 'LISH-HR-301'"
              class="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
            >
              <div class="font-mono font-bold text-amber-400 text-[11px]">LISH-HR-301</div>
              <div class="text-[10px] text-slate-400 truncate">HR · Faith</div>
            </button>
            <button
              @click="inputUniqueId = 'LISH-INT-401'"
              class="p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left cursor-pointer transition-colors"
            >
              <div class="font-mono font-bold text-rose-400 text-[11px]">LISH-INT-401</div>
              <div class="text-[10px] text-slate-400 truncate">Interns · Grace</div>
            </button>
          </div>
        </div>

        <button
          @click="handleQuickCheckIn"
          :disabled="isSubmitting || !isInRange"
          class="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-2"
        >
          <span v-if="!isInRange">⚠️ Check-In Locked (Outside 300m)</span>
          <span v-else-if="isSubmitting">Processing Verification...</span>
          <span v-else>Check In / Check Out via Unique ID</span>
        </button>
      </div>

      <div class="pt-2 text-center">
        <button
          @click="mode = 'register'"
          class="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Don't have an ID yet? Register for the first time
        </button>
      </div>
    </div>

    <!-- Mode: FIRST-TIME SIGN-UP & DOCKET REGISTRATION -->
    <div v-else-if="mode === 'register'" class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 class="text-lg font-bold text-white">First-Time Member & Visitor Registration</h2>
          <p class="text-xs text-slate-400">Sign up and register your docket to receive your Unique ID.</p>
        </div>
        <button
          @click="mode = 'returning'"
          class="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
        >
          Already have an ID?
        </button>
      </div>

      <form @submit.prevent="handleFirstTimeRegistration" class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Full Legal Name *</label>
          <input
            v-model="regName"
            type="text"
            required
            placeholder="e.g. Christine Wangari"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              v-model="regEmail"
              type="email"
              placeholder="c.wangari@lishailabs.ai"
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
            <input
              v-model="regPhone"
              type="tel"
              placeholder="+254 700 000000"
              class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- DOCKET REGISTRATION (CRITICAL USER REQUIREMENT) -->
        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1.5">
            Select Your Docket / Department *
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <!-- 1. Technical Department -->
            <label
              :class="[
                'p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-xs',
                regDocket === 'Technical Department' ? 'bg-blue-950/60 border-blue-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              ]"
            >
              <input type="radio" value="Technical Department" v-model="regDocket" class="hidden" />
              <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
              <div>
                <div>Technical Department</div>
                <div class="text-[10px] text-slate-400 font-normal">AI/ML, Eng, R&D · LISH-TECH</div>
              </div>
            </label>

            <!-- 2. Annotation Department -->
            <label
              :class="[
                'p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-xs',
                regDocket === 'Annotation Department' ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              ]"
            >
              <input type="radio" value="Annotation Department" v-model="regDocket" class="hidden" />
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
              <div>
                <div>Annotation Department</div>
                <div class="text-[10px] text-slate-400 font-normal">Data Labelling & QA · LISH-ANNT</div>
              </div>
            </label>

            <!-- 3. HR Department -->
            <label
              :class="[
                'p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-xs',
                regDocket === 'HR Department' ? 'bg-amber-950/60 border-amber-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              ]"
            >
              <input type="radio" value="HR Department" v-model="regDocket" class="hidden" />
              <span class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
              <div>
                <div>HR Department</div>
                <div class="text-[10px] text-slate-400 font-normal">People, Ops & Admin · LISH-HR</div>
              </div>
            </label>

            <!-- 4. Interns / Attachees -->
            <label
              :class="[
                'p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-xs',
                regDocket === 'Interns / Attachees' ? 'bg-rose-950/60 border-rose-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              ]"
            >
              <input type="radio" value="Interns / Attachees" v-model="regDocket" class="hidden" />
              <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <div>
                <div>Interns / Attachees</div>
                <div class="text-[10px] text-slate-400 font-normal">Research Fellows · LISH-INT</div>
              </div>
            </label>
          </div>

          <!-- Secondary: Visitor / External Guest -->
          <div class="mt-2">
            <label
              :class="[
                'p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all text-xs',
                regDocket === 'Visitor / External Guest' ? 'bg-slate-800 border-slate-600 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              ]"
            >
              <input type="radio" value="Visitor / External Guest" v-model="regDocket" class="hidden" />
              <span class="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
              <div>Visitor / External Guest (Client, Candidate, Vendor · LISH-VIS)</div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-300 mb-1">Supervisor / Host (Optional)</label>
          <input
            v-model="regSupervisor"
            type="text"
            placeholder="e.g. Kaelen Omondi (Lead ML)"
            class="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5">
          <input
            v-model="regNda"
            type="checkbox"
            id="mobileNda"
            class="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <label for="mobileNda" class="text-[11px] text-slate-400 cursor-pointer leading-relaxed">
            I agree to Lish AI Labs security desk safety rules and confidentiality of lab compute facilities.
          </label>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || !isInRange || !regNda"
          class="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          <span v-if="!isInRange">⚠️ Check-In Locked (Outside 300m)</span>
          <span v-else-if="isSubmitting">Creating Unique ID & Checking In...</span>
          <span v-else>Register Docket & Issue Unique ID</span>
        </button>
      </form>
    </div>
  </div>
</template>
