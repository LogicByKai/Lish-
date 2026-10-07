<script setup lang="ts">
import { ref } from 'vue';
import { useCheckpoint, type VisitRecord } from '../composables/useCheckpoint.ts';
import { useGeolocation } from '../composables/useGeolocation.ts';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', visit: VisitRecord): void;
}>();

const { employees, equipment, checkIn } = useCheckpoint();
const { distanceMeters, isInRange, maxAllowedMeters } = useGeolocation();

const name = ref('');
const email = ref('');
const phone = ref('');
const docket = ref<'Technical Department' | 'Annotation Department' | 'HR Department' | 'Interns / Attachees' | 'Visitor / External Guest'>('Technical Department');
const hostEmployee = ref('');
const purpose = ref('Daily Shift & Research at Lish AI Labs');
const location = ref('Lish AI Labs Main Floor');
const selectedEquipment = ref<string[]>([]);
const notes = ref('');
const ndaAgreed = ref(true);
const isSubmitting = ref(false);
const errorMsg = ref<string | null>(null);

async function handleSubmit() {
  errorMsg.value = null;
  if (!name.value.trim()) {
    errorMsg.value = 'Full name is required.';
    return;
  }
  if (!isInRange.value) {
    errorMsg.value = `Geofence restriction: You are ${distanceMeters.value}m away from the security desk. Maximum allowed distance is ${maxAllowedMeters}m.`;
    return;
  }

  isSubmitting.value = true;
  const visit = await checkIn({
    type: docket.value.includes('Visitor') ? 'visitor' : 'employee',
    name: name.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    company: 'Lish AI Labs',
    hostEmployee: hostEmployee.value || 'Self',
    department: docket.value,
    purpose: purpose.value,
    location: location.value,
    assignedEquipment: selectedEquipment.value,
    notes: notes.value,
    ndaAgreed: ndaAgreed.value,
    distanceMeters: distanceMeters.value || undefined,
  } as any);

  isSubmitting.value = false;
  if (visit) {
    emit('success', visit);
    emit('close');
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-100 my-8 overflow-hidden">
      <!-- Colorful brand bar -->
      <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-400 to-rose-500"></div>

      <button 
        @click="emit('close')"
        class="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        aria-label="Close"
      >
        ✕
      </button>

      <div class="mb-5">
        <h2 class="text-xl font-black text-white tracking-tight">Lish AI Labs Security Desk Check-In</h2>
        <p class="text-xs text-slate-400 mt-0.5">Register attendee and assign unique docket ID.</p>
      </div>

      <!-- Geofence status -->
      <div
        class="mb-4 p-3 rounded-xl border text-xs flex items-center justify-between"
        :class="isInRange ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/60 border-rose-500/60 text-rose-200'"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="isInRange ? 'bg-emerald-400' : 'bg-rose-500'"></span>
          <span>{{ isInRange ? 'Within 300m Security Perimeter' : 'Outside 300m Security Perimeter (Locked)' }}</span>
        </div>
        <span class="font-mono font-bold tabular-nums">{{ distanceMeters }}m away</span>
      </div>

      <div v-if="errorMsg" class="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- DOCKET REGISTRATION (Key Requirement) -->
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1.5">Select Docket / Department *</label>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <label
              :class="[
                'p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all',
                docket === 'Technical Department' ? 'bg-blue-950/60 border-blue-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300'
              ]"
            >
              <input type="radio" value="Technical Department" v-model="docket" class="hidden" />
              <span class="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
              <span>Technical Dept</span>
            </label>

            <label
              :class="[
                'p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all',
                docket === 'Annotation Department' ? 'bg-emerald-950/60 border-emerald-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300'
              ]"
            >
              <input type="radio" value="Annotation Department" v-model="docket" class="hidden" />
              <span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>Annotation Dept</span>
            </label>

            <label
              :class="[
                'p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all',
                docket === 'HR Department' ? 'bg-amber-950/60 border-amber-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300'
              ]"
            >
              <input type="radio" value="HR Department" v-model="docket" class="hidden" />
              <span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span>HR Department</span>
            </label>

            <label
              :class="[
                'p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all',
                docket === 'Interns / Attachees' ? 'bg-rose-950/60 border-rose-500 text-white font-semibold' : 'bg-slate-950 border-slate-800 text-slate-300'
              ]"
            >
              <input type="radio" value="Interns / Attachees" v-model="docket" class="hidden" />
              <span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>Interns / Attachees</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="e.g. Christine Wangari"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              v-model="email"
              type="email"
              placeholder="c.wangari@lishailabs.ai"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Supervisor / Contact</label>
            <select
              v-model="hostEmployee"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Supervisor...</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                {{ emp.name }} ({{ emp.department }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Purpose of Visit</label>
            <input
              v-model="purpose"
              type="text"
              placeholder="Shift / Research / Meeting"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Optional Lab Asset Loan -->
        <div v-if="equipment.some(e => e.status === 'available')">
          <label class="block text-xs font-medium text-slate-300 mb-1">Assign Lab Asset / Tablet (Optional)</label>
          <div class="space-y-1 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-800">
            <label
              v-for="item in equipment.filter(e => e.status === 'available')"
              :key="item.id"
              class="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                :value="item.id"
                v-model="selectedEquipment"
                class="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
              />
              <span class="font-mono text-blue-400">{{ item.assetTag }}</span>
              <span>- {{ item.name }}</span>
            </label>
          </div>
        </div>

        <!-- NDA -->
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-2.5">
          <input
            v-model="ndaAgreed"
            type="checkbox"
            id="modalNdaLish"
            class="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <label for="modalNdaLish" class="text-[11px] text-slate-400 cursor-pointer leading-tight">
            I agree to Lish AI Labs laboratory safety protocols and intellectual property confidentiality.
          </label>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting || !isInRange"
            class="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
          >
            {{ isSubmitting ? 'Registering...' : 'Complete & Issue Unique ID' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
