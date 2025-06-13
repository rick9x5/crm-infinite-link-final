// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; 
import AdminPanel from './AdminPanel';
import Esteira from './Esteira';

// Definir a URL base do backend aqui
const API_BASE_URL = 'https://crm-infinitelink-c690f7b9da6e.herokuapp.com';

function App() {
  const [leads, setLeads] = useState([]); // Inicia com array vazio, os dados virão do backend

  // Função para buscar leads do backend
  const fetchLeads = async () => {
    try {
      // Requisição GET para o endpoint de leads do backend
      const response = await fetch(`${API_BASE_URL}/api/leads`); // Usando a URL do Heroku
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLeads(data); // Atualiza o estado com os leads do banco de dados
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      // Opcional: Você pode adicionar aqui uma notificação para o usuário sobre o erro
    }
  };

  // Carrega os leads uma vez ao montar o componente
  useEffect(() => {
    fetchLeads();
  }, []); // O array vazio [] como dependência garante que a função execute apenas uma vez

  // --- Funções que interagem com o Backend ---

  // Função para adicionar um novo lead via API
  const handleAddLead = async (newLeadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`, { // Usando a URL do Heroku
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
      // Opcional: retornar o lead adicionado se o componente que chamou precisar
      return await response.json();
    } catch (error) {
      console.error("Erro ao adicionar lead:", error);
      alert("Erro ao adicionar lead: " + error.message); // Notificação simples
      throw error; // Rejeita o erro para ser tratado no componente que chamou
    }
  };

  // Função para atualizar um lead existente via API
  const handleUpdateLead = async (updatedLeadData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${updatedLeadData.id}`, { // Usando a URL do Heroku
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
      // Opcional: retornar o lead atualizado
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
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, { // Usando a URL do Heroku
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
            onDeleteLead={handleDeleteLead} // Passando para o AdminPanel caso precise deletar
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