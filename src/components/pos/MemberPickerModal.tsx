'use client';
import { useEffect, useState } from 'react';
import { Search, UserPlus, User, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button, Input } from '@/components/ui';
import { memberService, getErrorMessage } from '@/services';
import type { Member } from '@/types';
import type { CartMember } from '@/stores/cartStore';

interface Props {
  open: boolean;
  onClose: () => void;
  selected: CartMember | null;
  onSelect: (member: CartMember | null) => void;
}

const emptyQuick = { nama: '', no_hp: '', email: '', alamat: '' };

// Pilih member existing (search) atau buat baru langsung dari halaman kasir
// (Quick Create Member). Dipanggil hanya untuk merchant plan PRO.
export function MemberPickerModal({ open, onClose, selected, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickMode, setQuickMode] = useState(false);
  const [quickForm, setQuickForm] = useState(emptyQuick);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) { setQuery(''); setQuickMode(false); setQuickForm(emptyQuick); return; }
    search('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function search(q: string) {
    setLoading(true);
    try {
      const res = await memberService.list({ search: q || undefined, status: 1, limit: 20 });
      setResults(res.data || []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function pick(m: Member) {
    onSelect({ id: m.ID, nama: m.NAMA });
    onClose();
  }

  function clearMember() {
    onSelect(null);
    onClose();
  }

  async function submitQuickCreate() {
    if (!quickForm.nama.trim()) { toast.error('Nama member wajib diisi'); return; }
    if (!quickForm.no_hp.trim()) { toast.error('Nomor HP wajib diisi'); return; }
    setCreating(true);
    try {
      const member = await memberService.create(quickForm);
      toast.success('Member baru dibuat & dipilih');
      onSelect({ id: member.ID, nama: member.NAMA });
      onClose();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setCreating(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={quickMode ? 'Tambah Member Baru' : 'Pilih Member'} size="sm">
      {quickMode ? (
        <div className="space-y-3">
          <Input label="Nama member" value={quickForm.nama} onChange={(e) => setQuickForm((f) => ({ ...f, nama: e.target.value }))} placeholder="mis. Budi Santoso" />
          <Input label="No. HP" value={quickForm.no_hp} onChange={(e) => setQuickForm((f) => ({ ...f, no_hp: e.target.value }))} placeholder="081234567890" />
          <Input label="Email (opsional)" type="email" value={quickForm.email} onChange={(e) => setQuickForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Alamat (opsional)" value={quickForm.alamat} onChange={(e) => setQuickForm((f) => ({ ...f, alamat: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setQuickMode(false)} disabled={creating}>Batal</Button>
            <Button onClick={submitQuickCreate} loading={creating}>Simpan & Pilih</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white pl-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama / no. HP / kode member..."
              className="h-full w-full bg-transparent px-2 text-sm outline-none placeholder:text-slate-300"
            />
          </div>

          <Button variant="outline" className="w-full" onClick={() => setQuickMode(true)}>
            <UserPlus className="h-4 w-4" /> Tambah Member Baru
          </Button>

          {selected && (
            <button
              onClick={clearMember}
              className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <span>Hapus member terpilih ({selected.nama})</span>
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {loading && <p className="py-4 text-center text-sm text-slate-400">Memuat...</p>}
            {!loading && results.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Tidak ada member ditemukan</p>}
            {results.map((m) => (
              <button
                key={m.ID}
                onClick={() => pick(m)}
                className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left text-sm transition-colors hover:border-primary hover:bg-brand-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-primary">
                  <User className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{m.NAMA}</span>
                  <span className="block truncate text-xs text-slate-500">{m.NO_HP}{m.KODE_MEMBER ? ` · ${m.KODE_MEMBER}` : ''}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
