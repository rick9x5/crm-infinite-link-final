import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from "react-dom";
import { DateRange } from 'react-date-range';
import ptBR from 'date-fns/locale/pt-BR';
import { Users, FileBarChart2, ListTodo, Search, Filter, CalendarDays, MapPin, Clock, UserCog, MoreVertical, Copy, X, Phone, ScanLine, MessageSquareText, ShoppingBag, CheckCircle2, AlertTriangle, Wrench, XCircle, User } from "lucide-react";

import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

// Hook customizado para detectar cliques fora de um elemento
function useClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) { return; }
            handler(event);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

const statusEsteiraList = ["AGENDADO", "PENDENCIA", "CLEAN UP", "INSTALADO", "CANCELADO"];
const statusEsteiraPill = { "AGENDADO": "bg-blue-100 text-blue-800", "PENDENCIA": "bg-yellow-100 text-yellow-800", "CLEAN UP": "bg-purple-100 text-purple-800", "INSTALADO": "bg-green-100 text-green-800", "CANCELADO": "bg-red-100 text-red-800", };
const resumoMap = [ { key: "Total", label: "Total", color: "bg-gray-100 text-gray-800 border-gray-400" }, { key: "AGENDADO", label: "Agendado", color: "bg-blue-100 text-blue-800 border-blue-400" }, { key: "PENDENCIA", label: "Pendência", color: "bg-yellow-100 text-yellow-800 border-yellow-400" }, { key: "CLEAN UP", label: "Clean Up", color: "bg-purple-100 text-purple-800 border-purple-400" }, { key: "INSTALADO", label: "Instalado", color: "bg-green-100 text-green-800 border-green-400" }, { key: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-800 border-red-400" }, ];
const infoExtraOptions = [ { value: "", color: "bg-gray-200 text-gray-500 border-gray-300", text: "–", label: "Nenhum" }, { value: "FORMS_ENVIADO", color: "bg-blue-500 text-white border-blue-600", text: "F", label: "Forms Enviado" }, { value: "PENDENCIA", color: "bg-yellow-400 text-yellow-900 border-yellow-600", text: "P", label: "Pendência" }, { value: "NUMERO_ALTERADO", color: "bg-yellow-500 text-yellow-900 border-yellow-700", text: "N", label: "Número alterado" }, { value: "TRATANDO", color: "bg-purple-500 text-white border-purple-700", text: "T", label: "Tratando" }, ];
const statusIconMap = { "AGENDADO": { icon: Clock, color: "text-blue-500" }, "PENDENCIA": { icon: AlertTriangle, color: "text-yellow-500" }, "CLEAN UP": { icon: Wrench, color: "text-purple-500" }, "INSTALADO": { icon: CheckCircle2, color: "text-green-500" }, "CANCELADO": { icon: XCircle, color: "text-red-500" }, }

function InfoExtraBadgeSelect({ value, onChange }) { const [open, setOpen] = useState(false); const [style, setStyle] = useState({}); const buttonRef = useRef(null); const menuRef = useRef(null); useEffect(() => { if (open && buttonRef.current) { const rect = buttonRef.current.getBoundingClientRect(); setStyle({ top: `${rect.bottom + window.scrollY}px`, left: `${rect.left + rect.width / 2 + window.scrollX}px` }); } }, [open]); useClickOutside(menuRef, () => setOpen(false)); const current = infoExtraOptions.find(o => o.value === value) || infoExtraOptions[0]; const Menu = ( <div ref={menuRef} className="fixed z-50 bg-white rounded shadow-lg border min-w-[140px] py-1 animate-fadein" style={{ ...style, transform: 'translateX(-50%)', marginTop: '8px' }}> {infoExtraOptions.map(opt => (<button key={opt.value} className={`flex items-center w-full px-3 py-2 text-xs gap-2 hover:bg-gray-100 ${opt.value === value ? "font-bold" : ""}`} onClick={e => { e.stopPropagation(); onChange(opt.value); setOpen(false); }} type="button"><span className={`rounded-full w-5 h-5 flex items-center justify-center border ${opt.color} text-xs font-bold`}>{opt.text}</span>{opt.label}</button>))} </div> ); return (<div ref={buttonRef}><button type="button" className={`rounded-full w-7 h-7 flex items-center justify-center border text-xs font-bold shadow ${current.color} hover:ring-2 hover:ring-green-400 transition`} title="Alterar info extra" onClick={e => { e.stopPropagation(); setOpen(v => !v); }}>{current.text}</button>{open && createPortal(Menu, document.body)}</div>); }
function resumoStatusEsteira(leads) { const counts = { "Total": leads.length, "PENDENCIA": 0, "CLEAN UP": 0, "INSTALADO": 0, "CANCELADO": 0, "AGENDADO": 0, }; for (const lead of leads) { if (lead.statusEsteira && counts.hasOwnProperty(lead.statusEsteira)) { counts[lead.statusEsteira]++; } } return counts; }
function parseBrazilianDate(str) { if (!str || typeof str !== 'string') return null; const parts = str.split('/'); if (parts.length !== 3) return null; return new Date(parts[2], parts[1] - 1, parts[0]); }
function copyToClipboard(text) { navigator.clipboard.writeText(text); }

export default function Esteira({ leads, setLeads }) {
    const [filtroStatus, setFiltroStatus] = useState("Todos");
    const [busca, setBusca] = useState("");
    const [leadExpandido, setLeadExpandido] = useState(null);
    const [editando, setEditando] = useState(null);
    const [leadEdit, setLeadEdit] = useState({});
    const [statusMenuOpen, setStatusMenuOpen] = useState(null);
    const [showObsModal, setShowObsModal] = useState(false);
    const [obsTemp, setObsTemp] = useState("");
    const [obsLeadId, setObsLeadId] = useState(null);
    const [showObsObrigModal, setShowObsObrigModal] = useState(false);
    const [obsObrig, setObsObrig] = useState("");
    const [pendingStatusChange, setPendingStatusChange] = useState(null);
    const [activeDateFilter, setActiveDateFilter] = useState('esteMes');
    const [copySuccess, setCopySuccess] = useState('');
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [newScheduleDate, setNewScheduleDate] = useState('');
    const [newScheduleTurno, setNewScheduleTurno] = useState('');

    const statusMenuRef = useRef(null);
    const rescheduleRef = useRef(null);
    useClickOutside(statusMenuRef, () => setStatusMenuOpen(null));
    useClickOutside(rescheduleRef, () => setEditingSchedule(null));

    const today = new Date();
    const [range, setRange] = useState([{ startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0), key: "selection" }]);
    const [showPicker, setShowPicker] = useState(false);
    const [appliedRange, setAppliedRange] = useState([{ startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0), key: "selection" }]);

    const periodoLabel = appliedRange[0].startDate.toLocaleDateString("pt-BR") === appliedRange[0].endDate.toLocaleDateString("pt-BR") ? appliedRange[0].startDate.toLocaleDateString("pt-BR") : `${appliedRange[0].startDate.toLocaleDateString("pt-BR")} até ${appliedRange[0].endDate.toLocaleDateString("pt-BR")}`;
    
    function handleOkDate() { setAppliedRange(range); setShowPicker(false); }
    function setDateFilter(filterType) { const today = new Date(); let startDate, endDate; if (filterType === 'hoje') { startDate = today; endDate = today; } else if (filterType === 'ontem') { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); startDate = yesterday; endDate = yesterday; } else { startDate = new Date(today.getFullYear(), today.getMonth(), 1); endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); } setAppliedRange([{ startDate, endDate, key: "selection" }]); setRange([{ startDate, endDate, key: "selection" }]); setActiveDateFilter(filterType); setShowPicker(false); }

    const leadsFiltradosPorPeriodo = useMemo(() => leads.filter(lead => { if (lead.status1 !== 'AGENDADO') return false; const dataAgendamento = parseBrazilianDate(lead.dataAgendamento); if (!dataAgendamento) return false; const start = new Date(appliedRange[0].startDate); const end = new Date(appliedRange[0].endDate); start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999); return dataAgendamento >= start && dataAgendamento <= end; }), [leads, appliedRange]);
    const resumo = resumoStatusEsteira(leadsFiltradosPorPeriodo);
    const leadsFiltradosParaTabela = useMemo(() => { const listaBase = filtroStatus === 'Todos' || filtroStatus === 'Total' ? leadsFiltradosPorPeriodo : leadsFiltradosPorPeriodo.filter(lead => lead.statusEsteira === filtroStatus); return listaBase.filter(lead => (busca === '' || lead.nome.toLowerCase().includes(busca.toLowerCase()) || (lead.contrato && lead.contrato.includes(busca)))).sort((a, b) => parseBrazilianDate(a.dataAgendamento) - parseBrazilianDate(b.dataAgendamento)); }, [leadsFiltradosPorPeriodo, filtroStatus, busca]);

    const handleStatusChange = (lead, novoStatus) => { setStatusMenuOpen(null); if (lead.statusEsteira === novoStatus) return; if (novoStatus === "PENDENCIA" || novoStatus === "CANCELADO") { setPendingStatusChange({ lead, novoStatus }); setObsObrig(lead.obs || ""); setShowObsObrigModal(true); } else { setLeads(currentLeads => currentLeads.map(l => (l.id === lead.id ? { ...l, statusEsteira: novoStatus } : l))); } };
    const handleSaveObsObrig = () => { if (!obsObrig.trim()) { alert("A observação é obrigatória."); return; } const { lead, novoStatus } = pendingStatusChange; setLeads(currentLeads => currentLeads.map(l => l.id === lead.id ? { ...l, statusEsteira: novoStatus, obs: obsObrig } : l)); setShowObsObrigModal(false); setPendingStatusChange(null); };
    
    // ===== FUNÇÃO CORRIGIDA =====
    function startEdit(lead) {
        setEditando(lead.id);
        const leadToEdit = { ...lead };
        // Verifica se a data existe antes de tentar formatá-la
        if (leadToEdit.dataAgendamento) {
            leadToEdit.dataAgendamento = leadToEdit.dataAgendamento.split('/').reverse().join('-');
        } else {
            leadToEdit.dataAgendamento = ''; // Define como vazio se não houver data
        }
        setLeadEdit(leadToEdit);
    }

    function saveEdit(id) {
        const leadData = { ...leadEdit };
        // Garante que a data seja salva de volta no formato DD/MM/YYYY
        if(leadData.dataAgendamento) {
            leadData.dataAgendamento = leadData.dataAgendamento.split('-').reverse().join('/');
        }
        setLeads(currentLeads => currentLeads.map(l => (l.id === id ? leadData : l)));
        setEditando(null);
    }

    function cancelEdit() { setEditando(null); }
    function handleInfoExtraChangeEdit(value) { setLeadEdit(f => ({ ...f, infoExtra: value })); }

    function handleOpenObs(lead) { setObsLeadId(lead.id); setObsTemp(lead.obs || ""); setShowObsModal(true); }
    function handleCloseObs() { setShowObsModal(false); setObsLeadId(null); setObsTemp(""); }
    function salvarObs() { setLeads(leads => leads.map(l => l.id === obsLeadId ? { ...l, obs: obsTemp } : l)); handleCloseObs(); }
    
    function handleCopy(textToCopy, fieldName) { copyToClipboard(textToCopy); setCopySuccess(`${fieldName} copiado!`); setTimeout(() => setCopySuccess(''), 2000); }
    
    function handleSaveReschedule(leadId) { if (!newScheduleDate || !newScheduleTurno) { alert("Por favor, preencha a nova data e o turno."); return; } setLeads(currentLeads => currentLeads.map(l => l.id === leadId ? { ...l, dataAgendamento: newScheduleDate.split('-').reverse().join('/'), turnoAgendamento: newScheduleTurno } : l)); setEditingSchedule(null); }
    
    const inputStyle = "w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition";
    
    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-900">
            <aside className="bg-gray-200 w-60 flex flex-col py-6 px-4 min-h-screen text-gray-900 border-r border-gray-300"><div className="font-bold text-2xl mb-8 flex items-center gap-2"><FileBarChart2 className="w-7 h-7 text-green-500" /> Infinite Link</div><nav className="flex-1 flex flex-col gap-3"><Link to="/" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-300 transition"><ListTodo className="w-5 h-5" /> Pré-Vendas</Link><Link to="/esteira" className="flex items-center gap-2 p-2 rounded-lg bg-green-100 text-green-700 font-semibold"><Users className="w-5 h-5" /> Esteira Agendados</Link></nav><div className="mt-auto text-xs text-gray-600 pt-6 border-t border-gray-300">v3.6</div></aside>

            <main className="flex-1 py-10 px-6 lg:px-16 bg-gray-100 min-h-screen">
                <header className="flex justify-between items-center mb-6">
                    <div><h1 className="text-3xl font-bold text-gray-800">Esteira de Instalações</h1><p className="text-gray-600">Acompanhe e gerencie as instalações agendadas.</p></div>
                    <div className="flex gap-3">
                        {resumoMap.map(({ key, label, color }) => (<div key={key} onClick={() => setFiltroStatus(key === 'Total' ? 'Todos' : (key === filtroStatus ? 'Todos' : key))} className={`rounded-xl shadow-md px-5 py-3 text-center min-w-[110px] border transition-all cursor-pointer ${color} ${filtroStatus === key || (filtroStatus === 'Todos' && key === 'Total') ? 'ring-2 ring-offset-2 ring-green-500 scale-105' : 'hover:scale-105'}`}><div className="text-sm">{label}</div><div className="text-2xl font-bold">{resumo[key]}</div></div>))}
                    </div>
                </header>

                <div className="mb-6 bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 border-r pr-4"><button onClick={() => setDateFilter('hoje')} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeDateFilter === 'hoje' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Hoje</button><button onClick={() => setDateFilter('ontem')} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeDateFilter === 'ontem' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Ontem</button><button onClick={() => setDateFilter('esteMes')} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition ${activeDateFilter === 'esteMes' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>Este Mês</button></div>
                         <div className="relative w-fit">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm bg-white hover:ring-2 hover:ring-green-400 transition" onClick={() => {setShowPicker(!showPicker); setActiveDateFilter('personalizado')}} type="button"><CalendarDays className="w-5 h-5 text-green-600" /><span className={`text-sm font-semibold ${activeDateFilter === 'personalizado' ? 'text-green-700' : ''}`}>{periodoLabel}</span></button>
                            {showPicker && (<div className="absolute top-full left-0 z-50 mt-2 shadow-2xl bg-white rounded p-3 border border-gray-300"><DateRange onChange={item => setRange([item.selection])} ranges={range} locale={ptBR} moveRangeOnFirstSelection={false} rangeColors={["#16a34a"]} showDateDisplay={false} /><div className="flex justify-end gap-2 pt-2 border-t mt-2"><button className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm" onClick={() => setShowPicker(false)}>Cancelar</button><button className="px-3 py-1 rounded bg-green-600 text-white text-sm" onClick={handleOkDate}>Aplicar</button></div></div>)}
                        </div>
                        <div className="relative w-96"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Buscar por nome ou contrato..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none" /></div>
                    </div>
                </div>

                <div className="space-y-3">
                    {leadsFiltradosParaTabela.map(lead => (
                        <React.Fragment key={lead.id}>
                            <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 cursor-pointer" onClick={() => setLeadExpandido(leadExpandido === lead.id ? null : lead.id)}>
                               <div className="flex items-start justify-between space-x-6">
                                   <div className="w-1/3 space-y-2"><p className="font-bold text-lg text-gray-800 truncate">{lead.nome}</p><div onClick={(e) => {e.stopPropagation(); handleCopy(lead.cpf, "CPF")}} className="text-sm text-gray-500 flex items-center gap-2 hover:text-green-600" title="Copiar CPF"><ScanLine size={16}/><span className="font-semibold">CPF:</span><span>{lead.cpf}</span></div><div onClick={(e) => {e.stopPropagation(); handleCopy(lead.telefone, "Telefone")}} className="text-sm text-gray-500 flex items-center gap-2 hover:text-green-600" title="Copiar Telefone"><Phone size={16}/><span className="font-semibold">TEL:</span><span>{lead.telefone}</span></div><div className="text-sm text-gray-500 flex items-center gap-2"><ShoppingBag size={16}/><span className="font-semibold">Venda:</span><span>{lead.dataCadastro.split('-').reverse().join('/')}</span></div></div>
                                   <div className="w-auto px-4 flex items-center" ref={statusMenuRef === lead.id ? statusMenuRef : null}><div className="relative"><button onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(statusMenuOpen === lead.id ? null : lead.id) }} className={`px-5 py-2 text-base font-bold rounded-full transition-transform hover:scale-105 ${statusEsteiraPill[lead.statusEsteira] || "bg-gray-200"}`}>{lead.statusEsteira}</button>{statusMenuOpen === lead.id && (<div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-lg shadow-xl border z-20"><div className="p-2 border-b text-sm font-semibold text-gray-600">Alterar Status</div><div className="py-1">{statusEsteiraList.map(status => { const Icon = statusIconMap[status]?.icon || Wrench; const color = statusIconMap[status]?.color || "text-gray-500"; return (<button key={status} onClick={(e) => { e.stopPropagation(); handleStatusChange(lead, status)}} className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-100 ${lead.statusEsteira === status ? 'bg-green-50' : ''}`}><Icon className={color} size={18}/><span>{status}</span></button>)})}</div></div>)}</div></div>
                                   <div className="flex-1 flex flex-col space-y-3 text-sm text-left">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-600" title="Local"><MapPin size={18} className="text-gray-400"/><span>{lead.cidade} - {lead.uf}</span></div>
                                            <div className="text-sm text-center relative" ref={editingSchedule === lead.id ? rescheduleRef : null}><div onClick={(e) => {e.stopPropagation(); setEditingSchedule(lead.id); setNewScheduleDate(lead.dataAgendamento.split('/').reverse().join('-')); setNewScheduleTurno(lead.turnoAgendamento);}} className="flex items-center gap-2 text-gray-600 cursor-pointer p-2 rounded-md hover:bg-gray-100" title="Clique para Reagendar"><CalendarDays size={18} className="text-gray-400"/><span className="font-semibold">{lead.dataAgendamento}</span></div>{editingSchedule === lead.id && (<div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white p-4 rounded-lg shadow-xl border z-10 w-64 space-y-3" onClick={e=>e.stopPropagation()}><h4 className="text-sm font-bold text-center">Reagendar Instalação</h4><div><label className="text-xs font-medium">Nova Data</label><input type="date" value={newScheduleDate} onChange={e => setNewScheduleDate(e.target.value)} className="w-full border-gray-300 rounded-md p-1.5 mt-1 text-sm"/></div><div><label className="text-xs font-medium">Novo Turno</label><select value={newScheduleTurno} onChange={e => setNewScheduleTurno(e.target.value)} className="w-full border-gray-300 rounded-md p-1.5 mt-1 text-sm"><option value="Manhã">Manhã</option><option value="Tarde">Tarde</option></select></div><div className="flex justify-end gap-2 pt-2"><button onClick={() => setEditingSchedule(null)} className="text-xs px-3 py-1 bg-gray-100 rounded">Cancelar</button><button onClick={() => handleSaveReschedule(lead.id)} className="text-xs px-3 py-1 bg-green-600 text-white rounded">Salvar</button></div></div>)}</div>
                                            <div className="flex items-center gap-2 text-gray-600" title="Turno"><Clock size={18} className="text-gray-400"/><span>{lead.turnoAgendamento}</span></div>
                                            <div className="flex items-center gap-2 text-gray-600" title="Técnico"><UserCog size={18} className="text-gray-400"/><span className="font-medium">{lead.tecnico || 'A definir'}</span></div>
                                        </div>
                                        {lead.obs && (<div className="pt-2 hover:bg-gray-50 -mx-2 px-2 rounded" onClick={(e) => {e.stopPropagation(); handleOpenObs(lead);}}><div className="flex items-start gap-3 text-gray-700"><MessageSquareText size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /><p className="text-xs whitespace-pre-wrap leading-relaxed">{lead.obs}</p></div></div>)}
                                   </div>
                               </div>
                            </div>
                            {leadExpandido === lead.id && (<div className="bg-slate-50 p-6 rounded-b-xl -mt-3 animate-fadein" onClick={e => e.stopPropagation()}>{editando === lead.id ? (<form onSubmit={e => { e.preventDefault(); saveEdit(lead.id); }}><div className="grid md:grid-cols-3 gap-x-6 gap-y-4"><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Dados do Cliente</div><div><label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700">Nome</label><input id="edit-nome" type="text" className={inputStyle} value={leadEdit.nome} onChange={e => setLeadEdit(f => ({...f, nome: e.target.value}))} /></div><div><label htmlFor="edit-cpf" className="block text-sm font-medium text-gray-700">CPF / CNPJ</label><input id="edit-cpf" type="text" className={inputStyle} value={leadEdit.cpf} onChange={e => setLeadEdit(f => ({...f, cpf: e.target.value}))} /></div><div><label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label><input id="edit-email" type="email" className={inputStyle} value={leadEdit.email} onChange={e => setLeadEdit(f => ({...f, email: e.target.value}))} /></div><div><label htmlFor="edit-nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label><input id="edit-nascimento" type="text" className={inputStyle} value={leadEdit.dataNascimento} onChange={e => setLeadEdit(f => ({...f, dataNascimento: e.target.value}))} /></div><div><label htmlFor="edit-tel1" className="block text-sm font-medium text-gray-700">Telefone 1</label><input id="edit-tel1" type="text" className={inputStyle} value={leadEdit.telefone} onChange={e => setLeadEdit(f => ({...f, telefone: e.target.value}))} /></div><div><label htmlFor="edit-tel2" className="block text-sm font-medium text-gray-700">Telefone 2</label><input id="edit-tel2" type="text" className={inputStyle} value={leadEdit.telefone2} onChange={e => setLeadEdit(f => ({...f, telefone2: e.target.value}))} /></div></div><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Endereço do Cliente</div><div><label htmlFor="edit-uf" className="block text-sm font-medium text-gray-700">UF</label><input id="edit-uf" type="text" className={inputStyle} value={leadEdit.uf} onChange={e => setLeadEdit(f => ({...f, uf: e.target.value}))} /></div><div><label htmlFor="edit-cep" className="block text-sm font-medium text-gray-700">CEP</label><input id="edit-cep" type="text" className={inputStyle} value={leadEdit.cep} onChange={e => setLeadEdit(f => ({...f, cep: e.target.value}))} /></div><div><label htmlFor="edit-rua" className="block text-sm font-medium text-gray-700">Nome da Rua</label><input id="edit-rua" type="text" className={inputStyle} value={leadEdit.rua} onChange={e => setLeadEdit(f => ({...f, rua: e.target.value}))} /></div><div><label htmlFor="edit-numero" className="block text-sm font-medium text-gray-700">Número</label><input id="edit-numero" type="text" className={inputStyle} value={leadEdit.numero} onChange={e => setLeadEdit(f => ({...f, numero: e.target.value}))} /></div><div><label htmlFor="edit-complemento" className="block text-sm font-medium text-gray-700">Complemento</label><input id="edit-complemento" type="text" className={inputStyle} value={leadEdit.complemento} onChange={e => setLeadEdit(f => ({...f, complemento: e.target.value}))} /></div><div><label htmlFor="edit-bairro" className="block text-sm font-medium text-gray-700">Bairro</label><input id="edit-bairro" type="text" className={inputStyle} value={leadEdit.bairro} onChange={e => setLeadEdit(f => ({...f, bairro: e.target.value}))} /></div></div><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Dados da Venda</div><div><label htmlFor="edit-vendedor" className="block text-sm font-medium text-gray-700">Vendedor</label><input id="edit-vendedor" type="text" className={inputStyle} value={leadEdit.vendedor} onChange={e => setLeadEdit(f => ({...f, vendedor: e.target.value}))} /></div><div><label htmlFor="edit-plano" className="block text-sm font-medium text-gray-700">Plano</label><input id="edit-plano" type="text" className={inputStyle} value={leadEdit.plano} onChange={e => setLeadEdit(f => ({...f, plano: e.target.value}))} /></div><div><label htmlFor="edit-origem" className="block text-sm font-medium text-gray-700">Origem da venda</label><input id="edit-origem" type="text" className={inputStyle} value={leadEdit.origemVenda} onChange={e => setLeadEdit(f => ({...f, origemVenda: e.target.value}))} /></div><div><label htmlFor="edit-vencimento" className="block text-sm font-medium text-gray-700">Dia do Vencimento</label><input id="edit-vencimento" type="text" className={inputStyle} value={leadEdit.diaVencimento} onChange={e => setLeadEdit(f => ({...f, diaVencimento: e.target.value}))} /></div><div><label htmlFor="edit-contrato" className="block text-sm font-medium text-gray-700">Contrato</label><input id="edit-contrato" type="text" className={inputStyle} value={leadEdit.contrato} onChange={e => setLeadEdit(f => ({...f, contrato: e.target.value}))} /></div></div></div><div className="flex justify-center gap-4 mt-8"><button className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg" type="submit">Salvar</button><button className="px-8 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold hover:bg-gray-400 transition" type="button" onClick={cancelEdit}>Cancelar</button></div></form>) : (<><div className="grid md:grid-cols-3 gap-6"><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Dados do Cliente</h3><div><span className="font-semibold">Nome / Razão Social:</span> {lead.nome}</div><div><span className="font-semibold">CPF / CNPJ:</span> {lead.cpf}</div><div><span className="font-semibold">Email:</span> {lead.email || "-"}</div><div><span className="font-semibold">Data de Nascimento:</span> {lead.dataNascimento || "-"}</div><div><span className="font-semibold">Telefone 1:</span> {lead.telefone || "-"}</div><div><span className="font-semibold">Telefone 2:</span> {lead.telefone2 || "-"}</div></div><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Endereço do Cliente</h3><div><span className="font-semibold">UF:</span> {lead.uf}</div><div><span className="font-semibold">CEP:</span> {lead.cep}</div><div><span className="font-semibold">Nome da Rua:</span> {lead.rua}</div><div><span className="font-semibold">Número:</span> {lead.numero}</div><div><span className="font-semibold">Complemento:</span> {lead.complemento}</div><div><span className="font-semibold">Bairro:</span> {lead.bairro}</div><div><span className="font-semibold">Ponto de Referência:</span> {lead.pontoReferencia || "-"}</div><div className="flex items-center gap-2"><span className="font-semibold">Link de Localização:</span>{lead.linkLocalizacao ? (<><a className="underline text-blue-700" href={lead.linkLocalizacao} target="_blank" rel="noopener noreferrer">Abrir Mapa</a><button type="button" title="Copiar link" className="text-blue-700" onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.linkLocalizacao); }}><Copy size={18} /></button></>) : <span>-</span>}</div><div><span className="font-semibold">Obs. Endereço:</span> {lead.obsEndereco || "-"}</div></div><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Dados da Venda</h3><div><span className="font-semibold">Data do Cadastro:</span> {lead.dataCadastro.split('-').reverse().join('/')}</div><div><span className="font-semibold">Vendedor:</span> {lead.vendedor}</div><div><span className="font-semibold">Plano:</span> {lead.plano}</div><div><span className="font-semibold">Origem da venda:</span> {lead.origemVenda}</div><div><span className="font-semibold">Dia do Vencimento:</span> {lead.diaVencimento}</div><div><span className="font-semibold">Agendamento:</span> {lead.dataAgendamento} - {lead.turnoAgendamento}</div></div></div><div className="mt-8 flex justify-center"><button className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg" onClick={(e) => {e.stopPropagation(); startEdit(lead)}}>Editar Ficha</button></div></>)}</div>)}
                        </React.Fragment>
                    ))}
                    {leadsFiltradosParaTabela.length === 0 && (<div className="text-center py-16 bg-white rounded-xl shadow-md"><p className="text-gray-500">Nenhuma instalação encontrada para os filtros selecionados.</p></div>)}
                </div>
            </main>

            {showObsObrigModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md animate-fadein"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Observação Obrigatória</h3><button onClick={() => setShowObsObrigModal(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><p className="text-sm text-gray-600 mb-4">Para mover o lead para o status <strong className="font-semibold">{pendingStatusChange?.novoStatus}</strong>, é necessário adicionar ou atualizar a observação.</p><textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" rows="4" value={obsObrig} onChange={(e) => setObsObrig(e.target.value)} placeholder="Digite o motivo ou a observação aqui..."></textarea><div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowObsObrigModal(false)} type="button" className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">Cancelar</button><button onClick={handleSaveObsObrig} type="button" className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">Salvar</button></div></div></div>)}
            {showObsModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein"><div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Editar Observação</h3><button onClick={handleCloseObs} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" rows="5" value={obsTemp} onChange={(e) => setObsTemp(e.target.value)} placeholder="Digite a observação do lead..."></textarea><div className="flex justify-end gap-3 mt-6"><button onClick={handleCloseObs} type="button" className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">Cancelar</button><button onClick={salvarObs} type="button" className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">Salvar</button></div></div></div>)}
            {copySuccess && (<div className="fixed bottom-5 right-5 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-fadein">{copySuccess}</div>)}
        </div>
    );
}