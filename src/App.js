// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; 
import AdminPanel from './AdminPanel';
import Esteira from './Esteira';

// Definir a URL base do backend aqui
const API_BASE_URL = 'https://crm-infinitelink-c690f7b9da6e.herokuapp.com'; // Sua URL do Heroku

// Leads mockados com dataCadastro no formato YYYY-MM-DD
const leadsMock = [
  { id: "1", dataCadastro: "2025-06-11", nome: "JOSE RICARDO DE JESUS", cpf: "01306884527", email: "jessicasantos124590@gmail.com", dataNascimento: "1984-08-20", telefone: "79996868088", telefone2: "79998117476", uf: "SE", cidade: "Aracaju", plano: "GIGA", vendedor: "MIGUEL PREISGIKE PINTO", dataAgendamento: null, turnoAgendamento: null, status1: "QUALIFY - PEDIR DOCUMENTOS", statusEsteira: null, tecnico: null, obs: "Cliente em análise de crédito. Score baixo, aguardando documento adicional.", contrato: "", infoExtra: "PENDENCIA", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "2", dataCadastro: "2025-06-11", nome: "Maria Souza", cpf: "98765432100", email: "maria@email.com", dataNascimento: "1990-09-05", telefone: "27988881111", telefone2: "", uf: "ES", cidade: "Vitória", plano: "FIBRA 400MB", vendedor: "Maria Vendas", dataAgendamento: "18/06/2025", turnoAgendamento: "Tarde", status1: "AGENDADO", statusEsteira: "PENDENCIA", tecnico: "Carlos Silva", obs: "Cliente informa que o poste em frente à residência está com a numeração apagada. Pediu para ligar antes de ir.", contrato: "554433", infoExtra: "TRATANDO", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "3", dataCadastro: "2025-06-10", nome: "João Silva", cpf: "12345678901", email: "joao@email.com", dataNascimento: "1985-03-15", telefone: "11999998888", telefone2: "", uf: "SP", cidade: "São Paulo", plano: "FIBRA 500MB", vendedor: "Vendedor Teste", dataAgendamento: null, turnoAgendamento: null, status1: "FINANCEIRA", statusEsteira: null, tecnico: null, obs: "Aguardando aprovação financeira.", contrato: "", infoExtra: "", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "4", dataCadastro: "2025-06-09", nome: "Carlos Andrade", cpf: "44455566677", email: "carlos.a@email.com", dataNascimento: "1980-07-22", telefone: "11988887777", telefone2: "", uf: "SP", cidade: "São Paulo", plano: "GIGA 1GB", vendedor: "Maria Vendas", dataAgendamento: "14/06/2025", turnoAgendamento: "Tarde", status1: "AGENDADO", statusEsteira: "CLEAN UP", tecnico: "Marcos Andrade", obs: "Instalação concluída com sucesso. Cliente satisfeito. Pendente apenas a baixa no sistema Giga+.", contrato: "998877", infoExtra: "", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "5", dataCadastro: "2025-06-08", nome: "Beatriz Lima", cpf: "77766655544", email: "beatriz@email.com", dataNascimento: "1992-11-30", telefone: "31977776666", telefone2: "", uf: "MG", cidade: "Belo Horizonte", plano: "FIBRA 300MB", vendedor: "Pedro Sales", dataAgendamento: null, turnoAgendamento: null, status1: "TÉCNICA", statusEsteira: null, tecnico: null, obs: "Problema técnico na rua, aguardando equipe externa.", contrato: "", infoExtra: "TRATANDO", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "6", dataCadastro: "2025-06-07", nome: "Fernando Costa", cpf: "11122233344", email: "fernando@email.com", dataNascimento: "1975-01-01", telefone: "41966665555", telefone2: "", uf: "PR", cidade: "Curitiba", plano: "GIGA", vendedor: "Ana Vendas", dataAgendamento: null, turnoAgendamento: null, status1: "CPF REPROVADO", statusEsteira: null, tecnico: null, obs: "CPF com restrições, cliente não aprovado.", contrato: "", infoExtra: "", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "7", dataCadastro: "2025-06-06", nome: "Gabriela Mendes", cpf: "00011122233", email: "gabriela@email.com", dataNascimento: "1988-04-25", telefone: "81955554444", telefone2: "", uf: "PE", cidade: "Recife", plano: "FIBRA 200MB", vendedor: "Mariana Teste", dataAgendamento: "13/06/2025", turnoAgendamento: "Manhã", status1: "AGENDADO", statusEsteira: "AGENDADO", tecnico: "João Técnico", obs: "Confirmado com cliente.", contrato: "123456", infoExtra: "", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "8", dataCadastro: "2025-06-05", nome: "Hélder Almeida", cpf: "99988877766", email: "helder@email.com", dataNascimento: "1993-08-12", telefone: "51944443333", telefone2: "", uf: "RS", cidade: "Porto Alegre", plano: "GIGA 700MB", vendedor: "Pedro Sales", dataAgendamento: null, turnoAgendamento: null, status1: "CANCELADO", statusEsteira: null, tecnico: null, obs: "Cliente cancelou a instalação.", contrato: "", infoExtra: "", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
  { id: "9", dataCadastro: "2025-06-04", nome: "Isabela Rocha", cpf: "33322211100", email: "isabela@email.com", dataNascimento: "1991-02-18", telefone: "61933332222", telefone2: "", uf: "DF", cidade: "Brasília", plano: "FIBRA 1GB", vendedor: "Vendedor Teste", dataAgendamento: null, turnoAgendamento: null, status1: "QUALIFY - DOCUMENTOS ENVIADOS", statusEsteira: null, tecnico: null, obs: "Documentos em análise final.", contrato: "", infoExtra: "PENDENCIA", pontoReferencia: null, linkLocalizacao: null, obsEndereco: null, origemVenda: null, diaVencimento: null },
];

function App() {
  // Comentado o leadsMock para que os dados venham do backend
  const [leads, setLeads] = useState([]); 

  // Função para buscar leads do backend
  const fetchLeads = async () => {
    try {
      // Requisição GET para o endpoint de leads do backend
      const response = await fetch(`${API_BASE_URL}/api/leads`); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeads(data); // Atualiza o estado com os leads do banco de dados
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    }
  };

  // Carrega os leads uma vez ao montar o componente
  useEffect(() => {
    fetchLeads();
  }, []);

  // --- Funções que interagem com o Backend ---

  // Função para adicionar um novo lead via API
  const handleAddLead = async (newLeadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLeadData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Se a adição for bem-sucedida, recarrega a lista de leads do backend
      await fetchLeads(); 
      return await response.json();
    } catch (error) {
      console.error("Erro ao adicionar lead:", error);
      alert("Erro ao adicionar lead: " + error.message);
      throw error;
    }
  };

  // Função para atualizar um lead existente via API
  const handleUpdateLead = async (updatedLeadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${updatedLeadData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedLeadData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Se a atualização for bem-sucedida, recarrega a lista de leads do backend
      await fetchLeads(); 
      return await response.json();
    } catch (error) {
      console.error("Erro ao atualizar lead:", error);
      alert("Erro ao atualizar lead: " + error.message);
      throw error;
    }
  };

  // Função para deletar um lead via API
  const handleDeleteLead = async (leadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Se a exclusão for bem-sucedida, recarrega a lista de leads do backend
      await fetchLeads(); 
    } catch (error) {
      console.error("Erro ao deletar lead:", error);
      alert("Erro ao deletar lead: " + error.message);
      throw error;
    }
  };

  return (
    <Routes>
      {/* Passamos o estado 'leads' e as novas funções de interação com o backend */}
      <Route 
        path="/" 
        element={
          <AdminPanel 
            leads={leads} 
            onAddLead={handleAddLead} 
            onUpdateLead={handleUpdateLead} 
            onDeleteLead={handleDeleteLead} 
          />
        } 
      />
      <Route 
        path="/esteira" 
        element={
          <Esteira 
            leads={leads} 
            onUpdateLead={handleUpdateLead} 
            onDeleteLead={handleDeleteLead} 
          />
        } 
      />
    </Routes>
  );
}

export default App;
