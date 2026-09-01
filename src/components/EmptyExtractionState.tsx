import React from 'react';
import { Upload } from 'lucide-react';

interface EmptyExtractionStateProps {
  title?: string;
  detail?: string;
  onUpload?: () => void;
}

export const EmptyExtractionState: React.FC<EmptyExtractionStateProps> = ({
  title = 'Not extracted',
  detail = 'Company cards and statements fill only from db.facts after hybrid Gemini extraction. Empty workspace shows — — never demo revenue.',
  onUpload
}) => {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
      <div className="text-3xl font-extrabold text-slate-400 font-mono">—</div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 max-w-lg mx-auto">{detail}</p>
      {onUpload && (
        <button
          onClick={onUpload}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Submit Client Documents
        </button>
      )}
    </div>
  );
};
