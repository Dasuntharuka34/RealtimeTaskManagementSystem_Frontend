import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // 'danger', 'info', 'warning'
}) => {
    if (!isOpen) return null;

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: 'text-red-400',
                    bg: 'bg-red-500/10',
                    button: 'bg-red-500 hover:bg-red-600',
                    border: 'border-red-500/20'
                };
            case 'warning':
                return {
                    icon: 'text-yellow-400',
                    bg: 'bg-yellow-500/10',
                    button: 'bg-yellow-500 hover:bg-yellow-600',
                    border: 'border-yellow-500/20'
                };
            default:
                return {
                    icon: 'text-blue-400',
                    bg: 'bg-blue-500/10',
                    button: 'bg-blue-500 hover:bg-blue-600',
                    border: 'border-blue-500/20'
                };
        }
    };

    const colors = getColors();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className={`w-full max-w-md bg-slate-900 border ${colors.border} rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${colors.bg} ${colors.icon} shrink-0`}>
                            <AlertCircle size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                                {title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-5 py-2 text-sm font-bold text-white ${colors.button} rounded-lg shadow-lg shadow-black/20 transition-all transform active:scale-95`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
