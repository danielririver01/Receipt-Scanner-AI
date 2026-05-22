import { useState, useCallback } from 'react';
import { ModalType } from '@/components/StatusModal';

interface StatusModalState {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
}

export function useStatusModal() {
  const [statusModal, setStatusModal] = useState<StatusModalState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showStatus = useCallback((type: ModalType, title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  }, []);

  const hideStatus = useCallback(() => {
    setStatusModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    statusModal,
    showStatus,
    hideStatus,
    setStatusModal
  };
}
