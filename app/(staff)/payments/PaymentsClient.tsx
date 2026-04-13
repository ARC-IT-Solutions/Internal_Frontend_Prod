'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Invoice, Payment, User } from '@/types';
import { Badge, Btn, Select, Input, Textarea, Modal, Alert, SectionLabel } from '@/components/ui';
import { PageShell, ListHeader, EmptyDetail, DetailHeader, DetailBody, Section } from '@/components/modules/PageShell';
import { money, shortDate, fullDate, relTime } from '@/lib/utils';
import {
  recordPaymentAction,
  deletePaymentAction,
  getInvoiceDownloadAction,
} from '@/app/actions';
import { CreditCard, Plus, Trash2, Download, TrendingUp } from 'lucide-react';

type RichInvoice = Invoice & { payments: Payment[] };

const PAY_METHODS = ['bank_transfer', 'card', 'upi', 'cash', 'other'] as const;

const STATUS_BAR: Record<string, string> = {
  DRAFT:          'bg-[#484f58]',
  SENT:           'bg-[#388bfd]',
  PARTIALLY_PAID: 'bg-[#f0883e]',
  PAID:           'bg-[#3fb950]',
  OVERDUE:        'bg-[#f85149]',
  CANCELLED:      'bg-[#484f58]',
};

export function PaymentsClient({
  invoices,
  currentUser,
  total,
}: {
  invoices: RichInvoice[];
  currentUser: User;
  total: number;
}) {
  const router = useRouter();
  const [selected, setSelected]      = useState<RichInvoice | null>(invoices[0] ?? null);
  const [isPending, startTransition] = useTransition();
  const [error,   setError]          = useState('');
  const [success, setSuccess]        = useState('');
  const [showRecord, setShowRecord]  = useState(false);

  const [pf, setPf] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const isEmployee = currentUser.role !== 'client';

  function notify(msg: string, type: 'ok' | 'err') {
    type === 'ok' ? (setSuccess(msg), setError('')) : (setError(msg), setSuccess(''));
    setTimeout(() => { setSuccess(''); setError(''); }, 5000);
  }

  async function handleRecord() {
    if (!selected || !pf.amount || !pf.payment_date)
      return setError('Amount and payment date are required.');
    const amount = parseFloat(pf.amount);
    if (isNaN(amount) || amount <= 0) return setError('Enter a valid amount.');

    startTransition(async () => {
      const r = await recordPaymentAction({
        invoice_id:     selected.id,
        amount,
        payment_date:   pf.payment_date,
        payment_method: pf.payment_method as never,
        reference:      pf.reference || undefined,
        notes:          pf.notes     || undefined,
      });
      if (r.ok) {
        notify('Payment recorded. Invoice status updated automatically.', 'ok');
        setShowRecord(false);
        setPf({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', reference: '', notes: '' });
        router.refresh();
      } else notify(r.error, 'err');
    });
  }

  async function handleDelete(pay: Payment) {
    if (!confirm('Delete this payment? Invoice status will recalculate.')) return;
    startTransition(async () => {
      const r = await deletePaymentAction(pay.id);
      if (r.ok) { notify('Payment deleted. Status recalculated.', 'ok'); router.refresh(); }
      else notify(r.error, 'err');
    });
  }

  async function handleDownload() {
    if (!selected) return;
    const r = await getInvoiceDownloadAction(selected.id);
    if (r.ok) window.open((r.data as { signed_url: string }).signed_url, '_blank');
    else notify((r as { error: string }).error, 'err');
  }

  const totalPaid   = selected?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const outstanding = selected ? Math.max(0, selected.total_amount - totalPaid) : 0;
  const paidPct     = selected ? Math.min(100, Math.round((totalPaid / selected.total_amount) * 100)) : 0;
  const canRecord   = isEmployee && selected && !['PAID', 'CANCELLED'].includes(selected.status);

  // Summary stats across all invoices
  const totalRevenue   = invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const totalOverdue   = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.total_amount, 0);

  return (
    <>
      <PageShell
        listSlot={
          <>
            <ListHeader title="Payments" count={total} />

            {/* Summary stats */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-px border-b border-white/[0.04]"
              style={{ background: 'rgba(255,255,255,.04)' }}>
              {[
                { label: 'Billed',     value: money(totalRevenue),   color: '#e6edf3' },
                { label: 'Collected',  value: money(totalCollected), color: '#3fb950' },
                { label: 'Overdue',    value: money(totalOverdue),   color: totalOverdue > 0 ? '#f85149' : '#484f58' },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-3 py-3 bg-[#161b22]">
                  <div className="text-[9px] uppercase tracking-widest text-[#484f58] mb-0.5">{label}</div>
                  <div className="text-[12px] font-mono font-semibold" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {invoices.length === 0 && (
                <div className="flex items-center justify-center py-12 text-[#484f58] text-sm">
                  No invoices in billing states
                </div>
              )}
              {invoices.map(inv => {
                const paid   = inv.payments.reduce((s, p) => s + p.amount, 0);
                const pct    = Math.min(100, Math.round((paid / inv.total_amount) * 100));
                const active = selected?.id === inv.id;
                return (
                  <button key={inv.id} onClick={() => setSelected(inv)}
                    className={`w-full text-left flex border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${active ? 'bg-white/[0.05]' : ''}`}>
                    <div className={`w-[3px] flex-shrink-0 ${STATUS_BAR[inv.status] ?? 'bg-[#484f58]'}`} />
                    <div className="flex-1 px-3 py-3 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-[#484f58]">{inv.invoice_number}</span>
                        <Badge status={inv.status} />
                      </div>
                      <p className="text-[13px] text-[#e6edf3] truncate mb-2">{inv.title}</p>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono text-[#3fb950]">{money(paid)}</span>
                        <span className="text-[11px] font-mono text-[#484f58]">/ {money(inv.total_amount)}</span>
                      </div>
                      <div className="h-[2px] bg-[#21262d] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: pct === 100 ? '#3fb950' : '#f0883e',
                          }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        }
        detailSlot={
          !selected ? (
            <EmptyDetail text="Select an invoice to manage its payments" />
          ) : (
            <>
              <DetailHeader
                title={selected.title}
                sub={`${selected.invoice_number} · Due ${shortDate(selected.due_date)}`}
                badges={<Badge status={selected.status} />}
                actions={
                  <>
                    {selected.file_url && (
                      <Btn variant="ghost" onClick={handleDownload} className="text-[12px]">
                        <Download size={12} /> PDF
                      </Btn>
                    )}
                    {canRecord && (
                      <Btn variant="success" onClick={() => setShowRecord(true)}>
                        <Plus size={13} /> Record Payment
                      </Btn>
                    )}
                  </>
                }
              />

              <DetailBody>
                {(error || success) && (
                  <Alert type={error ? 'error' : 'success'} message={error || success} />
                )}

                {/* Payment progress */}
                <Section label="Payment Progress">
                  <div className="bg-[#161b22] border border-white/[0.08] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-[#484f58] mb-1">Collected</div>
                        <div className="text-xl font-mono font-semibold text-[#3fb950]">{money(totalPaid, selected.currency)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-[#484f58] mb-1">
                          {outstanding > 0 ? 'Outstanding' : 'Total'}
                        </div>
                        <div className={`text-xl font-mono font-semibold ${outstanding > 0 ? 'text-[#f85149]' : 'text-[#e6edf3]'}`}>
                          {outstanding > 0 ? money(outstanding, selected.currency) : money(selected.total_amount, selected.currency)}
                        </div>
                      </div>
                    </div>
                    <div className="h-2.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${paidPct}%`, background: paidPct === 100 ? '#3fb950' : 'linear-gradient(90deg,#f0883e,#f0c03e)' }} />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[11px] font-mono text-[#484f58]">
                        {paidPct}% paid · {selected.payments.length} payment{selected.payments.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[11px] font-mono text-[#484f58]">
                        Total: {money(selected.total_amount, selected.currency)}
                      </span>
                    </div>
                  </div>
                </Section>

                {/* Payment history */}
                <Section label={`Payment History (${selected.payments.length})`}>
                  {selected.payments.length === 0 ? (
                    <p className="text-sm text-[#484f58] italic">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.payments.map((pay, i) => (
                        <div key={pay.id}
                          className="flex items-center justify-between bg-[#161b22] border border-white/[0.08] rounded-xl px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#3fb950] mt-1.5 flex-shrink-0" />
                            <div>
                              <div className="text-[13px] font-mono font-semibold text-[#e6edf3]">
                                {money(pay.amount, selected.currency)}
                              </div>
                              <div className="text-[11px] text-[#484f58] mt-0.5">
                                {shortDate(pay.payment_date)}
                                {pay.payment_method && ` · ${pay.payment_method.replace('_', ' ')}`}
                                {pay.reference && ` · ${pay.reference}`}
                              </div>
                              {pay.notes && <div className="text-[11px] text-[#484f58] mt-0.5 italic">{pay.notes}</div>}
                            </div>
                          </div>
                          {isEmployee && (
                            <Btn variant="danger" className="h-7 px-2"
                              onClick={() => handleDelete(pay)} disabled={isPending}>
                              <Trash2 size={11} />
                            </Btn>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Invoice summary */}
                <Section label="Invoice Details">
                  <table className="w-full"><tbody>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-[11px] text-[#8b949e] w-28">Amount</td>
                      <td className="py-1.5 text-[12px] font-mono text-[#e6edf3]">{money(selected.amount, selected.currency)}</td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-[11px] text-[#8b949e]">Tax ({selected.tax_rate}%)</td>
                      <td className="py-1.5 text-[12px] font-mono text-[#e6edf3]">{money(selected.tax_amount, selected.currency)}</td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-[11px] text-[#8b949e] font-semibold">Total</td>
                      <td className="py-1.5 text-[13px] font-mono font-semibold text-[#e6edf3]">{money(selected.total_amount, selected.currency)}</td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-[11px] text-[#8b949e]">Due Date</td>
                      <td className="py-1.5 text-[12px] text-[#e6edf3]">{shortDate(selected.due_date)}</td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-1.5 pr-4 text-[11px] text-[#8b949e]">Client</td>
                      <td className="py-1.5 text-[11px] font-mono text-[#e6edf3]">{selected.client_id}</td>
                    </tr>
                  </tbody></table>
                </Section>
              </DetailBody>
            </>
          )
        }
      />

      {/* Record payment modal */}
      {showRecord && selected && (
        <Modal title="Record Payment" onClose={() => setShowRecord(false)}>
          <div className="px-4 py-3 rounded-lg mb-4 text-sm bg-[#1c2128] border border-white/[0.08]">
            <div className="flex justify-between">
              <span className="text-[#8b949e]">Invoice total</span>
              <span className="font-mono text-[#e6edf3]">{money(selected.total_amount, selected.currency)}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[#8b949e]">Already paid</span>
              <span className="font-mono text-[#3fb950]">{money(totalPaid, selected.currency)}</span>
            </div>
            <div className="flex justify-between mt-1 font-semibold">
              <span className="text-[#8b949e]">Outstanding</span>
              <span className="font-mono text-[#f85149]">{money(outstanding, selected.currency)}</span>
            </div>
          </div>

          {error && <Alert type="error" message={error} />}

          <div className="space-y-3">
            <div>
              <SectionLabel>Amount Paid *</SectionLabel>
              <Input className="w-full" type="number" step="0.01" min="0"
                value={pf.amount} onChange={e => setPf(p => ({ ...p, amount: e.target.value }))}
                placeholder={String(outstanding)} />
            </div>
            <div>
              <SectionLabel>Payment Date *</SectionLabel>
              <Input className="w-full" type="date"
                value={pf.payment_date} onChange={e => setPf(p => ({ ...p, payment_date: e.target.value }))} />
            </div>
            <div>
              <SectionLabel>Payment Method</SectionLabel>
              <Select className="w-full"
                value={pf.payment_method} onChange={e => setPf(p => ({ ...p, payment_method: e.target.value }))}>
                {PAY_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div>
              <SectionLabel>Reference / Transaction ID</SectionLabel>
              <Input className="w-full" placeholder="e.g. TXN-HDFC-20240122"
                value={pf.reference} onChange={e => setPf(p => ({ ...p, reference: e.target.value }))} />
            </div>
            <div>
              <SectionLabel>Notes</SectionLabel>
              <Textarea className="w-full" rows={2}
                value={pf.notes} onChange={e => setPf(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <Btn variant="success" onClick={handleRecord} loading={isPending} className="flex-1 justify-center">
              <CreditCard size={13} /> Record Payment
            </Btn>
            <Btn variant="ghost" onClick={() => setShowRecord(false)}>Cancel</Btn>
          </div>

          <p className="text-[11px] text-[#484f58] mt-3">
            Invoice status updates automatically: partial → PARTIALLY_PAID, full → PAID
          </p>
        </Modal>
      )}
    </>
  );
}
