import React, { useEffect } from 'react';
import { Laptop, Headphones, Speaker, Tv, Check, Wifi, X, Disc3, RefreshCw, Volume2, ShieldCheck } from 'lucide-react';

export default function DevicePickerModal({
  isOpen,
  onClose,
  activeDevice,
  onSelectDevice,
  audioDevices = [],
  onRequestPermission
}) {
  // Auto-scan devices upon opening modal if labels are generic or missing
  useEffect(() => {
    if (isOpen && onRequestPermission) {
      const isGeneric = audioDevices.length === 0 || audioDevices.every((d) => !d.name || d.name.includes('Audio Output Device'));
      if (isGeneric) {
        onRequestPermission();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultDevices = [
    { id: 'default', name: 'PC Speakers (System Default)', type: 'computer', desc: 'Built-in / Desktop Speakers' },
    { id: 'bluetooth_headphones', name: 'Bluetooth Headphones / AirPods', type: 'headphones', desc: 'Wireless Audio Output' },
    { id: 'hifi_speakers', name: 'Hi-Fi Soundbar / Receiver', type: 'speaker', desc: 'External Audio Receiver' },
    { id: 'smart_tv', name: 'Smart TV / Chromecast', type: 'tv', desc: 'AirPlay & Cast Output' }
  ];

  // Merge detected hardware devices with default preset choices
  let devicesToRender = [];
  if (audioDevices.length > 0) {
    const defaultIndex = audioDevices.findIndex((d) => d.id === 'default' || d.sinkId === 'default');
    
    // Add all detected audio devices
    devicesToRender = [...audioDevices];

    // Ensure identifiable preset choices exist if not already detected
    defaultDevices.forEach((def) => {
      const exists = devicesToRender.some(
        (d) => d.id === def.id || (d.type === def.type && d.id !== 'default')
      );
      if (!exists && (def.id !== 'default' || defaultIndex < 0)) {
        devicesToRender.push(def);
      }
    });
  } else {
    devicesToRender = defaultDevices;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'headphones':
        return Headphones;
      case 'speaker':
        return Speaker;
      case 'tv':
        return Tv;
      default:
        return Laptop;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0d121d] border border-emerald-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 divide-y divide-slate-800/80">
        {/* Header */}
        <div className="pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Speaker className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Connect to a Device</span>
                <Wifi className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-400">Current Output: <span className="text-emerald-400 font-bold">{activeDevice?.name || 'PC Speakers'}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transparency Permission Purpose Notice Banner */}
        <div className="py-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-start gap-2.5 shadow-inner">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-slate-200 flex items-center gap-1">
                <span>Dynamic Device Detection</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                We use browser device permissions strictly to list your Bluetooth headphones, PC speakers, and soundbars for seamless audio output switching.
              </p>
            </div>
          </div>
        </div>

        {/* Device Scan Action Bar */}
        <div className="py-3 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Output Target:</span>
          </span>
          {onRequestPermission && (
            <button
              onClick={onRequestPermission}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 transition text-[11px] font-bold shadow-sm"
              title="Request browser media permission to scan exact hardware names"
            >
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin-slow" />
              <span>Scan Bluetooth / PC Devices</span>
            </button>
          )}
        </div>

        {/* Device List */}
        <div className="py-4 space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
          {devicesToRender.map((dev) => {
            const Icon = getIcon(dev.type);
            const isCurrent = (activeDevice?.id || 'default') === dev.id || activeDevice?.name === dev.name;

            return (
              <div
                key={dev.id}
                onClick={() => {
                  onSelectDevice(dev);
                  onClose();
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition border ${
                  isCurrent
                    ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {dev.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {isCurrent ? 'Playing Audio Right Now' : dev.desc || 'Available Audio Target'}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Active</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Disc3 className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            VISA Player Connect
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Web Audio API</span>
        </div>
      </div>
    </div>
  );
}
