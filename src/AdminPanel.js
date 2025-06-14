// src/AdminPanel.js
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from 'react-router-dom';
import { UserSearch, Users, FileBarChart2, ListTodo, CalendarDays, Copy, X, CheckCircle2, AlertTriangle, Wrench, XCircle, Clock, PlusCircle, ShoppingBag, MapPin, MessageSquareText } from "lucide-react";
import { DateRange } from "react-date-range";
import ptBR from "date-fns/locale/pt-BR";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// Hook customizado para detectar cliques fora de um elemento
function useClickOutside(ref, handler) {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) { return; }
            handler(event);
        };
        document.addEventListener("click", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("click", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

const statusList = [ "CPF REPROVADO", "CANCELADO", "QUALIFY - PEDIR DOCUMENTOS", "QUALIFY - DOCUMENTOS ENVIADOS", "AGENDADO", "FINANCEIRA", "TÉCNICA" ];
const statusPill = {
    "CPF REPROVADO": "bg-yellow-100 text-yellow-800",
    "CANCELADO": "bg-red-100 text-red-800",
    "QUALIFY - PEDIR DOCUMENTOS": "bg-blue-100 text-blue-800",
    "QUALIFY - DOCUMENTOS ENVIADOS": "bg-blue-100 text-blue-800",
    "AGENDADO": "bg-blue-100 text-blue-800", // Alterado para Azul
    "FINANCEIRA": "bg-gray-200 text-gray-700",
    "TÉCNICA": "bg-gray-200 text-gray-700"
};
const infoExtraOptions = [ { value: "", color: "bg-gray-200 text-gray-500 border-gray-300", text: "–", label: "Nenhum" }, { value: "FORMS_ENVIADO", color: "bg-blue-500 text-white border-blue-600", text: "F", label: "Forms Enviado" }, { value: "PENDENCIA", color: "bg-yellow-400 text-yellow-900 border-yellow-600", text: "P", label: "Pendência" }, { value: "NUMERO_ALTERADO", color: "bg-yellow-500 text-yellow-900 border-yellow-700", text: "N", label: "Número alterado" }, { value: "TRATANDO", color: "bg-purple-500 text-white border-purple-700", text: "T", label: "Tratando" }, ];
const statusIconMap = {
    "AGENDADO": { icon: CheckCircle2, color: "text-blue-500" }, // Alterado para Azul
    "QUALIFY - PEDIR DOCUMENTOS": { icon: Wrench, color: "text-blue-500" },
    "QUALIFY - DOCUMENTOS ENVIADOS": { icon: Wrench, color: "text-blue-500" },
    "CPF REPROVADO": { icon: AlertTriangle, color: "text-yellow-500" },
    "CANCELADO": { icon: XCircle, color: "text-red-500" },
    "FINANCEIRA": { icon: ListTodo, color: "text-gray-500" },
    "TÉCNICA": { icon: ListTodo, color: "text-gray-500" },
}

function InfoExtraBadgeSelect({ value, onChange }) { const [open, setOpen] = useState(false); const [style, setStyle] = useState({}); const buttonRef = useRef(null); const menuRef = useRef(null); useEffect(() => { if (open && buttonRef.current) { const rect = buttonRef.current.getBoundingClientRect(); setStyle({ top: `${rect.bottom + window.scrollY}px`, left: `${rect.left + rect.width / 2 + window.scrollX}px` }); } }, [open]); useClickOutside(menuRef, () => setOpen(false)); const current = infoExtraOptions.find(o => o.value === value) || infoExtraOptions[0]; const Menu = ( <div ref={menuRef} className="fixed z-50 bg-white rounded shadow-lg border min-w-[140px] py-1 animate-fadein" style={{ ...style, transform: 'translateX(-50%)', marginTop: '8px' }}> {infoExtraOptions.map(opt => (<button key={opt.value} className={`flex items-center w-full px-3 py-2 text-xs gap-2 hover:bg-gray-100 ${opt.value === value ? "font-bold" : ""}`} onClick={e => { e.stopPropagation(); onChange(opt.value); setOpen(false); }} type="button"><span className={`rounded-full w-5 h-5 flex items-center justify-center border ${opt.color} text-xs font-bold`}>{opt.text}</span>{opt.label}</button>))} </div> ); return (<div ref={buttonRef}><button type="button" className={`rounded-full w-7 h-7 flex items-center justify-center border text-xs font-bold shadow ${current.color} hover:ring-2 hover:ring-green-400 transition`} title="Alterar info extra" onClick={e => { e.stopPropagation(); setOpen(v => !v); }}>{current.text}</button>{open && createPortal(Menu, document.body)}</div>); }

const resumoMap = [
  { key: "total", label: "TOTAL", color: "bg-green-50 text-green-800 border-green-400", icon: ListTodo },
  { key: "CPF REPROVADO", label: "CPF REPROVADO", color: "bg-yellow-50 text-yellow-900 border-yellow-400", icon: AlertTriangle },
  { key: "CANCELADO", label: "CANCELADO", color: "bg-red-100 text-red-700 border-red-400", icon: XCircle },
  { key: "QUALIFY", label: "QUALIFY", color: "bg-blue-100 text-blue-700 border-blue-400", icon: Wrench },
  { key: "FINANCEIRA", label: "FINANCEIRA", color: "bg-gray-100 text-gray-700 border-gray-400", icon: ListTodo },
  { key: "TÉCNICA", label: "TÉCNICA", color: "bg-gray-100 text-gray-700 border-gray-400", icon: ListTodo }
];

function resumoPorStatus(leads) {
    const counts = {
        "total": leads.length,
        "CPF REPROVADO": 0,
        "CANCELADO": 0,
        "QUALIFY": 0, // Inclui QUALIFY - PEDIR DOCUMENTOS e QUALIFY - DOCUMENTOS ENVIADOS
        "FINANCEIRA": 0,
        "TÉCNICA": 0
    };
    for (const lead of leads) {
        if (lead.status1) {
            if (lead.status1.startsWith("QUALIFY")) {
                counts.QUALIFY++;
            } else if (counts.hasOwnProperty(lead.status1)) {
                counts[lead.status1]++;
            }
        }
    }
    return counts;
}
// CORRIGIDO: Agora retorna uma data de hoje se a data for inválida, para não usar 1970
function parseISODate(str) {
  const today = new Date(); // Obter a data atual aqui
  if (!str || typeof str !== 'string' || !str.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Se a string for inválida ou undefined, retorna a data de HOJE (UTC)
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  }
  const [year, month, day] = str.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return isNaN(date.getTime()) ? new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) : date;
}
// FUNÇÃO MOVIDA PARA DENTRO DO COMPONENTE AdminPanel
// function copyToClipboard(text) { navigator.clipboard.writeText(text); } 

// Componente do Menu de Status com Portal (MODIFICADO para aceitar statusOptions)
function StatusMenu({ lead, onStatusChange, onClose, position, statusOptions }) {
    const menuRef = useRef(null);
    useClickOutside(menuRef, onClose);
    const handleSelect = (e, status) => {
        e.stopPropagation();
        onStatusChange(lead, status);
        onClose(); // Fechar o menu após a seleção
    };
    const optionsToRender = statusOptions || statusList;

    return createPortal(
        <div ref={menuRef} style={{ top: position.top, left: position.left }} className="absolute w-64 bg-white rounded-lg shadow-xl border z-[60]">
            <div className="p-2 border-b text-sm font-semibold text-gray-600">Alterar Status</div>
            <div className="py-1">
                {optionsToRender.map(status => {
                    const Icon = statusIconMap[status]?.icon || Wrench;
                    const color = statusIconMap[status]?.color || "text-gray-500";
                    return (<button key={status} onClick={(e) => handleSelect(e, status)} className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-100 ${lead.status1 === status ? 'bg-green-50' : ''}`}><Icon className={color} size={18}/><span>{status}</span></button>)
                })}
            </div>
        </div>,
        document.body
    );
}

const initialNewLeadState = {
  nome: "", cpf: "", email: "", dataNascimento: "",
  telefone: "", telefone2: "", uf: "", cep: "",
  rua: "", numero: "", complemento: "", bairro: "",
  cidade: "", pontoReferencia: "", linkLocalizacao: "", obsEndereco: "",
  plano: "", vendedor: "",
  origemVenda: "", diaVencimento: "",
  contrato: "", status1: "", // Alterado para string vazia para que "Selecione" apareça primeiro
  infoExtra: "", dataAgendamento: null, turnoAgendamento: null,
  statusEsteira: null, tecnico: null, obs: ""
};

// Adicionado 'onAddLead', 'onUpdateLead', 'onDeleteLead' nas props
export default function AdminPanel({ leads, onAddLead, onUpdateLead, onDeleteLead }) {
  const [busca, setBusca] = useState("");
  const [leadExpandido, setLeadExpandido] = useState(null);
  const [editando, setEditando] = useState(null);
  const [leadEdit, setLeadEdit] = useState({});
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsTemp, setObsTemp] = useState("");
  const [obsLeadId, setObsLeadId] = useState(null);
  const [showEsteiraModal, setShowEsteiraModal] = useState(false);
  const [showObsObrigModal, setShowObsObrigModal] = useState(false);
  const [obsObrig, setObsObrig] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [agendarData, setAgendarData] = useState("");
  const [agendarTurno, setAgendarTurno] = useState("");
  const [contratoInput, setContratoInput] = useState("");
  // Estado para o filtro de resumo, inicia em 'total'
  const [statusFiltroResumo, setStatusFiltroResumo] = useState('total'); 
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [newLeadData, setNewLeadData] = useState(initialNewLeadState);
  
  const [statusMenuState, setStatusMenuState] = useState({ open: false, leadId: null, position: {} });
  const [newLeadStatusMenuState, setNewLeadStatusMenuState] = useState({ open: false, position: {} });
  const newLeadStatusButtonRef = useRef(null);
  
  const today = new Date();
  const [range, setRange] = useState([{ startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: today, key: "selection" }]);
  const [showPicker, setShowPicker] = useState(false);
  const [appliedRange, setAppliedRange] = useState([{ startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: today, key: "selection" }]);
  const periodoLabel = appliedRange[0].startDate.toLocaleDateString("pt-BR") === appliedRange[0].endDate.toLocaleDateString("pt-BR") ? appliedRange[0].startDate.toLocaleDateString("pt-BR") : `${appliedRange[0].startDate.toLocaleDateString("pt-BR")} até ${appliedRange[0].endDate.toLocaleDateString("pt-BR")}`;
  
  function handleOk() { setAppliedRange(range); setShowPicker(false); }
  function handleCancel() { setRange(appliedRange); setShowPicker(false); }

  // FUNÇÃO MOVIDA PARA DENTRO DO COMPONENTE
  function copyToClipboard(text) {
    // Adicionando um fallback para navegadores antigos
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Falha ao copiar (Clipboard API):', err);
        // Fallback para execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          console.log('Copiado com execCommand!');
        } catch (err) {
          console.error('Falha ao copiar (execCommand):', err);
        }
        document.body.removeChild(textarea);
      });
    } else {
      // Fallback para execCommand
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        console.log('Copiado com execCommand!');
      } catch (err) {
        console.error('Falha ao copiar (execCommand):', err);
      }
      document.body.removeChild(textarea);
    }
  }
  
  // LOGS PARA DEPURAR - AGORA ELES DEVEM APARECER!
  console.log('AdminPanel - Leads recebidos (prop):', leads);
  console.log('AdminPanel - appliedRange (Filtro de Data):', appliedRange); // Log da data do filtro
  
  const leadsFiltradosPorDataEBusca = leads.filter(lead => {
    const d = parseISODate(lead.dataCadastro);
    const start = new Date(appliedRange[0].startDate);
    const end = new Date(appliedRange[0].endDate);
    start.setHours(0, 0, 0, 0); // Garante o início do dia
    end.setHours(23, 59, 59, 999); // Garante o fim do dia

    // CORRIGIDO: d deve ser uma data válida para a comparação
    const dataOk = d && d >= start && d <= end; 
    const buscaOk = lead.nome.toLowerCase().includes(busca.toLowerCase()) || (lead.cpf || "").replace(/\D/g, "").includes(busca.replace(/\D/g, ""));

    // NOVOS CONSOLE.LOGS DETALHADOS PARA DEPURAR O FILTRO!
    console.log(`--- Debug Filter para o Lead: ${lead.nome} ---`);
    console.log(`  lead.dataCadastro (string): ${lead.dataCadastro}`);
    console.log(`  Data do Lead (parseada - d): ${d ? d.toISOString() : 'Inválida/Nula'}`); // Mostrar 'Inválida'
    console.log(`  Data Início do Filtro (start): ${start.toISOString()}`);
    console.log(`  Data Fim do Filtro (end): ${end.toISOString()}`);
    console.log(`  Resultado dataOk (d >= start && d <= end): ${dataOk}`);
    console.log(`  Valor da busca: "${busca}"`);
    console.log(`  Resultado buscaOk: ${buscaOk}`);
    console.log(`  Resultado FINAL do filtro para este lead: ${dataOk && buscaOk}`);
    console.log(`-------------------------------------------`);

    // AGORA DEVOLVEMOS O FILTRO lead.status1 !== 'AGENDADO'
    // Esta tela é "Pré-Vendas", então não deve mostrar leads já AGENDADOS
    return dataOk && buscaOk && lead.status1 !== 'AGENDADO'; 
  });

  const resumo = resumoPorStatus(leadsFiltradosPorDataEBusca);

  // LOGS PARA DEPURAR
  console.log('AdminPanel - Leads após filtro de data/busca:', leadsFiltradosPorDataEBusca);

  // Mantenha o filtro de status, mas o foco é no filtro de data/busca para este teste
  const leadsFiltradosParaTabela = leadsFiltradosPorDataEBusca.filter(lead => {
    if (!statusFiltroResumo || statusFiltroResumo === "total") {
      return true;
    }
    if (statusFiltroResumo === "QUALIFY") {
      return lead.status1 && lead.status1.startsWith("QUALIFY");
    }
    return lead.status1 === statusFiltroResumo;
  });

  // LOGS PARA DEPURAR
  console.log('AdminPanel - Leads finais para tabela (com filtro de status):', leadsFiltradosParaTabela);


  // Função para alterar o status de um lead existente (interage com o backend)
  const handleStatusChange = async (lead, nextStatus) => {
    try {
      await onUpdateLead({ ...lead, status1: nextStatus }); // Chama a prop onUpdateLead
      setStatusMenuState({ open: false, leadId: null, position: {} });
      if (nextStatus === "CPF REPROVADO" || nextStatus === "CANCELADO") { setPendingStatusChange({ lead, nextStatus }); setObsObrig(lead.obs || ""); setShowObsObrigModal(true); return; }
      if (nextStatus === "AGENDADO") { setPendingStatusChange({ lead, nextStatus }); setContratoInput(""); const today = new Date().toISOString().split('T')[0]; setAgendarData(today); setAgendarTurno(""); setShowEsteiraModal(true); return; }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Falha ao alterar status. Verifique o console.");
    }
  };

  // Funções de salvamento que agora chamam as props do App.js
  const handleSaveObsObrig = async () => {
    if (!obsObrig.trim()) { alert("A observação é obrigatória para este status."); return; }
    try {
      const { lead, nextStatus } = pendingStatusChange;
      await onUpdateLead({ ...lead, obs: obsObrig, status1: nextStatus }); // Chama a prop onUpdateLead
      setShowObsObrigModal(false); setPendingStatusChange(null); setObsObrig("");
    } catch (error) {
      console.error("Erro ao salvar observação obrigatória:", error);
      alert("Falha ao salvar observação. Verifique o console.");
    }
  };

  const handleSaveEsteira = async () => {
    if (!contratoInput.trim() || !agendarData.trim() || !agendarTurno.trim()) { alert("Por favor, preencha todos os campos para o agendamento."); return; }
    try {
      const { lead, nextStatus } = pendingStatusChange;
      const statusInicialEsteira = "AGENDADO";
      await onUpdateLead({
        ...lead,
        status1: nextStatus,
        statusEsteira: statusInicialEsteira,
        contrato: contratoInput,
        dataAgendamento: agendarData.split('-').reverse().join('/'),
        turnoAgendamento: agendarTurno,
      }); // Chama a prop onUpdateLead
      setShowEsteiraModal(false); setPendingStatusChange(null);
    } catch (error) {
      console.error("Erro ao salvar agendamento na esteira:", error);
      alert("Falha ao agendar. Verifique o console.");
    }
  };
  
  function handleCancelStatusChange() { setShowObsObrigModal(false); setShowEsteiraModal(false); setPendingStatusChange(null); }
  
  // Ações de edição de infoExtra que agora chamam a prop onUpdateLead
  const handleInfoExtraChange = async (lead, value) => {
    try {
      await onUpdateLead({ ...lead, infoExtra: value });
    } catch (error) {
      console.error("Erro ao alterar info extra:", error);
      alert("Falha ao alterar info extra. Verifique o console.");
    }
  };

  const handleInfoExtraChangeEdit = (value) => { setLeadEdit(f => ({ ...f, infoExtra: value })); };
  
  const startEdit = (lead) => {
      setEditando(lead.id);
      const leadToEdit = { ...lead };
      if (leadToEdit.dataNascimento) {
          const parts = leadToEdit.dataNascimento.split('/');
          if (parts.length === 3) {
              leadToEdit.dataNascimento = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
      }
      setLeadEdit(leadToEdit);
  };

  const saveEdit = async (id) => {
    try {
      const leadData = { ...leadEdit };
      if (leadData.dataNascimento) {
          const parts = leadData.dataNascimento.split('-');
          if (parts.length === 3) {
              leadData.dataNascimento = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
      }
      await onUpdateLead({ ...leadData, id }); // Chama a prop onUpdateLead
      setEditando(null);
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Falha ao salvar edição. Verifique o console.");
    }
  };

  function cancelEdit() { setEditando(null); }
  
  const handleOpenObs = (lead) => { setObsLeadId(lead.id); setObsTemp(lead.obs || ""); setShowObsModal(true); };
  const handleCloseObs = () => { setShowObsModal(false); setObsLeadId(null); setObsTemp(""); };
  
  const salvarObs = async () => {
    try {
      // Busca o lead atualizado da lista para garantir que obsLeadId ainda é válido
      const leadToUpdate = leads.find(l => l.id === obsLeadId);
      if (leadToUpdate) {
        await onUpdateLead({ ...leadToUpdate, obs: obsTemp }); // Chama a prop onUpdateLead
      }
      handleCloseObs();
    } catch (error) {
      console.error("Erro ao salvar observação:", error);
      alert("Falha ao salvar observação. Verifique o console.");
    }
  };
  
  const handleNewLeadChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "dataNascimento" && value) {
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = value.split('-');
            newValue = `${day}/${month}/${year}`;
        }
    }
    setNewLeadData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSelectNewLeadStatus = (leadMock, statusSelected) => {
    setNewLeadData(prev => ({ ...prev, status1: statusSelected }));
    setNewLeadStatusMenuState({ open: false, position: {} }); // Garante que o menu feche
  };

  const handleSaveNewLead = async (e) => {
    e.preventDefault();
    // Validação agora inclui status1
    if (!newLeadData.nome || !newLeadData.cpf || !newLeadData.telefone || !newLeadData.plano || !newLeadData.status1) {
        alert("Nome, CPF, Telefone, Plano e Status Inicial são obrigatórios para um novo lead.");
        return;
    }

    try {
      const leadToSave = { ...newLeadData };
      const loggedInVendedor = "VENDEDOR AUTOMÁTICO"; // Simulação do vendedor logado

      const newLead = {
        ...initialNewLeadState, // Garante que todos os campos base existam
        ...leadToSave,
        id: Date.now().toString(), // ID como string para o DB
        dataCadastro: new Date().toISOString().slice(0, 10), // Sempre garante uma data de cadastro
        vendedor: loggedInVendedor,
        // Garante que campos não preenchidos no form tenham valores padrão
        dataAgendamento: leadToSave.dataAgendamento || null,
        dataNascimento: leadToSave.dataNascimento || null, // Garante que dataNascimento não seja undefined
        turnoAgendamento: leadToSave.turnoAgendamento || null,
        statusEsteira: leadToSave.statusEsteira || null,
        tecnico: leadToSave.tecnico || null,
        obs: leadToSave.obs || "",
        contrato: leadToSave.contrato || "",
        infoExtra: leadToSave.infoExtra || "",
        pontoReferencia: leadToSave.pontoReferencia || null, // Garante que não seja undefined
        linkLocalizacao: leadToSave.linkLocalizacao || null, // Garante que não seja undefined
        obsEndereco: leadToSave.obsEndereco || "", // Garante que não seja undefined
        origemVenda: leadToSave.origemVenda || null, // Garante que não seja undefined
        diaVencimento: leadToSave.diaVencimento || null, // Garante que não seja undefined
      };

      await onAddLead(newLead); // Chama a prop onAddLead para enviar ao backend
      setShowNewLeadModal(false);
      setNewLeadData(initialNewLeadState); // Reseta o formulário
    } catch (error) {
      console.error("Erro ao salvar novo lead:", error);
      alert("Falha ao cadastrar novo lead. Verifique o console.");
    }
  };
  
  const inputStyle = "w-full mt-1 px-3 py-1.5 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition";

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <aside className="bg-gray-200 w-60 flex flex-col py-6 px-4 min-h-screen text-gray-900 border-r border-gray-300">
        <div className="font-bold text-2xl mb-4 flex items-center gap-2">
          <FileBarChart2 className="w-7 h-7 text-green-500" /> Infinite Link
        </div>
        {/* BOTÃO 'NOVO LEAD' MOVIDO PARA AQUI PARA SER MAIS VISÍVEL E CLICÁVEL */}
        <button onClick={() => { setNewLeadData(initialNewLeadState); setShowNewLeadModal(true); }} className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg">
          <PlusCircle size={28} /> Novo Lead
        </button>
        <nav className="flex-1 flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-2 p-2 rounded-lg bg-green-100 text-green-700 font-semibold">
            <ListTodo className="w-5 h-5" /> Pré-Vendas
          </Link>
          <Link to="/esteira" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-300 transition">
            <Users className="w-5 h-5" /> Esteira Agendados
          </Link>
        </nav>
        <div className="mt-auto text-xs text-gray-600 pt-6 border-t border-gray-300">v3.7</div>
      </aside>
      
      <main className="flex-1 py-10 px-6 lg:px-16 bg-gray-100 min-h-screen">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3 relative">
            <div className="relative w-fit">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 shadow-sm bg-white hover:ring-2 hover:ring-green-400 transition" onClick={() => setShowPicker(!showPicker)} type="button"><CalendarDays className="w-5 h-5 text-green-600" /><span className="text-sm">{periodoLabel}</span></button>{showPicker && (<div className="absolute z-50 mt-2 shadow-2xl bg-white rounded p-3 border border-gray-300"><DateRange onChange={item => setRange([item.selection])} ranges={range} locale={ptBR} moveRangeOnFirstSelection={false} showDateDisplay={false} /><div className="flex justify-end gap-2 pt-2"><button className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm" onClick={handleCancel} type="button">Cancelar</button><button className="px-3 py-1 rounded bg-green-600 text-white text-sm" onClick={handleOk} type="button">Aplicar</button></div></div>)}
            </div>
            <UserSearch className="w-6 h-6 text-gray-400 ml-5" />
            <input type="text" placeholder="Buscar cliente por CPF ou nome" className="w-full md:w-96 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none bg-white text-gray-900" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          {/* Resumo por status (Total, Qualify, Financeira, Técnica, etc.) */}
          <div className="flex gap-3 flex-wrap">
            {resumoMap.map(({ key, label, color, icon: Icon }) => (
              // Mostra todos os status do resumo, mesmo se a contagem for zero.
              // O filtro de statusFiltroResumo será aplicado na variável 'leadsParaExibir'
              <div key={key} onClick={() => setStatusFiltroResumo(s => (s === key ? 'total' : key))} className={`rounded-xl shadow-md px-4 py-3 text-center min-w-[100px] border-2 border-transparent font-semibold cursor-pointer transition-all scale-100 ${color} ${statusFiltroResumo === key ? "ring-4 ring-green-400 scale-105 z-10 border-green-400" : "hover:scale-105 hover:border-green-400"}`} style={{ userSelect: "none" }}>
                    <div className="text-xs flex items-center justify-center gap-1">
                      {Icon && <Icon size={14} className="text-current" />}
                      {label}
                    </div>
                    <div className="text-xl font-bold">{resumo[key]}</div>
                  </div>
                ))}
              </div>
            </header>
            <div className="overflow-x-auto rounded-2xl shadow-lg bg-white border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50"><tr>{["Data Cadastro","Nome","CPF","UF","Vendedor","Status","Data Agendamento","Turno","Obs"].map(h => (<th key={h} className="py-3 px-4 font-semibold text-center align-middle">{h}</th>))}</tr></thead>
                <tbody>
                  {/* leadsFiltradosParaTabela agora é a fonte de dados para a tabela */}
                  {leadsFiltradosParaTabela.map((lead) => (
                    <React.Fragment key={lead.id}>
                      <tr className={`border-t border-gray-100 hover:bg-green-50 cursor-pointer transition-all`} onClick={() => setLeadExpandido(leadExpandido === lead.id ? null : lead.id)}>
                        <td className="py-2 px-4 text-center align-middle">{lead.dataCadastro ? String(lead.dataCadastro).split('-').reverse().join('/') : '-'}</td><td className="py-2 px-4 text-center align-middle font-medium">{lead.nome}</td><td className="py-2 px-4 text-center align-middle">{lead.cpf}</td><td className="py-2 px-4 text-center align-middle">{lead.uf}</td><td className="py-2 px-4 text-center align-middle">{lead.vendedor}</td>
                        <td className="py-2 px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setStatusMenuState({ open: true, leadId: lead.id, position: { top: rect.bottom + 5, left: rect.left } }); }} className={`px-4 py-1.5 text-sm w-full max-w-[220px] font-semibold rounded-full transition-transform hover:scale-105 ${statusPill[lead.status1] || "bg-gray-100 text-gray-900 border-gray-300"}`}>{lead.status1 || "Selecione"}</button>
                            <InfoExtraBadgeSelect value={lead.infoExtra} onChange={val => handleInfoExtraChange(lead, val)} />
                          </div>
                        </td>
                        <td className="py-2 px-4 text-center align-middle">{lead.dataAgendamento || '-'}</td><td className="py-2 px-4 text-center align-middle">{lead.turnoAgendamento || '-'}</td><td className="py-2 px-4 text-center align-middle" style={{maxWidth:160,whiteWhiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}><span className="cursor-pointer text-gray-600 hover:underline" onClick={e => { e.stopPropagation(); handleOpenObs(lead); }} title={lead.obs}>{lead.obs?.length > 30 ? (lead.obs.substring(0, 30) + "...") : (lead.obs || "-")}</span></td>
                      </tr>
                      {leadExpandido === lead.id && (<tr><td colSpan={9} className="bg-slate-50 border-b px-4 py-8 transition-all" onClick={e => e.stopPropagation()}>{editando === lead.id ? (<form onSubmit={e => { e.preventDefault(); saveEdit(lead.id); }}><div className="grid md:grid-cols-3 gap-x-6 gap-y-4"><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Dados do Cliente</div><div><label htmlFor="edit-nome" className="block text-sm font-medium text-gray-700">Nome</label><input id="edit-nome" type="text" className={inputStyle} value={leadEdit.nome || ''} onChange={e => setLeadEdit(f => ({...f, nome: e.target.value}))} /></div><div><label htmlFor="edit-cpf" className="block text-sm font-medium text-gray-700">CPF / CNPJ</label><input id="edit-cpf" type="text" className={inputStyle} value={leadEdit.cpf || ''} onChange={e => setLeadEdit(f => ({...f, cpf: e.target.value}))} /></div><div><label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label><input id="edit-email" type="email" className={inputStyle} value={leadEdit.email || ''} onChange={e => setLeadEdit(f => ({...f, email: e.target.value}))} /></div><div><label htmlFor="edit-nascimento" className="block text-sm font-medium text-gray-700">Data de Nascimento</label><input id="edit-nascimento" type="date" className={inputStyle} value={leadEdit.dataNascimento || ''} onChange={e => setLeadEdit(f => ({...f, dataNascimento: e.target.value}))} /></div><div><label htmlFor="edit-tel1" className="block text-sm font-medium text-gray-700">Telefone 1</label><input id="edit-tel1" type="text" className={inputStyle} value={leadEdit.telefone || ''} onChange={e => setLeadEdit(f => ({...f, telefone: e.target.value}))} /></div><div><label htmlFor="edit-tel2" className="block text-sm font-medium text-gray-700">Telefone 2</label><input id="edit-tel2" type="text" className={inputStyle} value={leadEdit.telefone2 || ''} onChange={e => setLeadEdit(f => ({...f, telefone2: e.target.value}))} /></div></div><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Endereço do Cliente</div><div><label htmlFor="edit-uf" className="block text-sm font-medium text-gray-700">UF</label><input id="edit-uf" type="text" className={inputStyle} value={leadEdit.uf || ''} onChange={e => setLeadEdit(f => ({...f, uf: e.target.value}))} /></div><div><label htmlFor="edit-cep" className="block text-sm font-medium text-gray-700">CEP</label><input id="edit-cep" type="text" className={inputStyle} value={leadEdit.cep || ''} onChange={e => setLeadEdit(f => ({...f, cep: e.target.value}))} /></div><div><label htmlFor="edit-rua" className="block text-sm font-medium text-gray-700">Nome da Rua</label><input id="edit-rua" type="text" className={inputStyle} value={leadEdit.rua || ''} onChange={e => setLeadEdit(f => ({...f, rua: e.target.value}))} /></div><div><label htmlFor="edit-numero" className="block text-sm font-medium text-gray-700">Número</label><input id="edit-numero" type="text" className={inputStyle} value={leadEdit.numero || ''} onChange={e => setLeadEdit(f => ({...f, numero: e.target.value}))} /></div><div><label htmlFor="edit-complemento" className="block text-sm font-medium text-gray-700">Complemento</label><input id="edit-complemento" type="text" className={inputStyle} value={leadEdit.complemento || ''} onChange={e => setLeadEdit(f => ({...f, complemento: e.target.value}))} /></div><div><label htmlFor="edit-bairro" className="block text-sm font-medium text-gray-700">Bairro</label><input id="edit-bairro" type="text" className={inputStyle} value={leadEdit.bairro || ''} onChange={e => setLeadEdit(f => ({...f, bairro: e.target.value}))} /></div><div><label htmlFor="edit-cidade" className="block text-sm font-medium text-gray-700">Cidade</label><input id="edit-cidade" type="text" className={inputStyle} value={leadEdit.cidade || ''} onChange={e => setLeadEdit(f => ({...f, cidade: e.target.value}))} /></div><div><label htmlFor="edit-pontoReferencia" className="block text-sm font-medium text-gray-700">Ponto de Referência</label><input id="edit-pontoReferencia" type="text" className={inputStyle} value={leadEdit.pontoReferencia || ''} onChange={e => setLeadEdit(f => ({...f, pontoReferencia: e.target.value}))} /></div><div><label htmlFor="edit-linkLocalizacao" className="block text-sm font-medium text-gray-700">Link de Localização</label><input id="edit-linkLocalizacao" type="text" className={inputStyle} value={leadEdit.linkLocalizacao || ''} onChange={e => setLeadEdit(f => ({...f, linkLocalizacao: e.target.value}))} /></div><div><label htmlFor="edit-obsEndereco" className="block text-sm font-medium text-gray-700">Obs. Endereço</label><textarea id="edit-obsEndereco" className={inputStyle} rows="2" value={leadEdit.obsEndereco || ''} onChange={e => setLeadEdit(f => ({...f, obsEndereco: e.target.value}))}></textarea></div></div><div className="shadow-lg rounded-xl p-6 bg-white border border-green-100 space-y-4"><div className="font-bold text-green-600 text-lg">Dados da Venda</div><div><label htmlFor="edit-plano" className="block text-sm font-medium text-gray-700">Plano</label><input id="edit-plano" type="text" className={inputStyle} value={leadEdit.plano || ''} onChange={e => setLeadEdit(f => ({...f, plano: e.target.value}))} /></div>{/* Campo Vendedor Removido */}<div><label htmlFor="edit-origemVenda" className="block text-sm font-medium text-gray-700">Origem da Venda</label><input id="edit-origemVenda" type="text" className={inputStyle} value={leadEdit.origemVenda || ''} onChange={e => setLeadEdit(f => ({...f, origemVenda: e.target.value}))} /></div><div><label htmlFor="edit-diaVencimento" className="block text-sm font-medium text-gray-700">Dia do Vencimento</label><input id="edit-diaVencimento" type="text" className={inputStyle} value={leadEdit.diaVencimento || ''} onChange={e => setLeadEdit(f => ({...f, diaVencimento: e.target.value}))} /></div><div><label htmlFor="edit-contrato" className="block text-sm font-medium text-gray-700">Contrato</label><input id="edit-contrato" type="text" className={inputStyle} value={leadEdit.contrato || ''} onChange={e => setLeadEdit(f => ({...f, contrato: e.target.value}))} /></div><div><label htmlFor="edit-infoExtra" className="block text-sm font-medium text-gray-700">Info Extra</label><InfoExtraBadgeSelect value={leadEdit.infoExtra} onChange={handleInfoExtraChangeEdit} /></div></div></div><div className="flex justify-center gap-4 mt-8"><button className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg" type="submit">Salvar</button><button className="px-8 py-2 rounded-lg bg-gray-300 text-gray-800 font-bold hover:bg-gray-400 transition" type="button" onClick={cancelEdit}>Cancelar</button></div></form>) : (<><div className="grid md:grid-cols-3 gap-6"><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Dados do Cliente</h3><div><span className="font-semibold">Nome / Razão Social:</span> {lead.nome}</div><div><span className="font-semibold">CPF / CNPJ:</span> {lead.cpf}</div><div><span className="font-semibold">Email:</span> {lead.email || "-"}</div><div><span className="font-semibold">Data de Nascimento:</span> {lead.dataNascimento || "-"}</div><div><span className="font-semibold">Telefone 1:</span> {lead.telefone || "-"}</div><div><span className="font-semibold">Telefone 2:</span> {lead.telefone2 || "-"}</div></div><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Endereço do Cliente</h3><div><span className="font-semibold">UF:</span> {lead.uf}</div><div><span className="font-semibold">CEP:</span> {lead.cep}</div><div><span className="font-semibold">Nome da Rua:</span> {lead.rua}</div><div><span className="font-semibold">Número:</span> {lead.numero}</div><div><span className="font-semibold">Complemento:</span> {lead.complemento}</div><div><span className="font-semibold">Bairro:</span> {lead.bairro}</div><div><span className="font-semibold">Cidade:</span> {lead.cidade}</div><div><span className="font-semibold">Ponto de Referência:</span> {lead.pontoReferencia || "-"}</div><div className="flex items-center gap-2"><span className="font-semibold">Link de Localização:</span>{lead.linkLocalizacao ? (<><a className="underline text-blue-700" href={lead.linkLocalizacao} target="_blank" rel="noopener noreferrer">Abrir Mapa</a><button type="button" title="Copiar link" className="text-blue-700" onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.linkLocalizacao); }}><Copy size={18} /></button></>) : <span>-</span>}</div><div><span className="font-semibold">Obs. Endereço:</span> {lead.obsEndereco || "-"}</div></div><div className="bg-white shadow-md rounded-lg p-5 space-y-2"><h3 className="font-bold mb-3 text-green-600 text-lg">Dados da Venda</h3><div><span className="font-semibold">Data do Cadastro:</span> {lead.dataCadastro.split('-').reverse().join('/')}</div><div className="flex items-center gap-2"><ShoppingBag size={16}/><span className="font-semibold">Vendedor:</span> {lead.vendedor}</div><div><span className="font-semibold">Plano:</span> {lead.plano}</div><div><span className="font-semibold">Origem da venda:</span> {lead.origemVenda}</div><div><span className="font-semibold">Dia do Vencimento:</span> {lead.diaVencimento}</div><div><span className="font-semibold">Agendamento:</span> {lead.dataAgendamento} - {lead.turnoAgendamento}</div></div></div>{/* NOVA SEÇÃO DE OBSERVAÇÃO PARA PRÉ-VENDAS (diferente da Esteira) */}{lead.obs && (<div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm cursor-pointer" onClick={(e) => {e.stopPropagation(); handleOpenObs(lead);}}><h3 className="font-bold mb-2 text-gray-700 text-lg flex items-center gap-2"><MessageSquareText size={20} className="text-gray-500" /> Observações</h3><p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.obs}</p></div>)}{/* ... DADOS EXPANDIDOS ... */}<div className="mt-8 flex justify-center"><button className="px-8 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg" onClick={(e) => {e.stopPropagation(); startEdit(lead)}}>Editar Ficha</button></div></>)}</td></tr>)}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      
      {/* Menu de Status para leads existentes (da tabela) */}
      {statusMenuState.open && <StatusMenu lead={leads.find(l => l.id === statusMenuState.leadId)} onStatusChange={handleStatusChange} onClose={() => setStatusMenuState({ open: false, leadId: null, position: {} })} position={statusMenuState.position} />}
      
      {showObsModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein"><div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Editar Observação</h3><button onClick={handleCloseObs} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" rows="5" value={obsTemp} onChange={(e) => setObsTemp(e.target.value)} placeholder="Digite a observação do lead..."></textarea><div className="flex justify-end gap-3 mt-6"><button onClick={handleCloseObs} type="button" className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">Cancelar</button><button onClick={salvarObs} type="button" className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">Salvar</button></div></div></div>)}
      {showObsObrigModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein"><div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md"><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-800">Observação Obrigatória</h3><button onClick={handleCancelStatusChange} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><p className="text-sm text-gray-600 mb-4">Para mover o lead para o status <strong className="font-semibold">{pendingStatusChange?.nextStatus}</strong>, é necessário adicionar uma observação.</p><textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" rows="4" value={obsObrig} onChange={(e) => setObsObrig(e.target.value)} placeholder="Digite o motivo ou a observação aqui..."></textarea><div className="flex justify-end gap-3 mt-6"><button onClick={handleCancelStatusChange} type="button" className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">Cancelar</button><button onClick={handleSaveObsObrig} type="button" className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">Salvar e Alterar Status</button></div></div></div>)}
      
      {/* BOTÃO FLUTUANTE NOVO LEAD (FAB) */}
      <button
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl shadow-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-110"
        onClick={() => { setNewLeadData(initialNewLeadState); setShowNewLeadModal(true); }}
        title="Cadastrar Novo Lead"
      >
        <PlusCircle size={28} />
      </button>

      {/* NOVO MODAL DE CADASTRO DE LEAD - REESTRUTURADO */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Cadastrar Novo Lead</h3>
              <button onClick={() => setShowNewLeadModal(false)} className="text-gray-500 hover:text-gray-800"><X size={28} /></button>
            </div>
            <form onSubmit={handleSaveNewLead}>          
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
                {/* Dados Pessoais */}
                <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                  <h4 className="font-semibold text-lg text-green-600">Dados Pessoais</h4>
                  <div><label className="text-sm">Nome Completo <span className="text-red-500">*</span></label><input name="nome" value={newLeadData.nome} onChange={handleNewLeadChange} className={inputStyle} required /></div>
                  <div><label className="text-sm">CPF <span className="text-red-500">*</span></label><input name="cpf" value={newLeadData.cpf} onChange={handleNewLeadChange} className={inputStyle} required /></div>
                  <div><label className="text-sm">Email</label><input name="email" type="email" value={newLeadData.email} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Data de Nascimento</label><input name="dataNascimento" type="date" value={newLeadData.dataNascimento} onChange={e => handleNewLeadChange({ target: { name: 'dataNascimento', value: e.target.value } })} className={inputStyle} /></div>
                  <div><label className="text-sm">Telefone 1 <span className="text-red-500">*</span></label><input name="telefone" value={newLeadData.telefone} onChange={handleNewLeadChange} className={inputStyle} required /></div>
                  <div><label className="text-sm">Telefone 2</label><input name="telefone2" value={newLeadData.telefone2} onChange={handleNewLeadChange} className={inputStyle} /></div>
                </div>

                {/* Endereço */}
                <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                  <h4 className="font-semibold text-lg text-green-600">Endereço</h4>
                  <div><label className="text-sm">UF</label><input name="uf" value={newLeadData.uf} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">CEP</label><input name="cep" value={newLeadData.cep} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Rua</label><input name="rua" value={newLeadData.rua} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Número</label><input name="numero" value={newLeadData.numero} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Complemento</label><input name="complemento" value={newLeadData.complemento} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Bairro</label><input name="bairro" value={newLeadData.bairro} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Cidade</label><input name="cidade" value={newLeadData.cidade} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Ponto de Referência</label><input name="pontoReferencia" value={newLeadData.pontoReferencia} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Link de Localização</label><input name="linkLocalizacao" value={newLeadData.linkLocalizacao} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Obs. Endereço</label><textarea name="obsEndereco" rows="2" value={newLeadData.obsEndereco} onChange={handleNewLeadChange} className={inputStyle}></textarea></div>
                </div>

                {/* Dados da Venda */}
                <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
                  <h4 className="font-semibold text-lg text-green-600">Dados da Venda</h4>
                  <div><label className="text-sm">Plano <span className="text-red-500">*</span></label><input name="plano" value={newLeadData.plano} onChange={handleNewLeadChange} className={inputStyle} required /></div>
                  <div><label className="text-sm">Origem da Venda</label><input name="origemVenda" value={newLeadData.origemVenda} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Dia do Vencimento</label><input name="diaVencimento" value={newLeadData.diaVencimento} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div><label className="text-sm">Contrato</label><input name="contrato" value={newLeadData.contrato} onChange={handleNewLeadChange} className={inputStyle} /></div>
                  <div>
                    <label className="text-sm">Status Inicial <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <button
                        type="button"
                        ref={newLeadStatusButtonRef}
                        className={`px-4 py-1.5 text-sm w-full font-semibold rounded-md transition ${newLeadData.status1 ? (statusPill[newLeadData.status1] || "bg-gray-100 text-gray-900 border-gray-300") : "bg-gray-100 text-gray-700 border-gray-300"}`} // Estilo para quando status1 é vazio
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = newLeadStatusButtonRef.current.getBoundingClientRect();
                          setNewLeadStatusMenuState({ open: true, position: { top: rect.bottom + 5, left: rect.left } });
                        }}
                      >
                        {newLeadData.status1 || "Selecione"}
                      </button>
                      {newLeadStatusMenuState.open && createPortal(
                          <StatusMenu
                              lead={{ status1: newLeadData.status1, id: 'new-lead-mock' }}
                              onStatusChange={handleSelectNewLeadStatus}
                              onClose={() => setNewLeadStatusMenuState({ open: false, position: {} })}
                              position={newLeadStatusMenuState.position}
                              statusOptions={["FINANCEIRA", "TÉCNICA"]} // Apenas estes status
                          />,
                          document.body
                      )}
                  </div>
                  <div><label className="text-sm">Info Extra</label><InfoExtraBadgeSelect value={newLeadData.infoExtra} onChange={(val) => handleNewLeadChange({ target: { name: 'infoExtra', value: val } })} /></div>
                  <div><label className="text-sm">Observação Geral</label><textarea name="obs" rows="2" value={newLeadData.obs} onChange={handleNewLeadChange} className={inputStyle}></textarea></div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-bold">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEsteiraModal && ( // Início do showEsteiraModal
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadein">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Agendar Instalação</h3>
              <button onClick={handleCancelStatusChange} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Preencha os dados abaixo para concluir o agendamento do lead.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Contrato</label>
                <input type="text" value={contratoInput} onChange={e => setContratoInput(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Agendamento</label>
                <input type="date" value={agendarData} onChange={e => setAgendarData(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                <select value={agendarTurno} onChange={e => setAgendarTurno(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"><option value="">Selecione o turno</option><option value="Manhã">Manhã (08h-12h)</option><option value="Tarde">Tarde (13h-18h)</option></select></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={handleCancelStatusChange} type="button" className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">Cancelar</button><button onClick={handleSaveEsteira} type="button" className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition">Salvar e Agendar</button></div></div></div>)}
    </div>
  );
}
