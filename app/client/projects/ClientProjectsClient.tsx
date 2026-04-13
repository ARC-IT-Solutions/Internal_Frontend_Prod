'use client';

import { useState } from 'react';
import type { Project, Milestone, OnboardingData } from '@/types';
import { ArcBadge, ArcCard, ArcPageHeader, ArcInfoRow, ArcRule, ArcEmpty } from '@/components/arc-ui';
import { money, shortDate } from '@/lib/utils';
import { CheckCircle, AlertCircle, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type EnrichedProject = Project & { milestones: Milestone[]; onboarding: OnboardingData | null };

const STATUS_PCT: Record<string, number> = {
  DRAFT:5, PLANNING:15, ONBOARDING:30, IN_PROGRESS:60, ON_HOLD:55, REVIEW:85, COMPLETED:100, CANCELLED:0,
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT:'Getting started', PLANNING:'In planning', ONBOARDING:'Awaiting your onboarding',
  IN_PROGRESS:'Actively in progress', ON_HOLD:'Temporarily on hold',
  REVIEW:'Under final review', COMPLETED:'Successfully delivered', CANCELLED:'Cancelled',
};

export function ClientProjectsClient({ projects }: { projects: EnrichedProject[] }) {
  const [selected, setSelected] = useState<EnrichedProject | null>(projects[0] ?? null);

  if (projects.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <ArcEmpty message="No projects yet. Your project manager will set this up." />
    </div>
  );

  const ms       = selected?.milestones ?? [];
  const pct      = selected ? STATUS_PCT[selected.status] ?? 0 : 0;
  const isGreen  = selected?.status === 'COMPLETED';
  const isActive = ['IN_PROGRESS','REVIEW'].includes(selected?.status ?? '');

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ArcPageHeader title="My" italic="Projects"
        sub="Track the progress of your ongoing work with ARC IT Solutions." />

      <div className="flex flex-1 overflow-hidden">

        {/* Project list — only show when multiple */}
        {projects.length > 1 && (
          <div className="w-64 flex-shrink-0 overflow-y-auto py-2"
            style={{ borderRight: '1px solid var(--arc-border)' }}>
            {projects.map(p => {
              const active = selected?.id === p.id;
              return (
                <button key={p.id} onClick={() => setSelected(p)}
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3 transition-all"
                  style={{ borderBottom: '1px solid var(--arc-border)', borderLeft: active ? '2px solid var(--arc-gold)' : '2px solid transparent', background: active ? 'rgba(201,168,76,.04)' : 'transparent' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ color: active ? 'var(--arc-cream)' : 'var(--arc-mute)', fontWeight: active ? 500 : 400 }}>{p.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--arc-dim)' }}>{STATUS_LABEL[p.status]}</p>
                  </div>
                  <ChevronRight size={12} style={{ color: active ? 'var(--arc-gold)' : 'var(--arc-dim)', opacity: active ? 1 : 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {/* Detail */}
        {selected && (
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

            {/* Title + badge */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--arc-ivory)', fontWeight: 700, fontSize: '1.35rem', lineHeight: 1.2 }}>
                  {selected.title}
                </h2>
                <ArcBadge status={selected.status} className="flex-shrink-0 mt-1" />
              </div>
              {selected.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--arc-mute)', maxWidth: '55ch' }}>{selected.description}</p>
              )}
            </div>

            {/* Progress card */}
            <ArcCard>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--arc-mute)' }}>Project Progress</p>
                  <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.2rem', fontWeight: 700, color: isGreen ? '#5cb85c' : 'var(--arc-gold)' }}>
                    {STATUS_LABEL[selected.status]}
                  </p>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)', color: isGreen ? '#5cb85c' : 'var(--arc-gold)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{pct}%</p>
              </div>

              {/* Progress bar */}
              <div className="h-[3px] rounded-full mb-1.5" style={{ background: 'var(--arc-dim)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: isGreen ? '#5cb85c' : isActive ? 'linear-gradient(90deg,var(--arc-gold),var(--arc-gold-lt))' : 'var(--arc-dim)' }} />
              </div>

              {/* Stage milestones row */}
              <div className="flex items-center gap-0 mt-4 overflow-hidden rounded-lg" style={{ border: '1px solid var(--arc-border)' }}>
                {['PLANNING','ONBOARDING','IN_PROGRESS','REVIEW','COMPLETED'].map((stage, i, arr) => {
                  const done  = STATUS_PCT[selected.status] >= STATUS_PCT[stage];
                  const curr  = selected.status === stage;
                  return (
                    <div key={stage} className="flex-1 flex items-center justify-center py-2.5 text-[9px] tracking-widest uppercase text-center transition-colors"
                      style={{
                        background: curr ? 'rgba(201,168,76,.12)' : done ? 'rgba(63,185,80,.06)' : 'transparent',
                        color:      curr ? 'var(--arc-gold)' : done ? '#5cb85c' : 'var(--arc-dim)',
                        fontWeight: curr ? 700 : 400,
                        borderRight: i < arr.length - 1 ? '1px solid var(--arc-border)' : 'none',
                      }}>
                      {stage.replace('_',' ')}
                    </div>
                  );
                })}
              </div>
            </ArcCard>

            {/* Onboarding gate notice */}
            {['PLANNING','ONBOARDING'].includes(selected.status) && (() => {
              const ob = selected.onboarding;
              const needsAction = !ob || ob.status === 'REJECTED';
              return (
                <div className="flex items-start gap-4 px-5 py-4 rounded-xl"
                  style={{
                    background: ob?.status === 'APPROVED' ? 'rgba(63,185,80,.06)' : needsAction ? 'rgba(201,168,76,.06)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${ob?.status === 'APPROVED' ? 'rgba(63,185,80,.2)' : needsAction ? 'rgba(201,168,76,.2)' : 'var(--arc-border)'}`,
                  }}>
                  {ob?.status === 'APPROVED' ? <CheckCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#5cb85c' }} />
                   : needsAction ? <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--arc-gold)' }} />
                   : <Clock size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--arc-mute)' }} />}
                  <div>
                    <p className="text-sm" style={{ color: ob?.status === 'APPROVED' ? '#5cb85c' : needsAction ? 'var(--arc-cream)' : 'var(--arc-mute)', fontWeight: 500 }}>
                      {ob?.status === 'APPROVED' ? 'Onboarding approved — project starting soon'
                       : ob?.status === 'SUBMITTED' ? 'Onboarding submitted — under review'
                       : ob?.status === 'REJECTED' ? 'Onboarding needs updates'
                       : 'Your onboarding form is required to start the project'}
                    </p>
                    {ob?.rejection_reason && <p className="text-xs mt-1" style={{ color: '#e86b6b' }}>{ob.rejection_reason}</p>}
                    {needsAction && (
                      <Link href="/client/onboarding" className="text-xs mt-1.5 inline-flex items-center gap-1"
                        style={{ color: 'var(--arc-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                        {ob?.status === 'REJECTED' ? 'Resubmit onboarding' : 'Complete onboarding'} <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Project details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] tracking-[.14em] uppercase" style={{ color: 'var(--arc-mute)' }}>Details</span>
                <div className="h-px flex-1" style={{ background: 'var(--arc-border)' }} />
              </div>
              <table className="w-full"><tbody>
                {selected.budget    && <ArcInfoRow label="Budget">{money(selected.budget)}</ArcInfoRow>}
                <ArcInfoRow label="Start Date">{shortDate(selected.start_date)}</ArcInfoRow>
                <ArcInfoRow label="Delivery">{shortDate(selected.end_date)}</ArcInfoRow>
                <ArcInfoRow label="Status"><ArcBadge status={selected.status} /></ArcInfoRow>
              </tbody></table>
            </div>

            {/* Billing milestones */}
            {ms.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] tracking-[.14em] uppercase" style={{ color: 'var(--arc-mute)' }}>
                    Billing Milestones ({ms.filter(m => m.status === 'PAID').length}/{ms.length} paid)
                  </span>
                  <div className="h-px flex-1" style={{ background: 'var(--arc-border)' }} />
                </div>
                <div className="space-y-2">
                  {ms.sort((a, b) => a.order_index - b.order_index).map(m => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3.5 rounded-xl"
                      style={{ background: 'var(--arc-bg-card)', border: '1px solid var(--arc-border)', borderLeft: `3px solid ${m.status === 'PAID' ? '#5cb85c' : m.status === 'INVOICED' ? 'var(--arc-gold)' : 'var(--arc-dim)'}` }}>
                      <div>
                        <p className="text-[13px]" style={{ color: 'var(--arc-cream)' }}>{m.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--arc-mute)', fontFamily: 'var(--font-mono)' }}>
                          {m.percentage ? `${m.percentage}% of budget` : m.amount ? money(m.amount) : '—'}
                          {m.due_date ? ` · Due ${shortDate(m.due_date)}` : ''}
                        </p>
                      </div>
                      <ArcBadge status={m.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ArcRule />
            <p className="text-center text-[11px] pb-4" style={{ color: 'var(--arc-dim)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
              Questions?{' '}
              <Link href="/client/tickets" style={{ color: 'var(--arc-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Raise a support ticket →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
