import { ref, computed } from 'vue';
import { useAuth } from './useAuth.ts';

export interface VisitRecord {
  id: string;
  badgeNumber: string;
  type: 'visitor' | 'employee' | 'contractor';
  name: string;
  email: string;
  phone?: string;
  company?: string;
  hostEmployee?: string;
  department?: string;
  purpose: string;
  location: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'active' | 'checked_out';
  durationMinutes?: number;
  ndaAgreed: boolean;
  notes?: string;
  assignedEquipment?: string[];
  checkedInBy?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  badgeNumber: string;
  currentlyOnSite: boolean;
  lastSeen?: string;
}

export interface EquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  category: 'laptop' | 'testing' | 'access_card' | 'key' | 'av' | 'visitor_badge';
  status: 'available' | 'checked_out' | 'maintenance';
  checkedOutTo?: string;
  checkedOutToBadge?: string;
  checkedOutAt?: string;
  expectedReturn?: string;
  condition: string;
}

export interface Stats {
  currentlyOnSite: number;
  activeVisitors: number;
  activeEmployees: number;
  activeContractors: number;
  totalToday: number;
  equipmentCheckedOut: number;
  avgDurationMinutes: number;
  capacityTotal: number;
  occupancyPercentage: number;
}

const stats = ref<Stats>({
  currentlyOnSite: 0,
  activeVisitors: 0,
  activeEmployees: 0,
  activeContractors: 0,
  totalToday: 0,
  equipmentCheckedOut: 0,
  avgDurationMinutes: 0,
  capacityTotal: 150,
  occupancyPercentage: 0,
});

const visits = ref<VisitRecord[]>([]);
const employees = ref<Employee[]>([]);
const equipment = ref<EquipmentItem[]>([]);
const isLoading = ref<boolean>(false);
const actionMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

export function useCheckpoint() {
  const { token } = useAuth();

  function getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }
    return headers;
  }

  function notify(text: string, type: 'success' | 'error' = 'success') {
    actionMessage.value = { type, text };
    setTimeout(() => {
      if (actionMessage.value?.text === text) {
        actionMessage.value = null;
      }
    }, 4000);
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats', { headers: getHeaders() });
      if (res.ok) {
        stats.value = await res.json();
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  async function fetchVisits(params?: { status?: string; type?: string; q?: string }) {
    isLoading.value = true;
    try {
      const url = new URL('/api/visits', window.location.origin);
      if (params?.status) url.searchParams.set('status', params.status);
      if (params?.type) url.searchParams.set('type', params.type);
      if (params?.q) url.searchParams.set('q', params.q);

      const res = await fetch(url.toString(), { headers: getHeaders() });
      if (res.ok) {
        visits.value = await res.json();
      }
    } catch (err) {
      console.error('Failed to load visits:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/employees', { headers: getHeaders() });
      if (res.ok) {
        employees.value = await res.json();
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }

  async function fetchEquipment() {
    try {
      const res = await fetch('/api/equipment', { headers: getHeaders() });
      if (res.ok) {
        equipment.value = await res.json();
      }
    } catch (err) {
      console.error('Failed to load equipment:', err);
    }
  }

  async function refreshAll() {
    await Promise.all([fetchStats(), fetchVisits(), fetchEmployees(), fetchEquipment()]);
  }

  async function checkIn(payload: {
    type: 'visitor' | 'employee' | 'contractor';
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    hostEmployee?: string;
    department?: string;
    purpose?: string;
    location?: string;
    ndaAgreed?: boolean;
    notes?: string;
    assignedEquipment?: string[];
  }): Promise<VisitRecord | null> {
    try {
      const res = await fetch('/api/visits/checkin', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Check-in failed', 'error');
        return null;
      }
      notify(data.message || `Checked in successfully: ${data.visit.badgeNumber}`, 'success');
      await refreshAll();
      return data.visit;
    } catch (err: any) {
      notify(err.message || 'Error executing check-in', 'error');
      return null;
    }
  }

  async function checkOut(idOrBadge: { id?: string; badgeNumber?: string }): Promise<boolean> {
    try {
      const res = await fetch('/api/visits/checkout', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(idOrBadge),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Check-out failed', 'error');
        return false;
      }
      notify(data.message || 'Successfully checked out.', 'success');
      await refreshAll();
      return true;
    } catch (err: any) {
      notify(err.message || 'Error executing check-out', 'error');
      return false;
    }
  }

  async function bulkCheckOut(ids?: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/visits/bulk-checkout', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Bulk check-out failed', 'error');
        return false;
      }
      notify(data.message || 'Completed bulk check-out.', 'success');
      await refreshAll();
      return true;
    } catch (err: any) {
      notify(err.message || 'Error executing bulk check-out', 'error');
      return false;
    }
  }

  async function lookupQuery(query: string) {
    if (!query.trim()) return null;
    try {
      const res = await fetch(`/api/lookup/${encodeURIComponent(query.trim())}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  async function checkoutEquipment(equipmentId: string, userName: string, userBadge: string, expectedReturn?: string) {
    try {
      const res = await fetch('/api/equipment/checkout', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ equipmentId, userName, userBadge, expectedReturn }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Equipment checkout failed', 'error');
        return false;
      }
      notify(`Asset ${data.item.assetTag} assigned to ${userName}.`, 'success');
      await refreshAll();
      return true;
    } catch (err: any) {
      notify(err.message || 'Failed to checkout asset', 'error');
      return false;
    }
  }

  async function checkinEquipment(equipmentId: string, conditionNotes?: string) {
    try {
      const res = await fetch('/api/equipment/checkin', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ equipmentId, conditionNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Equipment return failed', 'error');
        return false;
      }
      notify(`Asset ${data.item.assetTag} returned to available inventory.`, 'success');
      await refreshAll();
      return true;
    } catch (err: any) {
      notify(err.message || 'Failed to return asset', 'error');
      return false;
    }
  }

  async function resetDatabase() {
    try {
      const res = await fetch('/api/db/reset', { method: 'POST', headers: getHeaders() });
      if (res.ok) {
        notify('Database reset to initial demo seeds.', 'success');
        await refreshAll();
      }
    } catch (err) {
      notify('Failed to reset database', 'error');
    }
  }

  return {
    stats,
    visits,
    employees,
    equipment,
    isLoading,
    actionMessage,
    notify,
    fetchStats,
    fetchVisits,
    fetchEmployees,
    fetchEquipment,
    refreshAll,
    checkIn,
    checkOut,
    bulkCheckOut,
    lookupQuery,
    checkoutEquipment,
    checkinEquipment,
    resetDatabase,
  };
}
