'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Ticket, TicketComment, Project } from '@/types';
import { ArcBadge, ArcModal, ArcLabel, ArcInput, ArcTextarea, ArcSelect, ArcBtn, ArcAlert, ArcEmpty, ArcPageHeader } from '@/components/arc-ui';
import { relTime } from '@/lib/utils';
import { createTicketAction, addCommentAction } from '@/app/actions';
import { Plus, Send, Ticket as TicketIcon } from 'lucide-react';

const PRIORITIES  = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const STATUS_DOT: Record<string, string> = {
  OPEN: '#e86b6b', IN_PROGRESS: 'var(--arc-gold)', WAITING_CLIENT: 'var(--arc-gold-lt)',
  RESOLVED: '#5cb85c', CLOSED: 'var(--arc-dim)',
};

export function ClientTicketsClient({
  tickets, projects,
}: {
  tickets: Ticket[];
  projects: Project[];
}) {
  const router                       = useRouter();
  const [selected, setSelected]      = useState<Ticket | null>(tickets[0] ?? null);
  const [comments, setComments]      = useState<TicketComment[]>([]);
  const [loadingC, setLoadingC]      = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error,   setError]          = useState('');
  const [newMsg, setNewMsg]          = useState('');
  const [showCreate, setShowCreate]  = useState(false);
  const [cf, setCf]                  = useState({ title: '', description: '', priority: 'MEDIUM', project_id: projects[0]?.id ?? '' });
  const bottomRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  async function loadComments(id: string) {
    setLoadingC(true);
    try {
      const res  = await fetch(`/api/proxy?path=tickets/${id}/comments`);
      const data = await res.json();
      setComments((Array.isArray(data) ? data : []).filter((c: TicketComment) => !c.is_internal));
    } catch { setComments([]); }
    setLoadingC(false);
  }

  async function selectTicket(t: Ticket) {
    setSelected(t);
    await loadComments(t.id);
  }

  async function handleSend() {
    if (!selected || !newMsg.trim()) return;
    startTransition(async () => {
      const r = await addCommentAction(selected.id, newMsg.trim(), false);
      if (r.ok) { setComments(p => [...p, r.data as TicketComment]); setNewMsg(''); }
      else setError(r.error);
    });
  }

  async function handleCreate() {
    if (!cf.title.trim() || !cf.project_id) return setError('Title and project are required.');
    startTransition(async () => {
      const r = await createTicketAction({ title: cf.title.trim(), description: cf.description.trim() || undefined, priority: cf.priority, project_id: cf.project_id });
      if (r.ok) { setShowCreate(false); setCf({ title: '', description: '', priority: 'MEDIUM', project_id: projects[0]?.id ?? '' }); router.refresh(); }
      else setError(r.error);
    });
  }

  const openTickets   = tickets.filter(t => !['RESOLVED','CLOSED'].includes(t.status));
  const closedTickets = tickets.filter(t => ['RESOLVED','CLOSED'].includes(t.status));
  const isClosed      = ['RESOLVED','CLOSED'].includes(selected?.status ?? '');

  return (
    <>
      <div className="flex flex-col flex-1 overflow-hidden">
        <ArcPageHeader title="Support" italic="Tickets"
          sub="Raise issues, ask questions, and track responses from your project team."
          action={
            <ArcBtn variant="gold" onClick={() => setShowCreate(true)} className="h-9 px-5 text-sm">
              <Plus size={14} /> New Ticket
            </ArcBtn>
          }
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Ticket list */}
          <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
            style={{ borderRight: '1px solid var(--arc-border)', background: 'var(--arc-bg-raised)' }}>

            {tickets.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
                <TicketIcon size={28} style={{ color: 'var(--arc-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--arc-mute)' }}>No tickets yet.</p>
                <ArcBtn variant="gold" onClick={() => setShowCreate(true)} className="text-sm mt-1">Raise your first ticket</ArcBtn>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {openTickets.map(t => (
                <TicketRow key={t.id} ticket={t} active={selected?.id === t.id} onClick={() => selectTicket(t)} dot={STATUS_DOT[t.status]} />
              ))}
              {closedTickets.length > 0 && (
                <>
                  <div className="px-5 py-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--arc-dim)', borderTop: '1px solid var(--arc-border)' }}>
                    Closed / Resolved
                  </div>
                  {closedTickets.map(t => (
                    <TicketRow key={t.id} ticket={t} active={selected?.id === t.id} onClick={() => selectTicket(t)} dot={STATUS_DOT[t.status]} dim />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Conversation */}
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <ArcEmpty message="Select a ticket to view the conversation." />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Ticket header */}
              <div className="flex-shrink-0 px-7 py-5" style={{ borderBottom: '1px solid var(--arc-border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: 'var(--arc-cream)', fontFamily: 'var(--font-serif)', lineHeight: 1.3 }}>{selected.title}</h2>
                    <p className="text-[12px] mt-1" style={{ color: 'var(--arc-mute)' }}>
                      {selected.project_id ? `Project ID: ${selected.project_id.slice(0,12)}…` : 'No project linked'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <ArcBadge status={selected.priority} />
                    <ArcBadge status={selected.status} />
                  </div>
                </div>
                {selected.description && (
                  <p className="text-sm mt-3 px-4 py-3 rounded-xl" style={{ color: 'var(--arc-mute)', background: 'var(--arc-bg)', border: '1px solid var(--arc-border)', lineHeight: 1.65 }}>
                    {selected.description}
                  </p>
                )}
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
                {loadingC && <p className="text-sm" style={{ color: 'var(--arc-mute)' }}>Loading conversation…</p>}
                {!loadingC && comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm" style={{ color: 'var(--arc-mute)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                      No messages yet. Your team will respond shortly.
                    </p>
                  </div>
                )}
                {comments.map(c => {
                  const isMe = c.author_id === selected.client_id;
                  return (
                    <div key={c.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[76%]">
                        <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-[10px]" style={{ color: 'var(--arc-mute)' }}>{isMe ? 'You' : 'Support Team'}</span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--arc-dim)' }}>{relTime(c.created_at)}</span>
                        </div>
                        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                          style={{
                            background: isMe ? 'rgba(201,168,76,.12)' : 'var(--arc-bg-card)',
                            border: `1px solid ${isMe ? 'rgba(201,168,76,.25)' : 'var(--arc-border)'}`,
                            color: 'var(--arc-cream)',
                          }}>
                          {c.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              {!isClosed ? (
                <div className="flex-shrink-0 px-7 py-4" style={{ borderTop: '1px solid var(--arc-border)', background: 'var(--arc-bg-raised)' }}>
                  {error && <ArcAlert type="error" message={error} />}
                  <div className="flex gap-3 items-end">
                    <ArcTextarea
                      className="flex-1 resize-none"
                      rows={2}
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      placeholder="Send a message to your support team…"
                      onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSend(); }}
                    />
                    <ArcBtn variant="gold" onClick={handleSend} loading={isPending} className="h-10 px-4 flex-shrink-0">
                      <Send size={14} />
                    </ArcBtn>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: 'var(--arc-dim)' }}>Ctrl + Enter to send</p>
                </div>
              ) : (
                <div className="flex-shrink-0 px-7 py-4 text-center" style={{ borderTop: '1px solid var(--arc-border)' }}>
                  <p className="text-sm" style={{ color: 'var(--arc-mute)', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
                    This ticket is {selected.status.toLowerCase()}. Raise a new ticket if you need further help.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create ticket modal */}
      {showCreate && (
        <ArcModal title="Raise a Support Ticket" sub="Describe your issue clearly. Our team typically responds within a few hours." onClose={() => setShowCreate(false)}>
          {error && <ArcAlert type="error" message={error} />}
          <div className="space-y-4">
            <div><ArcLabel>Title *</ArcLabel><ArcInput className="w-full mt-1.5" value={cf.title} onChange={e => setCf(f => ({ ...f, title: e.target.value }))} placeholder="Short summary of the issue" /></div>
            <div><ArcLabel>Description</ArcLabel><ArcTextarea className="w-full mt-1.5" rows={3} value={cf.description} onChange={e => setCf(f => ({ ...f, description: e.target.value }))} placeholder="Steps to reproduce, expected vs actual behavior, screenshots…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><ArcLabel>Priority</ArcLabel>
                <ArcSelect className="w-full mt-1.5" value={cf.priority} onChange={e => setCf(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </ArcSelect>
              </div>
              <div><ArcLabel>Project *</ArcLabel>
                <ArcSelect className="w-full mt-1.5" value={cf.project_id} onChange={e => setCf(f => ({ ...f, project_id: e.target.value }))}>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </ArcSelect>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <ArcBtn variant="gold" onClick={handleCreate} loading={isPending} className="flex-1 h-11 justify-center text-sm">Raise Ticket</ArcBtn>
            <ArcBtn variant="ghost" onClick={() => setShowCreate(false)} className="h-11">Cancel</ArcBtn>
          </div>
        </ArcModal>
      )}
    </>
  );
}

function TicketRow({ ticket, active, onClick, dot, dim = false }: {
  ticket: Ticket; active: boolean; onClick: () => void; dot: string; dim?: boolean;
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all"
      style={{
        borderBottom: '1px solid var(--arc-border)',
        borderLeft: active ? '2px solid var(--arc-gold)' : '2px solid transparent',
        background: active ? 'rgba(201,168,76,.05)' : 'transparent',
        opacity: dim ? 0.65 : 1,
      }}>
      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: dot }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] truncate" style={{ color: active ? 'var(--arc-cream)' : 'var(--arc-mute)', fontWeight: active ? 500 : 400 }}>{ticket.title}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <ArcBadge status={ticket.priority} />
          <ArcBadge status={ticket.status} />
          <span className="text-[10px] font-mono" style={{ color: 'var(--arc-dim)' }}>{relTime(ticket.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
