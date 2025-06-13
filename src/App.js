// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; 
import AdminPanel from './AdminPanel';
import Esteira from './Esteira';

// Definir la URL base del backend aquí
const API_BASE_URL = 'https://crm-infinitelink-c690f7b9da6e.herokuapp.com'; // Su URL de Heroku

// Leads mockeados con dataCadastro en formato ISO (YYYY-MM-DD)
const leadsMock = [
  { id: "1", dataCadastro: "2025-06-11", nome: "JOSE RICARDO DE JESUS", cpf: "01306884527", email: "jessicasantos124590@gmail.com", dataNascimento: "1984-08-20", telefone: "79996868088", telefone2: "79998117476", uf: "SE", ciudad: "Aracaju", plano: "GIGA", vendedor: "MIGUEL PREISGIKE PINTO", dataAgendamento: null, turnoAgendamento: null, status1: "QUALIFY - PEDIR DOCUMENTOS", statusEsteira: null, tecnico: null, obs: "Cliente en análisis de crédito. Score bajo, esperando documento adicional.", contrato: "", infoExtra: "PENDENCIA", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "2", dataCadastro: "2025-06-11", nome: "Maria Souza", cpf: "98765432100", email: "maria@email.com", dataNascimento: "1990-09-05", telefone: "27988881111", telefone2: "", uf: "ES", ciudad: "Vitória", plano: "FIBRA 400MB", vendedor: "Maria Ventas", dataAgendamento: "2025-06-18", turnoAgendamento: "Tarde", status1: "AGENDADO", statusEsteira: "PENDENCIA", tecnico: "Carlos Silva", obs: "Cliente informa que el poste frente a la residencia tiene la numeración borrada. Pidió llamar antes de ir.", contrato: "554433", infoExtra: "TRATANDO", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "3", dataCadastro: "2025-06-10", nome: "João Silva", cpf: "12345678901", email: "joao@email.com", dataNascimento: "1985-03-15", telefone: "11999998888", telefone2: "", uf: "SP", ciudad: "São Paulo", plano: "FIBRA 500MB", vendedor: "Vendedor Prueba", dataAgendamento: null, turnoAgendamento: null, status1: "FINANCEIRA", statusEsteira: null, tecnico: null, obs: "Esperando aprobación financiera.", contrato: "", infoExtra: "", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "4", dataCadastro: "2025-06-09", nome: "Carlos Andrade", cpf: "44455566677", email: "carlos.a@email.com", dataNascimento: "1980-07-22", telefone: "11988887777", telefone2: "", uf: "SP", ciudad: "São Paulo", plano: "GIGA 1GB", vendedor: "Maria Ventas", dataAgendamento: "2025-06-14", turnoAgendamento: "Tarde", status1: "AGENDADO", statusEsteira: "CLEAN UP", tecnico: "Marcos Andrade", obs: "Instalación completada con éxito. Cliente satisfecho. Solo pendiente la baja en el sistema Giga+.", contrato: "998877", infoExtra: "", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "5", dataCadastro: "2025-06-08", nome: "Beatriz Lima", cpf: "77766655544", email: "beatriz@email.com", dataNascimento: "1992-11-30", telefone: "31977776666", telefone2: "", uf: "MG", ciudad: "Belo Horizonte", plano: "FIBRA 300MB", vendedor: "Pedro Ventas", dataAgendamento: null, turnoAgendamento: null, status1: "TÉCNICA", statusEsteira: null, tecnico: null, obs: "Problema técnico en la calle, esperando equipo externo.", contrato: "", infoExtra: "TRATANDO", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "6", dataCadastro: "2025-06-07", nome: "Fernando Costa", cpf: "11122233344", email: "fernando@email.com", dataNascimento: "1975-01-01", telefone: "41966665555", telefone2: "", uf: "PR", ciudad: "Curitiba", plano: "GIGA", vendedor: "Ana Ventas", dataAgendamento: null, turnoAgendamento: null, status1: "CPF REPROBADO", statusEsteira: null, tecnico: null, obs: "CPF con restricciones, cliente no aprobado.", contrato: "", infoExtra: "", puntoReferencia: null, linkLocalizacion: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "7", dataCadastro: "2025-06-06", nome: "Gabriela Mendes", cpf: "00011122233", email: "gabriela@email.com", dataNascimento: "1988-04-25", telefone: "81955554444", telefone2: "", uf: "PE", ciudad: "Recife", plano: "FIBRA 200MB", vendedor: "Mariana Prueba", dataAgendamento: "2025-06-13", turnoAgendamento: "Manhã", status1: "AGENDADO", statusEsteira: "AGENDADO", tecnico: "João Técnico", obs: "Confirmado con cliente.", contrato: "123456", infoExtra: "", puntoReferencia: null, linkLocalizacao: null, obsEndereco: null, origenVenda: null, diaVencimiento: null },
  { id: "8", dataCadastro: "2025-06-05", nome: "Hélder Almeida", cpf: "99988877766", email: "helder@email.com", dataNascimento: "1993-08-12", telefone: "51944443333", telefone2: "", uf: "RS", ciudad: "Porto Alegre", plano: "GIGA 700MB", vendedor: "Pedro Ventas", dataAgendamento: null, turnoAgendamento: null, status1: "CANCELADO", statusEsteira: null, tecnico: null, obs: "Cliente canceló la instalación.", contrato: "", infoExtra: "", puntoReferencia: null, linkLocalizacao: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
  { id: "9", dataCadastro: "2025-06-04", nome: "Isabela Rocha", cpf: "33322211100", email: "isabela@email.com", dataNascimento: "1991-02-18", telefone: "61933332222", telefone2: "", uf: "DF", ciudad: "Brasília", plano: "FIBRA 1GB", vendedor: "Vendedor Prueba", dataAgendamento: null, turnoAgendamento: null, status1: "QUALIFY - DOCUMENTOS ENVIADOS", statusEsteira: null, tecnico: null, obs: "Documentos en análisis final.", contrato: "", infoExtra: "PENDENCIA", puntoReferencia: null, linkLocalizacao: null, obsEndereco: null, origenVenta: null, diaVencimiento: null },
];

function App() {
  const [leads, setLeads] = useState([]); // Inicia con array vacío para buscar del backend

  // Función para buscar leads del backend
  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Opcional: Si el backend retorna un array vacío, usa los mockeados para desarrollo local
      // Solo para asegurar que siempre tengas datos para trabajar si la DB está vacía.
      // En producción, esto no es necesario si la DB tiene datos reales.
      setLeads(data.length > 0 ? data : leadsMock); 
    } catch (error) {
      console.error("Error al buscar leads:", error);
      // En caso de error en la búsqueda, aún muestra los leads mockeados para no tener pantalla vacía
      setLeads(leadsMock); 
    }
  };

  // Carga los leads una vez al montar el componente
  useEffect(() => {
    fetchLeads();
  }, []); // El array vacío [] como dependencia asegura que la función se ejecute solo una vez

  // --- Funciones que interactúan con el Backend ---

  // Función para agregar un nuevo lead a través de la API
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
      // Si la adición es exitosa, recarga la lista de leads del backend
      await fetchLeads(); 
      return await response.json();
    } catch (error) {
      console.error("Error al agregar lead:", error);
      alert("Error al agregar lead: " + error.message);
      throw error;
    }
  };

  // Función para actualizar un lead existente a través de la API
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
      // Si la actualización es exitosa, recarga la lista de leads del backend
      await fetchLeads(); 
      return await response.json();
    } catch (error) {
      console.error("Error al actualizar lead:", error);
      alert("Error al actualizar lead: " + error.message);
      throw error;
    }
  };

  // Función para eliminar un lead a través de la API
  const handleDeleteLead = async (leadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Si la eliminación es exitosa, recarga la lista de leads del backend
      await fetchLeads(); 
    } catch (error) {
      console.error("Error al eliminar lead:", error);
      alert("Error al eliminar lead: " + error.message);
      throw error;
    }
  };

  return (
    <Routes>
      {/* Pasamos el estado 'leads' y las nuevas funciones de interacción con el backend */}
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
