'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ticket, TicketComment, Project } from '@/types';
import { ArcBadge, ArcButton, ArcTextarea, ArcSelect, ArcModal, ArcAlert, ArcPageHeader, ArcEmpty } from '@/components/ui/ArcUI';
import { ArcInput } from '@/components/ui/ArcUI';
import { relTime } from '@/lib/utils';
import { createTicketAction, addCommentAction } from '@/app/actions';

const PRIS = ['LOW','MEDIUM','HIGH','URGENT'] as const;
const STATUS_DOT: Record<string,string> = {
  OPEN:'#C05050', IN_PROGRESS:'#C9A84C', WAITING_CLIENT:'#E8C96A',
  RESOLVED:'#4CAF7D', CLOSED:'var(--c-muted)',
};

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

export function ClientTicketsView({ tickets, projects }: { tickets: Ticket[]; projects: Project[] }) {
  const router = useRouter();
  const [sel, setSel]            = useState<Ticket | null>(null);
  const [comments, setComments]  = useState<TicketComment[]>([]);
  const [loadingC, setLoadingC]  = useState(false);
  const [isPend, startTrans]     = useTransition();
  const [err, setErr]            = useState('');
  const [newMsg, setNewMsg]      = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [mobileTab, setMobileTab]   = useState<'list'|'chat'>('list');
  const [cf, setCf] = useState({ title:'', description:'', priority:'MEDIUM', project_id: projects[0]?.id ?? '' });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [comments]);

  async function pick(t: Ticket) {
    setSel(t);
    setMobileTab('chat');
    setLoadingC(true);
    const r = await fetch(`/api/proxy?path=tickets/${t.id}/comments`);
    const d = await r.json().catch(() => []);
    setComments((Array.isArray(d) ? d : []).filter((c: TicketComment) => !c.is_internal));
    setLoadingC(false);
  }

  async function send() {
    if (!sel || !newMsg.trim()) return;
    startTrans(async () => {
      const r = await addCommentAction(sel.id, newMsg.trim(), false);
      if (r.ok) { setComments(p => [...p, r.data as TicketComment]); setNewMsg(''); }
      else setErr(r.error);
    });
  }

  async function create() {
    if (!cf.title.trim()) return setErr('Title is required.');
    if (!cf.project_id)   return setErr('Please select a project.');
    startTrans(async () => {
      const r = await createTicketAction({
        title: cf.title.trim(),
        description: cf.description.trim() || undefined,
        priority: cf.priority,
        project_id: cf.project_id,
      });
      if (r.ok) {
        setShowCreate(false);
        setCf({ title:'', description:'', priority:'MEDIUM', project_id: projects[0]?.id ?? '' });
        router.refresh();
      } else setErr(r.error);
    });
  }

  const open   = tickets.filter(t => !['RESOLVED','CLOSED'].includes(t.status));
  const closed = tickets.filter(t =>  ['RESOLVED','CLOSED'].includes(t.status));
  const isClosed = ['RESOLVED','CLOSED'].includes(sel?.status ?? '');

  /* ── Ticket list panel ─────────────────────────────────────────── */
  const ListPanel = (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {tickets.length === 0 && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:24 }}>
          <ArcEmpty message="No tickets yet." />
          <ArcButton variant="gold" size="sm" onClick={() => setShowCreate(true)}>Raise first ticket</ArcButton>
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
        {open.map(t => (
          <TicketRow key={t.id} ticket={t} active={sel?.id === t.id}
            dot={STATUS_DOT[t.status]} onClick={() => pick(t)} />
        ))}
        {closed.length > 0 && (
          <>
            <div style={{ padding:'8px 16px 4px', fontSize:9, textTransform:'uppercase', letterSpacing:'0.18em', fontFamily:'var(--font-mono)', color:'var(--c-muted)', borderTop:'1px solid var(--c-border)' }}>
              Resolved / Closed
            </div>
            {closed.map(t => (
              <TicketRow key={t.id} ticket={t} active={sel?.id === t.id}
                dot={STATUS_DOT[t.status]} onClick={() => pick(t)} dim />
            ))}
          </>
        )}
      </div>
    </div>
  );

  /* ── Chat panel ────────────────────────────────────────────────── */
  const ChatPanel = !sel ? (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <ArcEmpty message="Select a ticket to view the conversation." />
    </div>
  ) : (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Ticket header */}
      <div style={{ flexShrink:0, padding:'14px 18px', borderBottom:'1px solid var(--c-border)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <h2 style={{ fontFamily:'var(--font-serif)', fontWeight:600, fontSize:'0.95rem', color:'var(--c-cream)', lineHeight:1.35, flex:1, minWidth:0 }}>
            {sel.title}
          </h2>
          <div style={{ display:'flex', gap:5, flexShrink:0, flexWrap:'wrap' }}>
            <ArcBadge status={sel.priority} />
            <ArcBadge status={sel.status} />
          </div>
        </div>
        {sel.description && (
          <p style={{ fontSize:13, color:'var(--c-sub)', lineHeight:1.6, marginTop:8, padding:'8px 12px', borderRadius:8, background:'var(--c-bg)', border:'1px solid var(--c-border)' }}>
            {sel.description}
          </p>
        )}
      </div>

      {/* Thread */}
      <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, scrollbarWidth:'thin', scrollbarColor:'rgba(201,168,76,.12) transparent' }}>
        {loadingC && <p style={{ fontSize:12, color:'var(--c-sub)' }}>Loading…</p>}
        {!loadingC && comments.length === 0 && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--c-sub)', fontSize:13, textAlign:'center' }}>
              No messages yet. Our team will respond shortly.
            </p>
          </div>
        )}
        {comments.map((c, i) => {
          const mine = c.author_id === sel.client_id;
          return (
            <motion.div key={c.id}
              initial={{ opacity:0, x: mine ? 8 : -8 }}
              animate={{ opacity:1, x:0 }}
              transition={{ delay: i * 0.03 }}
              style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth:'80%' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>
                    {mine ? 'You' : 'Support'} · {relTime(c.created_at)}
                  </span>
                </div>
                <div style={{ padding:'10px 14px', borderRadius:14, fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap', background: mine ? 'rgba(201,168,76,.12)' : 'var(--c-card)', border:`1px solid ${mine ? 'rgba(201,168,76,.25)' : 'var(--c-border)'}`, color:'var(--c-cream)' }}>
                  {c.message}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {!isClosed ? (
        <div style={{ flexShrink:0, padding:'10px 16px', borderTop:'1px solid var(--c-border)', background:'var(--c-surface)' }}>
          {err && <ArcAlert type="error" message={err} />}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <ArcTextarea
              style={{ flex:1, resize:'none' }} rows={2}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Send a message…"
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send(); }}
            />
            <ArcButton variant="gold" onClick={send} loading={isPend} size="md" style={{ flexShrink:0 }}>
              <SendIcon />
            </ArcButton>
          </div>
          <p style={{ fontSize:10, color:'var(--c-muted)', fontFamily:'var(--font-mono)', marginTop:4 }}>Ctrl+Enter to send</p>
        </div>
      ) : (
        <div style={{ flexShrink:0, padding:'12px 16px', borderTop:'1px solid var(--c-border)', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-serif)', fontStyle:'italic', color:'var(--c-sub)', fontSize:13 }}>
            Ticket {sel.status.toLowerCase()}. Raise a new ticket for further help.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
        <ArcPageHeader
          eyebrow="ARC IT Solutions"
          title="Support" italic="Tickets"
          sub="Raise issues and track responses from your project team."
          action={<ArcButton variant="gold" size="sm" onClick={() => setShowCreate(true)}>+ New Ticket</ArcButton>}
        />

        {/* ── Desktop: side-by-side ─────────────────────────────── */}
        <div className="hide-mobile" style={{ display:'flex', flex:1, overflow:'hidden' }}>
          <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid var(--c-border)', background:'var(--c-surface)' }}>
            {ListPanel}
          </div>
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {ChatPanel}
          </div>
        </div>

        {/* ── Mobile: tab switcher ──────────────────────────────── */}
        <div className="show-mobile" style={{ display:'none', flex:1, flexDirection:'column', overflow:'hidden' }}>
          <AnimatePresence mode="wait" initial={false}>
            {mobileTab === 'list' ? (
              <motion.div key="list"
                initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }}
                transition={{ duration:0.18 }}
                style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--c-surface)' }}>
                {ListPanel}
              </motion.div>
            ) : (
              <motion.div key="chat"
                initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:16 }}
                transition={{ duration:0.18 }}
                style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--c-bg)' }}>
                {/* Back button */}
                <button onClick={() => setMobileTab('list')}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--c-surface)', border:'none', borderBottom:'1px solid var(--c-border)', cursor:'pointer', color:'var(--c-gold)', fontSize:13, fontWeight:500, width:'100%', textAlign:'left', flexShrink:0 }}>
                  <BackIcon /> Back to tickets
                </button>
                {ChatPanel}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <ArcModal title="Raise a Support Ticket" sub="Our team typically responds within a few hours." onClose={() => setShowCreate(false)}>
          {err && <ArcAlert type="error" message={err} />}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <ArcInput label="Title *" value={cf.title} onChange={e => setCf({ ...cf, title: e.target.value })} placeholder="Short summary of your issue" />
            <ArcTextarea label="Description" rows={3} value={cf.description} onChange={e => setCf({ ...cf, description: e.target.value })} placeholder="Steps to reproduce, expected vs actual…" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <ArcSelect label="Priority" value={cf.priority} onChange={e => setCf({ ...cf, priority: e.target.value })}>
                {PRIS.map(p => <option key={p} value={p}>{p}</option>)}
              </ArcSelect>
              <ArcSelect label="Project *" value={cf.project_id} onChange={e => setCf({ ...cf, project_id: e.target.value })}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </ArcSelect>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <ArcButton variant="gold" onClick={create} loading={isPend} size="lg" style={{ flex:1, justifyContent:'center' }}>
              Raise Ticket
            </ArcButton>
            <ArcButton variant="ghost" onClick={() => setShowCreate(false)} size="lg">Cancel</ArcButton>
          </div>
        </ArcModal>
      )}
    </>
  );
}

function TicketRow({ ticket, active, dot, onClick, dim = false }: {
  ticket: Ticket; active: boolean; dot: string; onClick: () => void; dim?: boolean;
}) {
  return (
    <motion.button onClick={onClick} whileHover={{ x: active ? 0 : 2 }}
      style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', border:'none', borderBottom:'1px solid var(--c-border)', borderLeft:`2px solid ${active ? 'var(--c-gold)' : 'transparent'}`, background: active ? 'rgba(201,168,76,.07)' : 'transparent', cursor:'pointer', opacity: dim ? 0.6 : 1 }}>
      <div style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0, marginTop:4 }} />
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight: active ? 500 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: active ? 'var(--c-cream)' : 'var(--c-sub)', marginBottom:5 }}>
          {ticket.title}
        </p>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', alignItems:'center' }}>
          <ArcBadge status={ticket.priority} />
          <ArcBadge status={ticket.status} />
          <span style={{ fontSize:10, fontFamily:'var(--font-mono)', color:'var(--c-dim)' }}>
            {relTime(ticket.created_at)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
