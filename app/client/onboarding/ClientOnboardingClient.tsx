'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Project, OnboardingData } from '@/types';
import {
  ArcBadge, ArcCard, ArcPageHeader, ArcLabel, ArcInput,
  ArcTextarea, ArcBtn, ArcAlert, ArcEmpty,
} from '@/components/arc-ui';
import { submitOnboardingAction } from '@/app/actions';
import { CheckCircle, AlertCircle, ClipboardCheck, Clock } from 'lucide-react';
import Link from 'next/link';

type Enriched = Project & { onboarding: OnboardingData | null };

interface FormState {
  business_name:    string;
  business_details: string;
  requirements:     string;
  target_audience:  string;
  additional_notes: string;
  assets:           Record<string, boolean>;
  creds:            Array<{ key: string; val: string }>;
}

const ASSET_KEYS = [
  { key: 'logo',                label: 'Logo files (.png, .svg, .ai)' },
  { key: 'brand_guidelines',    label: 'Brand guidelines / style guide' },
  { key: 'existing_data_export',label: 'Existing data for migration' },
  { key: 'api_credentials',     label: 'API credentials / access tokens' },
];

const INITIAL: FormState = {
  business_name: '', business_details: '', requirements: '',
  target_audience: '', additional_notes: '',
  assets: Object.fromEntries(ASSET_KEYS.map(k => [k.key, false])),
  creds: [{ key: '', val: '' }, { key: '', val: '' }, { key: '', val: '' }],
};

