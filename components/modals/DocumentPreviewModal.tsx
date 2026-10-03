import React from 'react';
import { Modal, Button } from '../ui/Modal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docName: string;
  fileName: string;
  fileUrl: string;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, docName, fileName, fileUrl }) => {
  const isImage = fileUrl.startsWith('data:image/');
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" title={docName} subtitle={fileName}
      footer={<><a href={fileUrl} download={fileName} className="h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 text-[var(--text-secondary)] hover:bg-[var(--light-bg)]"><i className="fas fa-download" aria-hidden="true"></i>Download</a><Button type="button" onClick={onClose}>Close</Button></>}>
      <div className="h-[62vh] -m-1 rounded-lg bg-[var(--dark-bg)] border border-[var(--border-color)] flex items-center justify-center overflow-auto">
        {isImage ? (
          <img src={fileUrl} alt={`Preview of ${fileName}`} className="max-w-full max-h-full object-contain" />
        ) : (
          <object data={fileUrl} type="application/pdf" className="w-full h-full">
            <div className="text-center text-[var(--text-secondary)] p-6">
              <i className="fas fa-exclamation-triangle text-4xl mb-3 text-yellow-500" aria-hidden="true"></i>
              <p>This file can’t be previewed in your browser.</p>
              <p className="text-xs mt-1">Use Download to open it.</p>
            </div>
          </object>
        )}
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;
