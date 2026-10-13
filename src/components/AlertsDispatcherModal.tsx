import React, { useState } from 'react';
import { SystemAlert } from '../types';
import { Bell, X, Send, CheckCircle2, AlertTriangle, Smartphone, Radio, ShieldAlert } from 'lucide-react';

interface AlertsDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SystemAlert[];
  onDispatchAlert: (alertId: string) => void;
  onDismissAlert: (alertId: string) => void;
}

export const AlertsDispatcherModal: React.FC<AlertsDispatcherModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onDispatchAlert,
  onDismissAlert,
}) => {
  const [selectedAlertForSms, setSelectedAlertForSms] = useState<SystemAlert | null>(alerts[0] || null);
  const [smsPhoneTarget, setSmsPhoneTarget] = useState('+1 (555) 842-9901 (ER Charge RN)');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSendBroadcast = (alert: SystemAlert) => {
    onDispatchAlert(alert.id);
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Automated Actionable Alerts & Protocol Dispatcher</h3>
                <span className="text-[11px] font-mono text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated real-time hospital push notifications, pagers, and SMS alerts dispatched when thresholds are breached.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 text-xs">
          <h4 className="font-semibold text-slate-200 text-xs">Active Operational Trigger Logs</h4>

          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No active alerts. All units operating nominal.</div>
          ) : (
            alerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  alt.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-amber-950/20 border-amber-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        alt.severity === 'critical' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-bold text-slate-100 text-sm">{alt.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {alt.timestamp}
                    </span>
                  </div>

                  {alt.dispatched ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendBroadcast(alt)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Dispatch Alert</span>
                    </button>
                  )}
                </div>

                <p className="mt-1.5 text-slate-300 text-xs">{alt.message}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-900/80 flex items-center justify-between text-[11px]">
                  <div className="text-cyan-400 flex items-center gap-1">
                    <span className="font-medium text-slate-400">Action:</span>
                    <span>{alt.suggestedAction}</span>
                  </div>

                  <button
                    onClick={() => setSelectedAlertForSms(alt)}
                    className="text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Preview SMS Push →
                  </button>
                </div>
              </div>
            ))
          )}

          {/* SMS / Pager Mockup Preview */}
          {selectedAlertForSms && (
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Clinical Pager / Mobile SMS Dispatch Simulation</span>
                </div>
                <span className="font-mono text-slate-500">{smsPhoneTarget}</span>
              </div>

              {/* Message Bubble */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/80 text-xs font-mono text-slate-200 space-y-1">
                <div className="text-rose-400 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>[AEGISFLOW CRITICAL SURGE ALERT]</span>
                </div>
                <div>{selectedAlertForSms.title}: {selectedAlertForSms.message}</div>
                <div className="text-emerald-400 font-medium">
                  &gt; Executed Directive: {selectedAlertForSms.suggestedAction}
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Sent via AegisFlow Automated Dispatch Mesh · Timestamp {selectedAlertForSms.timestamp}
                </div>
              </div>

              {isSent && (
                <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Broadcast successfully sent to on-duty unit supervisors!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
