'use client';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title = 'Konfirmasi', message = 'Apakah Anda yakin?',
  confirmLabel = 'Ya, lanjutkan', loading, danger = true,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-300' : 'bg-brand-50 text-brand-600 dark:bg-accent/15 dark:text-accent'}`}>
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="pt-1.5 text-sm leading-6 text-slate-600">{message}</p>
      </div>
    </Modal>
  );
}