export function ClientOnboardingClient({ projects }: { projects: Enriched[] }) {
  const router                        = useRouter();
  const [selected, setSelected]       = useState<Enriched | null>(
    projects.find(p => !p.onboarding || p.onboarding.status === 'REJECTED') ?? projects[0] ?? null
  );
  const [isPending, startTransition]  = useTransition();
  const [error,   setError]           = useState('');
  const [success, setSuccess]         = useState('');
  const [form, setForm]               = useState<FormState>(INITIAL);

  if (projects.length === 0) return (
    <div className="flex-1 flex items-center justify-center">
      <ArcEmpty message="No projects require onboarding at this time." />
    </div>
  );

  const onb      = selected?.onboarding;
  const isLocked = !!onb && onb.status !== 'REJECTED';

  function updateCred(i: number, field: 'key' | 'val', value: string) {
    setForm(f => {
      const creds = [...f.creds];
      creds[i] = { ...creds[i], [field]: value };
      return { ...f, creds };
    });
  }

  async function handleSubmit() {
    if (!selected) return;
    if (!form.business_name.trim()) return setError('Business name is required.');
    if (!form.requirements.trim())  return setError('Project requirements are required.');

    const credentials: Record<string, string> = {};
    form.creds.forEach(({ key, val }) => { if (key.trim() && val.trim()) credentials[key.trim()] = val.trim(); });

    // Use Record<string, unknown> — no type conflicts
    const payload: Record<string, unknown> = {
      business_name:   form.business_name.trim(),
      requirements:    form.requirements.trim(),
      assets_provided: form.assets,
    };
    if (form.business_details.trim()) payload.business_details  = form.business_details.trim();
    if (form.target_audience.trim())  payload.target_audience   = form.target_audience.trim();
    if (form.additional_notes.trim()) payload.additional_notes  = form.additional_notes.trim();
    if (Object.keys(credentials).length) payload.credentials    = credentials;

    setError('');
    startTransition(async () => {
      const r = await submitOnboardingAction(selected.id, payload);
      if (r.ok) { setSuccess('Submitted! Your project manager will review it shortly.'); router.refresh(); }
      else setError(r.error);
    });
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ArcPageHeader title="Client" italic="Onboarding"
        sub="Complete this form to help your team deliver the best possible results." />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

          {/* Project picker */}
          {projects.length > 1 && (
            <div>
              <ArcLabel>Select Project</ArcLabel>
              <div className="space-y-2 mt-2">
                {projects.map(p => (
                  <button key={p.id} onClick={() => setSelected(p)}
                    className="w-full text-left flex items-center justify-between px-5 py-3.5 rounded-xl transition-all"
                    style={{ border: `1px solid ${selected?.id === p.id ? 'var(--arc-border-md)' : 'var(--arc-border)'}`, background: selected?.id === p.id ? 'rgba(201,168,76,0.06)' : 'var(--arc-bg-card)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--arc-cream)' }}>{p.title}</span>
                    <ArcBadge status={p.onboarding?.status ?? 'PENDING'} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status banner */}
          {onb && (
            <div className="flex items-start gap-4 px-5 py-4 rounded-xl"
              style={{
                background: onb.status === 'APPROVED' ? 'rgba(63,185,80,.07)' : onb.status === 'REJECTED' ? 'rgba(232,107,107,.07)' : 'rgba(201,168,76,.07)',
                border: `1px solid ${onb.status === 'APPROVED' ? 'rgba(63,185,80,.25)' : onb.status === 'REJECTED' ? 'rgba(232,107,107,.25)' : 'rgba(201,168,76,.25)'}`,
              }}>
              {onb.status === 'APPROVED' ? <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#5cb85c' }} />
               : onb.status === 'REJECTED' ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#e86b6b' }} />
               : <Clock size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--arc-gold)' }} />}
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: onb.status === 'APPROVED' ? '#5cb85c' : onb.status === 'REJECTED' ? '#e86b6b' : 'var(--arc-cream)' }}>
                  {onb.status === 'SUBMITTED' ? 'Under review — your project manager will respond shortly.'
                   : onb.status === 'APPROVED' ? 'Approved! Your project is now being set up.'
                   : 'Needs updates — please correct and resubmit.'}
                </p>
                {onb.rejection_reason && <p className="text-sm mt-2 px-3 py-2 rounded-lg" style={{ color: '#e86b6b', background: 'rgba(232,107,107,.08)' }}>{onb.rejection_reason}</p>}
                {onb.status === 'APPROVED' && <Link href="/client/projects" className="text-sm mt-2 inline-block underline" style={{ color: 'var(--arc-gold)', textUnderlineOffset: '3px' }}>View your project →</Link>}
              </div>
            </div>
          )}

          {/* Form */}
          {!isLocked && (
            <div className="space-y-5">
              {(error || success) && <ArcAlert type={error ? 'error' : 'success'} message={error || success} />}

              {/* Step 1 — Business info */}
              <ArcCard>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--arc-gold)', color: '#0e0c09' }}>1</span>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--arc-cream)', fontFamily: 'var(--font-serif)' }}>About Your Business</h3>
                </div>
                <div className="space-y-4">
                  <div><ArcLabel>Business Name *</ArcLabel><ArcInput className="w-full mt-1.5" value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="e.g. TechStartup Pvt Ltd" /></div>
                  <div>
                    <ArcLabel>Business Description</ArcLabel>
                    <p className="text-[11px] mb-1.5" style={{ color: 'var(--arc-mute)' }}>Industry, team size, current workflow, and the core problem you're solving.</p>
                    <ArcTextarea className="w-full" rows={4} value={form.business_details} onChange={e => setForm(f => ({ ...f, business_details: e.target.value }))} placeholder="We are a 3-year-old B2B company with 25 employees…" />
                  </div>
                  <div><ArcLabel>Target Audience</ArcLabel><ArcInput className="w-full mt-1.5" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="e.g. Small manufacturing companies in India" /></div>
                </div>
              </ArcCard>

              {/* Step 2 — Requirements */}
              <ArcCard>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--arc-gold)', color: '#0e0c09' }}>2</span>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--arc-cream)', fontFamily: 'var(--font-serif)' }}>Project Requirements *</h3>
                </div>
                <p className="text-[12px] mb-3" style={{ color: 'var(--arc-mute)' }}>Features, integrations, platforms, user roles, timeline, and any technical constraints. Be as specific as possible.</p>
                <ArcTextarea className="w-full" rows={6} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder="Web app + mobile app. Must integrate with Tally. Need barcode scanning. Multi-warehouse support. MVP in 3 months…" />
              </ArcCard>

              {/* Step 3 — Assets */}
              <ArcCard>
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--arc-gold)', color: '#0e0c09' }}>3</span>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--arc-cream)', fontFamily: 'var(--font-serif)' }}>Assets &amp; Technical Access</h3>
                </div>
                <div>
                  <ArcLabel>Which assets can you provide?</ArcLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {ASSET_KEYS.map(({ key, label }) => {
                      const checked = form.assets[key] ?? false;
                      return (
                        <button key={key} type="button" onClick={() => setForm(f => ({ ...f, assets: { ...f.assets, [key]: !checked } }))}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                          style={{ border: `1px solid ${checked ? 'rgba(63,185,80,.35)' : 'var(--arc-border)'}`, background: checked ? 'rgba(63,185,80,.07)' : 'var(--arc-bg)' }}>
                          <div className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all"
                            style={{ borderColor: checked ? '#5cb85c' : 'var(--arc-mute)', background: checked ? '#5cb85c' : 'transparent' }}>
                            {checked && <svg viewBox="0 0 10 8" width="10" height="8"><path d="M1 4l3 3 5-6" stroke="#0e0c09" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <span className="text-[12px] leading-tight" style={{ color: checked ? '#5cb85c' : 'var(--arc-mute)' }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5">
                  <ArcLabel>Technical credentials &amp; access info</ArcLabel>
                  <p className="text-[11px] mb-3" style={{ color: 'var(--arc-mute)' }}>Optional — API keys, software versions, hosting details the team will need.</p>
                  <div className="space-y-2">
                    {form.creds.map((cred, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <ArcInput className="w-full" value={cred.key} onChange={e => updateCred(i, 'key', e.target.value)} placeholder={['e.g. Tally version', 'e.g. Hosting provider', 'Key'][i] ?? 'Key'} />
                        <ArcInput className="w-full" value={cred.val} onChange={e => updateCred(i, 'val', e.target.value)} placeholder={['Tally Prime 2.1', 'AWS India', 'Value'][i] ?? 'Value'} />
                      </div>
                    ))}
                  </div>
                </div>
              </ArcCard>

              {/* Step 4 — Notes */}
              <ArcCard>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--arc-gold)', color: '#0e0c09' }}>4</span>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--arc-cream)', fontFamily: 'var(--font-serif)' }}>Anything else?</h3>
                </div>
                <ArcTextarea className="w-full" rows={3} value={form.additional_notes} onChange={e => setForm(f => ({ ...f, additional_notes: e.target.value }))} placeholder="Deadlines, preferences, references, or anything else we should know…" />
              </ArcCard>

              <div className="flex items-center gap-4 pb-6">
                <ArcBtn variant="gold" onClick={handleSubmit} loading={isPending} className="h-11 px-8 text-sm">
                  <ClipboardCheck size={15} /> Submit Onboarding
                </ArcBtn>
                <p className="text-[11px]" style={{ color: 'var(--arc-mute)', fontStyle: 'italic' }}>All information is kept strictly confidential.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
