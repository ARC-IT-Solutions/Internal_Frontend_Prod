'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Project, User, Paginated, ProjectStatus } from '@/types';
import { PROJECT_TRANSITIONS } from '@/types';
import { Badge, Button, Select, Alert, Input, Textarea, Modal, EmptyState } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { relTime, money, shortDate, fullDate, initials } from '@/lib/utils';
import { patchProjectAction, deleteProjectAction, createProjectAction } from '@/app/actions';
import Link from 'next/link';

const STATUS_BAR: Record<string,string> = {
  DRAFT:'#484F58', PLANNING:'#388bfd', ONBOARDING:'#a371f7',
  IN_PROGRESS:'#F0883E', ON_HOLD:'#e08040', REVIEW:'#26d9b7',
  COMPLETED:'#3fb950', CANCELLED:'#f85149',
};
const PRIS = ['LOW','MEDIUM','HIGH','URGENT'] as const;

export function ProjectsClient({
  projects, clients, currentUser,
}: {
  projects: Paginated<Project>;
  clients: User[];           // <- replaces employees; these are client-role users
  currentUser: User;
}) {
  const router = useRouter();
  const [sel, setSel]            = useState<Project | null>(null);
  const [isPend, startTrans]     = useTransition();
  const [err, setErr]            = useState('');
  const [ok,  setOk]             = useState('');
  const [sfStatus, setSfStatus]  = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [cf, setCf] = useState({
    client_id: clients[0]?.id ?? '',
    title: '', description: '', priority: 'HIGH',
    budget: '', start_date: '', end_date: '',
  });

  const isEmp   = currentUser.role !== 'client';
  const isAdmin = currentUser.role === 'admin';

  const notify = (m: string, t: 'ok' | 'err') => {
    t === 'ok' ? (setOk(m), setErr('')) : (setErr(m), setOk(''));
    setTimeout(() => { setOk(''); setErr(''); }, 5000);
  };

  async function moveTo(status: ProjectStatus) {
    if (!sel) return;
    startTrans(async () => {
      const r = await patchProjectAction(sel.id, { status });
      if (r.ok) { setSel(r.data as Project); notify(`Moved to ${status}.`, 'ok'); router.refresh(); }
      else notify(r.error, 'err');
    });
  }

  async function doDelete() {
    if (!sel || !confirm('Delete this project?')) return;
    startTrans(async () => {
      const r = await deleteProjectAction(sel.id);
      if (r.ok) { setSel(null); notify('Deleted.', 'ok'); router.refresh(); }
      else notify(r.error, 'err');
    });
  }

  async function doCreate() {
    if (!cf.title.trim())    return setErr('Title is required.');
    if (!cf.client_id)       return setErr('Please select a client.');
    const payload: Record<string, unknown> = {
      title:     cf.title.trim(),
      client_id: cf.client_id,
      priority:  cf.priority,
    };
    if (cf.description.trim()) payload.description = cf.description.trim();
    if (cf.budget)             payload.budget       = parseFloat(cf.budget);
    if (cf.start_date)         payload.start_date   = cf.start_date;
    if (cf.end_date)           payload.end_date     = cf.end_date;

    startTrans(async () => {
      const r = await createProjectAction(payload);
      if (r.ok) { setShowCreate(false); notify('Project created!', 'ok'); router.refresh(); }
      else notify(r.error, 'err');
    });
  }

  const filtered   = projects.items.filter(p => !sfStatus || p.status === sfStatus);
  const nextStates = sel ? PROJECT_TRANSITIONS[sel.status] ?? [] : [];
  const selClient  = sel ? clients.find(c => c.id === sel.client_id) : null;

  return (
    <>
      <PageShell
        list={
          <>
            <ListHeader
              title="Projects" count={projects.total}
              filters={
                <Select value={sfStatus} onChange={e => setSfStatus(e.target.value)}
                  style={{ width: 'auto', height: 28, padding: '0 8px', fontSize: 11 }}>
                  <option value="">All Status</option>
                  {['DRAFT','PLANNING','ONBOARDING','IN_PROGRESS','ON_HOLD','REVIEW','COMPLETED','CANCELLED'].map(s =>
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  )}
                </Select>
              }
              actions={
                isEmp && (
                  <button
                    onClick={() => setShowCreate(true)}
                    style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,.1)', background:'transparent', cursor:'pointer', color:'#F0883E', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}
                    title="New project">
                    +
                  </button>
                )
              }
            />

            <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,.06) transparent' }}>
              {filtered.length === 0 && <EmptyState title="No projects found" />}
              {filtered.map((p, i) => {
                const active = sel?.id === p.id;
                const client = clients.find(c => c.id === p.client_id);
                return (
                  <motion.button key={p.id}
                    initial={{ opacity:0, x:-6 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.02 }}
                    onClick={() => setSel(p)}
                    style={{ width:'100%', textAlign:'left', display:'flex', border:'none', borderBottom:'1px solid rgba(255,255,255,.04)', background: active?'rgba(255,255,255,.04)':'transparent', cursor:'pointer', padding:0 }}>
                    <div style={{ width:3, flexShrink:0, background: active ? STATUS_BAR[p.status] : 'transparent', transition:'background 0.2s' }} />
                    <div style={{ flex:1, padding:'11px 14px', minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:active?500:400, color:active?'var(--s-text)':'var(--s-sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.title}
                        </span>
                        <span style={{ fontSize:10, color:'var(--s-dim)', fontFamily:'var(--font-mono)', flexShrink:0 }}>
                          {relTime(p.created_at)}
                        </span>
                      </div>
                      {/* Client name shown in list */}
                      {client && (
                        <div style={{ fontSize:11, color:'var(--s-dim)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {client.full_name}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:5 }}>
                        <Badge status={p.priority} />
                        <Badge status={p.status} />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        }
        detail={
          !sel ? (
            <EmptyDetail text="Select a project" />
          ) : (
            <>
              <DetailHeader
                title={sel.title}
                sub={selClient ? `${selClient.full_name} · ${selClient.email}` : `Client: ${sel.client_id.slice(0,14)}…`}
                badges={<><Badge status={sel.priority} /><Badge status={sel.status} /></>}
                actions={
                  <>
                    <Link href={`/milestones?project=${sel.id}`}
                      style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>
                      Milestones
                    </Link>
                    <Link href={`/onboarding?project=${sel.id}`}
                      style={{ display:'inline-flex', alignItems:'center', padding:'0 10px', height:30, borderRadius:7, border:'1px solid var(--s-border)', background:'var(--s-raised)', color:'var(--s-sub)', fontSize:12, textDecoration:'none', fontWeight:500 }}>
                      Onboarding
                    </Link>
                    {isAdmin && (
                      <Button variant="danger" size="sm" onClick={doDelete} disabled={isPend}>Delete</Button>
                    )}
                  </>
                }
              />
              <DetailBody>
                {(err || ok) && <Alert type={err ? 'error' : 'success'} message={err || ok} />}

                {/* Client info card */}
                {selClient && (
                  <Section label="Client">
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, background:'var(--s-raised)', border:'1px solid var(--s-border)' }}>
                      <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, background:'rgba(63,185,80,.18)', color:'#3fb950' }}>
                        {initials(selClient.full_name)}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:'var(--s-text)' }}>{selClient.full_name}</div>
                        <div style={{ fontSize:11, color:'var(--s-dim)' }}>{selClient.email}</div>
                      </div>
                    </div>
                  </Section>
                )}

                {sel.description && (
                  <Section label="Description">
                    <p style={{ fontSize:13, lineHeight:1.65, color:'var(--s-sub)' }}>{sel.description}</p>
                  </Section>
                )}

                <Section label="Details">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}><tbody>
                    {[
                      ['Budget',  sel.budget ? money(sel.budget) : '—'],
                      ['Start',   shortDate(sel.start_date)],
                      ['End',     shortDate(sel.end_date)],
                      ['Created', fullDate(sel.created_at)],
                    ].map(([l, v]) => (
                      <tr key={l} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                        <td style={{ padding:'7px 12px 7px 0', fontSize:11, color:'var(--s-dim)', width:80 }}>{l}</td>
                        <td style={{ padding:'7px 0', fontSize:12, color:'var(--s-text)', fontFamily:'var(--font-mono)' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </Section>

                {isEmp && nextStates.length > 0 && (
                  <Section label="Move to Next Stage">
                    {sel.status === 'ONBOARDING' && (
                      <p style={{ fontSize:11, color:'#F0883E', background:'rgba(240,136,62,.08)', border:'1px solid rgba(240,136,62,.2)', borderRadius:7, padding:'8px 12px', marginBottom:10 }}>
                        ⚠ IN_PROGRESS requires approved onboarding (enforced by backend).
                      </p>
                    )}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {nextStates.map(next => (
                        <Button key={next}
                          variant={next === 'CANCELLED' ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => moveTo(next)}
                          disabled={isPend}>
                          → {next.replace('_',' ')}
                        </Button>
                      ))}
                    </div>
                  </Section>
                )}
              </DetailBody>
            </>
          )
        }
      />

      {/* Create project modal */}
      {showCreate && (
        <Modal title="Create New Project" sub="Select a client from registered accounts" onClose={() => setShowCreate(false)}>
          {err && <Alert type="error" message={err} />}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Client dropdown */}
            <div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--s-dim)', marginBottom:5 }}>
                Client *
              </div>
              {clients.length === 0 ? (
                <div style={{ padding:'10px 12px', borderRadius:8, background:'rgba(248,136,60,.08)', border:'1px solid rgba(248,136,60,.2)', fontSize:12, color:'#F0883E' }}>
                  No client accounts found. Register a client first via the Users page.
                </div>
              ) : (
                <select
                  value={cf.client_id}
                  onChange={e => setCf({ ...cf, client_id: e.target.value })}
                  style={{ width:'100%', height:34, padding:'0 10px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--s-text)', borderRadius:8, outline:'none', fontFamily:'var(--font-sans)', fontSize:13, cursor:'pointer' }}>
                  <option value="">— Select a client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <Input label="Project Title *" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} placeholder="e.g. E-commerce Platform Redesign" />
            <Textarea label="Description" rows={2} value={cf.description} onChange={e => setCf({ ...cf, description: e.target.value })} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Select label="Priority" value={cf.priority} onChange={e => setCf({ ...cf, priority: e.target.value })} style={{ width:'100%' }}>
                {PRIS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
              <Input label="Budget (INR)" type="number" value={cf.budget} onChange={e => setCf({ ...cf, budget: e.target.value })} placeholder="e.g. 150000" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Input label="Start Date" type="date" value={cf.start_date} onChange={e => setCf({ ...cf, start_date: e.target.value })} />
              <Input label="End Date" type="date" value={cf.end_date} onChange={e => setCf({ ...cf, end_date: e.target.value })} />
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginTop:18 }}>
            <Button variant="primary" onClick={doCreate} loading={isPend} style={{ flex:1, justifyContent:'center' }}>
              Create Project
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>

          <p style={{ fontSize:10, color:'var(--s-dim)', marginTop:8 }}>
            Project starts in DRAFT status. Move it to PLANNING to begin the workflow.
          </p>
        </Modal>
      )}
    </>
  );
}
