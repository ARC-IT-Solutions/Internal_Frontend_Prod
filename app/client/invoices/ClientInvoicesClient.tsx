'use client';

import { useState } from 'react';
import type { Invoice, Payment } from '@/types';
import { ArcBadge, ArcCard, ArcPageHeader, ArcInfoRow, ArcBtn, ArcAlert, ArcEmpty } from '@/components/arc-ui';
import { money, shortDate, fullDate } from '@/lib/utils';
import { getInvoiceDownloadAction } from '@/app/actions';
import { Download, FileText } from 'lucide-react';

type Rich = Invoice & { payments: Payment[] };

const STATUS_ORDER = ['OVERDUE','PARTIALLY_PAID','SENT','DRAFT','PAID','CANCELLED'];

export function ClientInvoicesClient({ invoices }: { invoices: Rich[] }) {
  const sorted = [...invoices].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  const [selected,    setSelected]    = useState<Rich | null>(sorted[0] ?? null);
  const [downloading, setDownloading] = useState(false);
  const [error,       setError]       = useState('');

  async function handleDownload() {
    if (!selected) return;
    setDownloading(true); setError('');
    const r = await getInvoiceDownloadAction(selected.id);
    setDownloading(false);
    if (r.ok) window.open((r.data as { signed_url: string }).signed_url, '_blank');
    else setError(r.error);
  }

  const totalPaid  = selected?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
  const paidPct    = selected ? Math.min(100, Math.round((totalPaid / selected.total_amount) * 100)) : 0;
  const outstanding = selected ? Math.max(0, selected.total_amount - totalPaid) : 0;
  const unpaid     = ['SENT','PARTIALLY_PAID','OVERDUE'].includes(selected?.status ?? '');

  const LEFT_BORDER: Record<string, string> = {
    OVERDUE: '#e86b6b', PARTIALLY_PAID: 'var(--arc-gold)', SENT: 'var(--arc-mute)',
    DRAFT: 'var(--arc-dim)', PAID: '#5cb85c', CANCELLED: 'var(--arc-dim)',
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ArcPageHeader title="Invoices" italic="& Billing"
        sub="Your complete billing history with ARC IT Solutions." />

      <div className="flex flex-1 overflow-hidden">
        {/* Invoice list */}
        <div className="w-80 flex-shrink-0 overflow-y-auto"
          style={{ borderRight: '1px solid var(--arc-border)', background: 'var(--arc-bg-raised)' }}>
          {invoices.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16"><ArcEmpty message="No invoices yet." /></div>
          )}
          {sorted.map(inv => (
            <button key={inv.id} onClick={() => setSelected(inv)}
              className="w-full text-left flex transition-all"
              style={{
                borderBottom: '1px solid var(--arc-border)',
                borderLeft: selected?.id === inv.id ? `3px solid var(--arc-gold)` : '3px solid transparent',
                background: selected?.id === inv.id ? 'rgba(201,168,76,.05)' : 'transparent',
              }}>
              <div className="w-1 flex-shrink-0" style={{ background: LEFT_BORDER[inv.status] ?? 'var(--arc-dim)' }} />
              <div className="flex-1 px-4 py-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--arc-gold)' }}>{inv.invoice_number}</span>
                  <ArcBadge status={inv.status} />
                </div>
                <p className="text-[13px] truncate mb-2" style={{ color: 'var(--arc-cream)', fontWeight: selected?.id === inv.id ? 500 : 400 }}>{inv.title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold font-mono"
                    style={{ color: inv.status === 'OVERDUE' ? '#e86b6b' : 'var(--arc-cream)' }}>
                    {money(inv.total_amount, inv.currency)}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--arc-mute)' }}>Due {shortDate(inv.due_date)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        {!selected ? (
          <div className="flex-1 flex items-center justify-center"><ArcEmpty message="Select an invoice to view details." /></div>
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {error && <ArcAlert type="error" message={error} />}

            {/* Invoice header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--arc-gold)' }}>{selected.invoice_number}</span>
                  <ArcBadge status={selected.status} />
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--arc-ivory)', fontWeight: 700, fontSize: '1.2rem' }}>
                  {selected.title}
                </h2>
                {selected.description && <p className="text-sm mt-1" style={{ color: 'var(--arc-mute)' }}>{selected.description}</p>}
              </div>
              {(selected.file_url || true) && (
                <ArcBtn variant="outline" onClick={handleDownload} loading={downloading} className="flex-shrink-0 h-9 text-sm">
                  <Download size={13} /> Download PDF
                </ArcBtn>
              )}
            </div>

            {/* Payment progress — for unpaid invoices */}
            {unpaid && (
              <ArcCard>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--arc-mute)' }}>Amount Due</p>
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 700, color: selected.status === 'OVERDUE' ? '#e86b6b' : 'var(--arc-gold)' }}>
                      {money(outstanding, selected.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--arc-mute)' }}>Total Invoice</p>
                    <p className="text-lg font-semibold font-mono" style={{ color: 'var(--arc-cream)' }}>
                      {money(selected.total_amount, selected.currency)}
                    </p>
                  </div>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: 'var(--arc-dim)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${paidPct}%`, background: 'linear-gradient(90deg,var(--arc-gold),var(--arc-gold-lt))' }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--arc-mute)' }}>{money(totalPaid, selected.currency)} paid</span>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--arc-gold)' }}>{paidPct}%</span>
                </div>
              </ArcCard>
            )}

            {/* Overdue warning */}
            {selected.status === 'OVERDUE' && (
              <div className="px-5 py-4 rounded-xl" style={{ background: 'rgba(232,107,107,.07)', border: '1px solid rgba(232,107,107,.2)' }}>
                <p className="text-sm" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#e86b6b' }}>
                  This invoice is past its due date. Please contact your project manager to arrange payment.
                </p>
              </div>
            )}

            {/* Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] tracking-[.14em] uppercase" style={{ color: 'var(--arc-mute)' }}>Invoice Details</span>
                <div className="h-px flex-1" style={{ background: 'var(--arc-border)' }} />
              </div>
              <table className="w-full"><tbody>
                <ArcInfoRow label="Amount">{money(selected.amount, selected.currency)}</ArcInfoRow>
                <ArcInfoRow label={`Tax (${selected.tax_rate}%)`}>{money(selected.tax_amount, selected.currency)}</ArcInfoRow>
                <ArcInfoRow label="Total">
                  <span className="font-mono font-bold" style={{ color: 'var(--arc-ivory)', fontSize: '1rem' }}>
                    {money(selected.total_amount, selected.currency)}
                  </span>
                </ArcInfoRow>
                <ArcInfoRow label="Due Date">{shortDate(selected.due_date)}</ArcInfoRow>
                <ArcInfoRow label="Issued">{fullDate(selected.created_at)}</ArcInfoRow>
                {selected.paid_at && <ArcInfoRow label="Paid On">{fullDate(selected.paid_at)}</ArcInfoRow>}
                {selected.notes && <ArcInfoRow label="Notes">{selected.notes}</ArcInfoRow>}
              </tbody></table>
            </div>

            {/* Payment history */}
            {selected.payments.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] tracking-[.14em] uppercase" style={{ color: 'var(--arc-mute)' }}>
                    Payment History ({selected.payments.length} payment{selected.payments.length > 1 ? 's' : ''})
                  </span>
                  <div className="h-px flex-1" style={{ background: 'var(--arc-border)' }} />
                </div>
                <div className="space-y-2">
                  {selected.payments.map(pay => (
                    <div key={pay.id} className="flex items-center justify-between px-5 py-3.5 rounded-xl"
                      style={{ background: 'var(--arc-bg-card)', border: '1px solid var(--arc-border)', borderLeft: '3px solid #5cb85c' }}>
                      <div>
                        <p className="text-[13px] font-semibold font-mono" style={{ color: 'var(--arc-cream)' }}>
                          {money(pay.amount, selected.currency)}
                        </p>
                        <p className="text-[11px] mt-0.5 font-mono" style={{ color: 'var(--arc-mute)' }}>
                          {shortDate(pay.payment_date)}
                          {pay.payment_method ? ` · ${pay.payment_method.replace('_', ' ')}` : ''}
                          {pay.reference ? ` · ${pay.reference}` : ''}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#5cb85c' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
