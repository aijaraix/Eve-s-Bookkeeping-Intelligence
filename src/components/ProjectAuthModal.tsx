import React from 'react';
import { Workspace } from '../types';
import { Sparkles, FolderKanban, Plus, X } from 'lucide-react';

interface ProjectAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingWorkspace: Workspace | null;
  extractedName?: string;
  onConfirmAttach: (workspaceId: string) => void;
  onCreateNewWorkspace: () => void;
}

export const ProjectAuthModal: React.FC<ProjectAuthModalProps> = ({
  isOpen,
  onClose,
  existingWorkspace,
  extractedName,
  onConfirmAttach,
  onCreateNewWorkspace,
}) => {
  if (!isOpen || !existingWorkspace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-neutral-900 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 p-1.5 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900">Matching Project Detected</h3>
            <p className="text-xs text-neutral-500 font-mono font-bold">EVE Internal OCR & Entity Matching</p>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl text-xs text-neutral-700 space-y-2">
          <p className="font-medium">
            EVE extracted internal entity <strong className="text-neutral-900 font-bold">{extractedName || existingWorkspace.name}</strong> from your uploaded document.
          </p>
          <p className="text-neutral-600 font-medium">
            This matches existing active project: <span className="text-emerald-800 font-extrabold">{existingWorkspace.name}</span> ({existingWorkspace.code}).
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-neutral-800">Would you like to attach these documents to this project?</p>
          
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => onConfirmAttach(existingWorkspace.id)}
              className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
            >
              <FolderKanban className="w-4 h-4" />
              <span>Yes, Attach to {existingWorkspace.name}</span>
            </button>

            <button
              onClick={onCreateNewWorkspace}
              className="w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition border border-neutral-300 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>No, Create Separate Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
