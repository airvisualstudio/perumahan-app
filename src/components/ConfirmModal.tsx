import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, CheckCircle, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
}> = {
  danger: {
    icon: <Trash2 size={22} />,
    iconBg: 'var(--danger-light)',
    iconColor: 'var(--danger)',
    confirmClass: 'btn btn-danger',
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    iconBg: 'var(--warning-light)',
    iconColor: 'var(--warning)',
    confirmClass: 'btn btn-warning',
  },
  info: {
    icon: <Info size={22} />,
    iconBg: 'var(--primary-light)',
    iconColor: 'var(--primary)',
    confirmClass: 'btn btn-primary',
  },
  success: {
    icon: <CheckCircle size={22} />,
    iconBg: 'var(--success-light)',
    iconColor: 'var(--success)',
    confirmClass: 'btn btn-success',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onCancel}
        >
          <motion.div
            className="modal-content confirm-modal-content"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, overflow: 'hidden' }}
          >
            {/* Colored top accent bar */}
            <div
              style={{
                height: 4,
                background: config.iconColor,
                width: '100%',
              }}
            />

            <div style={{ padding: '28px 28px 20px' }}>
              {/* Icon + close */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: config.iconBg,
                    color: config.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </motion.div>
                <button
                  className="btn btn-ghost"
                  style={{ minHeight: 'unset', padding: 6, borderRadius: '50%' }}
                  onClick={onCancel}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: 'var(--text-main)' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {message}
                </p>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              className="modal-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              style={{ gap: 10 }}
            >
              <button className="btn btn-ghost" onClick={onCancel}>
                {cancelLabel}
              </button>
              <motion.button
                className={config.confirmClass}
                onClick={onConfirm}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
              >
                {confirmLabel}
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Helper hook to manage confirm modal state */
export function useConfirmModal() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: ConfirmVariant;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = React.useCallback(
    (opts: {
      title: string;
      message: string;
      confirmLabel?: string;
      variant?: ConfirmVariant;
      onConfirm: () => void;
    }) => {
      setState({ isOpen: true, ...opts });
    },
    []
  );

  const closeConfirm = React.useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  const modalProps = {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmLabel: state.confirmLabel,
    variant: state.variant,
    onConfirm: () => {
      state.onConfirm();
      closeConfirm();
    },
    onCancel: closeConfirm,
  };

  return { openConfirm, closeConfirm, modalProps };
}
