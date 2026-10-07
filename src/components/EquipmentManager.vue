<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCheckpoint, type EquipmentItem } from '../composables/useCheckpoint.ts';

const { equipment, employees, visits, checkoutEquipment, checkinEquipment } = useCheckpoint();

const filterCategory = ref<string>('all');
const activeLoanItem = ref<EquipmentItem | null>(null);
const returnModalItem = ref<EquipmentItem | null>(null);

// Checkout modal form
const loanToName = ref('');
const loanToBadge = ref('');
const expectedReturn = ref('17:00 Today');

// Return modal form
const returnConditionNotes = ref('');

const filteredEquipment = computed(() => {
  return equipment.value.filter((e) => {
    if (filterCategory.value !== 'all' && e.category !== filterCategory.value) return false;
    return true;
  });
});

function openLoanModal(item: EquipmentItem) {
  activeLoanItem.value = item;
  loanToName.value = '';
  loanToBadge.value = '';
  expectedReturn.value = '17:00 Today';
}

function openReturnModal(item: EquipmentItem) {
  returnModalItem.value = item;
  returnConditionNotes.value = item.condition || 'Good';
}

async function handleConfirmLoan() {
  if (!activeLoanItem.value || !loanToName.value.trim()) return;
  await checkoutEquipment(
    activeLoanItem.value.id,
    loanToName.value,
    loanToBadge.value || 'N/A',
    expectedReturn.value
  );
  activeLoanItem.value = null;
}

async function handleConfirmReturn() {
  if (!returnModalItem.value) return;
  await checkinEquipment(returnModalItem.value.id, returnConditionNotes.value);
  returnModalItem.value = null;
}

function handleSelectPerson(name: string, badge: string) {
  loanToName.value = name;
  loanToBadge.value = badge;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header banner -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-lg font-bold text-white tracking-tight">Company Asset & Loaner Management</h2>
        <p class="text-xs text-slate-400 mt-0.5">Track hardware, cleanroom badges, laboratory scopes, and loaner laptops.</p>
      </div>

      <!-- Categories Filter -->
      <div class="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
        <button
          @click="filterCategory = 'all'"
          :class="['px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', filterCategory === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          All
        </button>
        <button
          @click="filterCategory = 'laptop'"
          :class="['px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', filterCategory === 'laptop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          Laptops
        </button>
        <button
          @click="filterCategory = 'testing'"
          :class="['px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', filterCategory === 'testing' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          Lab Testing
        </button>
        <button
          @click="filterCategory = 'access_card'"
          :class="['px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer', filterCategory === 'access_card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white']"
        >
          Keycards
        </button>
      </div>
    </div>

    <!-- Equipment List Table -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th class="py-3 px-4">Asset Tag</th>
              <th class="py-3 px-4">Equipment Name</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Assigned To</th>
              <th class="py-3 px-4">Expected Return</th>
              <th class="py-3 px-4">Condition</th>
              <th class="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr
              v-for="item in filteredEquipment"
              :key="item.id"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <td class="py-3 px-4 font-mono font-semibold text-indigo-400 tabular-nums">
                {{ item.assetTag }}
              </td>
              <td class="py-3 px-4 font-medium text-white">
                {{ item.name }}
              </td>
              <td class="py-3 px-4 text-slate-400 capitalize">
                {{ item.category.replace('_', ' ') }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="[
                    'text-[11px] font-mono px-2 py-0.5 rounded',
                    item.status === 'available' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  ]"
                >
                  {{ item.status === 'available' ? 'Available' : 'Checked Out' }}
                </span>
              </td>
              <td class="py-3 px-4 text-slate-300">
                <div v-if="item.checkedOutTo">
                  <div class="font-medium text-white">{{ item.checkedOutTo }}</div>
                  <div class="text-[11px] font-mono text-slate-400">{{ item.checkedOutToBadge }}</div>
                </div>
                <span v-else class="text-slate-500">—</span>
              </td>
              <td class="py-3 px-4 text-slate-400 font-mono">
                {{ item.expectedReturn || '—' }}
              </td>
              <td class="py-3 px-4 text-slate-400">
                {{ item.condition }}
              </td>
              <td class="py-3 px-4 text-right">
                <button
                  v-if="item.status === 'available'"
                  @click="openLoanModal(item)"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Check Out
                </button>
                <button
                  v-else
                  @click="openReturnModal(item)"
                  class="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  Return Item
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loan Modal -->
    <div v-if="activeLoanItem" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <h3 class="text-lg font-bold text-white mb-1">Check Out Equipment</h3>
        <p class="text-xs text-slate-400 mb-4">
          Assigning <span class="text-indigo-400 font-mono font-bold">{{ activeLoanItem.assetTag }}</span>: {{ activeLoanItem.name }}
        </p>

        <form @submit.prevent="handleConfirmLoan" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Recipient Name *</label>
            <input
              v-model="loanToName"
              type="text"
              required
              placeholder="e.g. Dr. Elena Rostova"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Quick pick from active on-site attendees -->
          <div class="text-[11px] text-slate-400">
            <span>Quick pick active on-site: </span>
            <div class="flex flex-wrap gap-1.5 mt-1">
              <button
                type="button"
                v-for="v in visits.filter(v => v.status === 'active').slice(0, 4)"
                :key="v.id"
                @click="handleSelectPerson(v.name, v.badgeNumber)"
                class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
              >
                {{ v.name }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Recipient Badge ID</label>
            <input
              v-model="loanToBadge"
              type="text"
              placeholder="EMP-014 or VIS-101"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Expected Return Schedule</label>
            <input
              v-model="expectedReturn"
              type="text"
              placeholder="17:00 Today / Tomorrow 10:00"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <button
              type="button"
              @click="activeLoanItem = null"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              Confirm Loan
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Return Modal -->
    <div v-if="returnModalItem" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <h3 class="text-lg font-bold text-white mb-1">Return Asset to Pool</h3>
        <p class="text-xs text-slate-400 mb-4">
          Receiving <span class="text-indigo-400 font-mono font-bold">{{ returnModalItem.assetTag }}</span> from {{ returnModalItem.checkedOutTo }}
        </p>

        <form @submit.prevent="handleConfirmReturn" class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Inspection Condition Notes</label>
            <input
              v-model="returnConditionNotes"
              type="text"
              placeholder="Good / Inspected / Calibrated"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div class="flex justify-end gap-2 pt-3">
            <button
              type="button"
              @click="returnModalItem = null"
              class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg cursor-pointer"
            >
              Complete Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
