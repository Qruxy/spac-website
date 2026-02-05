'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Tent,
  UtensilsCrossed,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  registrationType: 'ATTENDEE' | 'SPEAKER' | 'VENDOR' | 'STAFF' | 'VOLUNTEER';
  campingRequested: boolean;
  mealRequested: boolean;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'PARTIAL';
  amountPaid: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  isMember: boolean;
  tShirtSize: string | null;
}

interface Props {
  registrations: Registration[];
  obsId: string;
}

const typeColors: Record<string, string> = {
  ATTENDEE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SPEAKER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  VENDOR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  STAFF: 'bg-green-500/20 text-green-400 border-green-500/30',
  VOLUNTEER: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const paymentColors: Record<string, { bg: string; icon: React.ElementType }> = {
  PAID: { bg: 'text-green-400', icon: CheckCircle },
  PENDING: { bg: 'text-amber-400', icon: Clock },
  REFUNDED: { bg: 'text-slate-400', icon: XCircle },
  PARTIAL: { bg: 'text-orange-400', icon: Clock },
};

export default function RegistrationsClient({ registrations: initialRegistrations, obsId }: Props) {
  const [registrations] = useState(initialRegistrations);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'date' | 'type'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredRegistrations = useMemo(() => {
    let result = [...registrations];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.firstName.toLowerCase().includes(searchLower) ||
          r.lastName.toLowerCase().includes(searchLower) ||
          r.email.toLowerCase().includes(searchLower)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((r) => r.registrationType === typeFilter);
    }

    // Payment filter
    if (paymentFilter !== 'ALL') {
      result = result.filter((r) => r.paymentStatus === paymentFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
          break;
        case 'type':
          comparison = a.registrationType.localeCompare(b.registrationType);
          break;
        case 'date':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [registrations, search, typeFilter, paymentFilter, sortField, sortDir]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Type', 'Member', 'Camping', 'Meal', 'T-Shirt', 'Payment Status', 'Amount Paid', 'Checked In', 'Registered'];
    const rows = filteredRegistrations.map((r) => [
      r.firstName,
      r.lastName,
      r.email,
      r.phone || '',
      r.registrationType,
      r.isMember ? 'Yes' : 'No',
      r.campingRequested ? 'Yes' : 'No',
      r.mealRequested ? 'Yes' : 'No',
      r.tShirtSize || '',
      r.paymentStatus,
      r.amountPaid,
      r.checkedIn ? 'Yes' : 'No',
      new Date(r.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obs-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-500 outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="ATTENDEE">Attendees</option>
          <option value="SPEAKER">Speakers</option>
          <option value="VENDOR">Vendors</option>
          <option value="STAFF">Staff</option>
          <option value="VOLUNTEER">Volunteers</option>
        </select>
        
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-amber-500 outline-none"
        >
          <option value="ALL">All Payment Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-400 mb-4">
        Showing {filteredRegistrations.length} of {registrations.length} registrations
      </p>

      {/* Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase border-b border-slate-700/50">
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Type <SortIcon field="type" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Options</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-white"
                  >
                    Registered <SortIcon field="date" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredRegistrations.map((reg) => {
                const PaymentIcon = paymentColors[reg.paymentStatus]?.icon || Clock;
                return (
                  <tr key={reg.id} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-sm font-medium text-white">
                          {reg.firstName[0]}{reg.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {reg.firstName} {reg.lastName}
                          </p>
                          {reg.isMember && (
                            <span className="text-xs text-green-400">SPAC Member</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-300">{reg.email}</p>
                      {reg.phone && (
                        <p className="text-xs text-slate-500">{reg.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColors[reg.registrationType]}`}>
                        {reg.registrationType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {reg.campingRequested && (
                          <span className="p-1 bg-green-500/20 text-green-400 rounded" title="Camping">
                            <Tent className="w-3 h-3" />
                          </span>
                        )}
                        {reg.mealRequested && (
                          <span className="p-1 bg-amber-500/20 text-amber-400 rounded" title="Meals">
                            <UtensilsCrossed className="w-3 h-3" />
                          </span>
                        )}
                        {reg.tShirtSize && (
                          <span className="text-xs text-slate-500" title="T-Shirt Size">
                            {reg.tShirtSize}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <PaymentIcon className={`w-4 h-4 ${paymentColors[reg.paymentStatus]?.bg}`} />
                        <span className="text-sm text-white">${parseFloat(reg.amountPaid).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {reg.checkedIn ? (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Not checked in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No registrations found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
