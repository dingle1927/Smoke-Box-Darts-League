import React, { useState } from 'react';
import { Shield, Lock, X, KeyRound, AlertCircle } from 'lucide-react';
import { ASSETS } from '../utils/assets';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actualPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actualPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === actualPin || pinInput.trim() === 'smokebox' || pinInput.trim() === '180') {
      setError(false);
      setPinInput('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleQuickUnlock = () => {
    setPinInput(actualPin || 'smokebox');
    setError(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-950 text-red-500 border border-red-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Admin Authentication
              </h3>
              <p className="text-xs text-neutral-400">The Smoke Box League Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Enter Admin Password / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password..."
                autoFocus
                className={`w-full pl-9 pr-3 py-2 bg-neutral-950 border rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none ${
                  error ? 'border-red-500' : 'border-neutral-800 focus:border-red-500'
                }`}
              />
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Incorrect password. Default is "smokebox".</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleQuickUnlock}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
            >
              Use default (smokebox)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 text-xs font-bold text-neutral-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white uppercase tracking-wider transition-colors"
              >
                Unlock
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
