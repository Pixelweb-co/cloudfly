'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Phone,
    Settings,
    Trash2,
    Activity,
    Users,
    Clock,
    Search,
    Plus,
    RefreshCw
} from 'lucide-react';

interface Extension {
    extension: string;
    status: string;
    context: string;
    allow: string;
    active: boolean;
    callerId?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        libre: 'bg-emerald-500',
        ocupado: 'bg-rose-500',
        timbrando: 'bg-amber-500',
        espera: 'bg-sky-500',
        desconectado: 'bg-slate-400',
    };

    const anim: Record<string, string> = {
        timbrando: 'animate-pulse',
        ocupado: 'animate-pulse',
    };

    return (
        <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${colors[status] || 'bg-gray-400'} ${anim[status] || ''}`} />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{status}</span>
        </div>
    );
};

export default function ExtensionsPage() {
    const [extensions, setExtensions] = useState<Extension[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
    const wsRef = useRef<WebSocket | null>(null);

    const fetchExtensions = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8005/extensions');
            const data = await res.json();
            setExtensions(data.map((e: any) => ({ ...e, active: true, callerId: `Ext ${e.extension}` })));
            setServerStatus('online');
        } catch (err) {
            console.error("Error fetching extensions:", err);
            setServerStatus('offline');
        } finally {
            setLoading(false);
        }
    }, []);

    const connectWS = useCallback(() => {
        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket('ws://localhost:8005/ws');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("✅ Telephony Socket Connected");
            setServerStatus('online');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'initial_state') {
                    setExtensions(data.extensions.map((e: any) => ({
                        ...e,
                        active: true,
                        callerId: `Ext ${e.extension}`
                    })));
                } else if (data.type === 'state_change') {
                    setExtensions(prev => prev.map(ext =>
                        ext.extension === data.extension
                            ? { ...ext, status: data.status }
                            : ext
                    ));
                }
            } catch (e) {
                console.error("WS Message Error:", e);
            }
        };

        ws.onclose = () => {
            console.log("🔌 Telephony Socket Disconnected. Retrying in 5s...");
            setServerStatus('offline');
            setTimeout(connectWS, 5000);
        };

        ws.onerror = () => setServerStatus('offline');
    }, []);

    useEffect(() => {
        fetchExtensions();
        connectWS();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [fetchExtensions, connectWS]);

    const stats = [
        { label: 'Total', value: extensions.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Libres', value: extensions.filter(e => e.status === 'libre').length, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'En Llamada', value: extensions.filter(e => e.status === 'ocupado').length, icon: Phone, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'Offline', value: extensions.filter(e => e.status === 'desconectado').length, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
    ];

    const filteredExtensions = extensions.filter(ext =>
        ext.extension.includes(search) || (ext.callerId || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen font-sans selection:bg-indigo-100">
            {/* Header Dashboard */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Extensiones</h1>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${serverStatus === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                                <div className={`h-1.5 w-1.5 rounded-full ${serverStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {serverStatus === 'online' ? 'Socket Online' : 'Socket Offline'}
                            </div>
                        </div>
                        <p className="text-slate-400 mt-1 uppercase text-[10px] font-bold tracking-[0.2em]">Panel Real-Time de Telefonía IP</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchExtensions}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 hover:-translate-y-0.5">
                            <Plus size={20} />
                            <span className="font-semibold">Nueva Extensión</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md group">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 leading-tight">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search & Filters */}
            <div className="mb-8">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Escribe el número de la extensión para filtrar..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 bg-white shadow-sm transition-all text-slate-700 font-medium placeholder:text-slate-300"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Extensiones */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <Activity className="animate-bounce text-indigo-500 mb-2" size={48} />
                    <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Sincronizando con Asterisk...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredExtensions.map((ext) => (
                        <div key={ext.extension} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
                            {/* Hover Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start mb-6 relative">
                                <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-indigo-600 group-hover:rotate-12 transition-all duration-500">
                                    <Phone className="text-slate-400 group-hover:text-white transition-colors" size={28} />
                                </div>
                                <StatusBadge status={ext.status} />
                            </div>

                            <div className="mb-8 relative">
                                <h3 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                                    {ext.extension}
                                </h3>
                                <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">{ext.callerId}</p>

                                <div className="mt-5 flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-lg uppercase border border-slate-200">
                                        {ext.allow.split(',')[0]}
                                    </span>
                                    <span className="px-3 py-1 bg-indigo-50 text-[10px] font-black text-indigo-500 rounded-lg uppercase border border-indigo-100">
                                        {ext.context}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative">
                                <div className="flex gap-1">
                                    <button title="Editar" className="p-2.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90">
                                        <Settings size={22} />
                                    </button>
                                    <button title="Eliminar" className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-90">
                                        <Trash2 size={22} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`w-16 h-8 rounded-full relative transition-all duration-500 shadow-inner group ${ext.active ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                                        <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300 ring-4 ring-black/0 group-hover:ring-black/5 ${ext.active ? 'left-9' : 'left-1'}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredExtensions.length === 0 && (
                        <div className="col-span-full py-20 text-center">
                            <p className="text-slate-300 font-bold uppercase tracking-widest">No se encontraron extensiones con "{search}"</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
