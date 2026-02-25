'use client';

import { useState, useCallback } from 'react';
import {
  Sun,
  LayoutDashboard,
  Settings,
  Layers,
  Users,
  DollarSign,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { OBSConfigSerialized, NavSection } from './types';
import { OBSOverview } from './sections/obs-overview';
import { OBSSetup } from './sections/obs-setup';
import { OBSPageBuilder } from './sections/obs-page-builder';
import { OBSRegistrations } from './sections/obs-registrations';
import { OBSFinancials } from './sections/obs-financials';

interface Props {
  initialConfigs: OBSConfigSerialized[];
  userRole: string;
}

function getConfigStatus(config: OBSConfigSerialized): 'upcoming' | 'open' | 'closed' | 'past' {
  const now = new Date();
  const start = new Date(config.startDate);
  const end = new Date(config.endDate);
  const regOpens = new Date(config.registrationOpens);
  const regCloses = new Date(config.registrationCloses);

  if (now > end) return 'past';
  if (now >= start && now <= end) return 'open';
  if (now >= regOpens && now <= regCloses) return 'open';
  return 'upcoming';
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'Upcoming', className: 'bg-blue-500/15 text-blue-400' },
  open: { label: 'Registration Open', className: 'bg-emerald-500/15 text-emerald-400' },
  closed: { label: 'Reg. Closed', className: 'bg-amber-500/15 text-amber-400' },
  past: { label: 'Past', className: 'bg-white/10 text-white/40' },
};

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'setup', label: 'Setup', icon: Settings },
  { id: 'page-builder', label: 'Page Builder', icon: Layers },
  { id: 'registrations', label: 'Registrations', icon: Users },
  { id: 'financials', label: 'Financials', icon: DollarSign },
];

export function OBSCommandCenter({ initialConfigs, userRole }: Props) {
  const [configs, setConfigs] = useState<OBSConfigSerialized[]>(initialConfigs);
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(
    initialConfigs.find((c) => c.isActive)?.id ?? initialConfigs[0]?.id ?? null,
  );
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [eventDayMode, setEventDayMode] = useState(false);

  const selectedConfig = configs.find((c) => c.id === selectedConfigId) ?? null;

  const handleConfigUpdate = useCallback((updated: OBSConfigSerialized) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleConfigCreate = useCallback((created: OBSConfigSerialized) => {
    setConfigs((prev) => [created, ...prev]);
    setSelectedConfigId(created.id);
  }, []);

  const handleActivate = useCallback((id: string) => {
    setConfigs((prev) =>
      prev.map((c) => ({ ...c, isActive: c.id === id })),
    );
  }, []);

  const status = selectedConfig ? getConfigStatus(selectedConfig) : 'past';
  const badge = STATUS_BADGE[selectedConfig?.isActive ? status : 'past'];
  const activeConfigBadge = selectedConfig?.isActive ? STATUS_BADGE[status] : STATUS_BADGE['past'];

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <aside
        className={`w-56 shrink-0 flex flex-col border-r border-border bg-[#060611] transition-opacity ${
          eventDayMode ? 'opacity-30 pointer-events-none select-none' : ''
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/15 rounded-lg">
              <Sun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-bold text-foreground">
                  OBS {selectedConfig?.year ?? '—'}
                </span>
                {selectedConfig && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${activeConfigBadge.className}`}
                  >
                    {selectedConfig.isActive ? activeConfigBadge.label : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Year selector */}
          {configs.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setYearDropdownOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg px-3 py-1.5 transition-colors"
              >
                <span>{selectedConfig?.eventName ?? 'Select year'}</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
              {yearDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                  {configs.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedConfigId(c.id);
                        setYearDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors ${
                        c.id === selectedConfigId ? 'text-amber-400' : 'text-muted-foreground'
                      }`}
                    >
                      <span>{c.year} — {c.eventName}</span>
                      {c.isActive && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeSection === id
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          {selectedConfig && (
            <div className="space-y-1 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                {selectedConfig.isActive ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400/50" />
                )}
                <span>{selectedConfig.isActive ? 'Active config' : 'Inactive config'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{selectedConfig._count.registrations} registrations</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-auto bg-[#060611]">
        <div className={activeSection === 'registrations' && eventDayMode ? 'h-full' : 'p-6'}>
          {activeSection === 'overview' && (
            <OBSOverview
              config={selectedConfig}
              onNavigate={(section) => setActiveSection(section)}
            />
          )}
          {activeSection === 'setup' && (
            <OBSSetup
              config={selectedConfig}
              configs={configs}
              isAdmin={isAdmin}
              onConfigUpdate={handleConfigUpdate}
              onConfigCreate={handleConfigCreate}
              onActivate={handleActivate}
            />
          )}
          {activeSection === 'page-builder' && (
            <OBSPageBuilder config={selectedConfig} onConfigUpdate={handleConfigUpdate} />
          )}
          {activeSection === 'registrations' && (
            <OBSRegistrations
              config={selectedConfig}
              eventDayMode={eventDayMode}
              onSetEventDayMode={setEventDayMode}
              onNavigate={(section) => setActiveSection(section)}
            />
          )}
          {activeSection === 'financials' && (
            <OBSFinancials config={selectedConfig} />
          )}
        </div>
      </main>
    </div>
  );
}
