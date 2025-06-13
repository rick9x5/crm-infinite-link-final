// backend/server.js
const express = require('express');
const cors = require('cors');
const { Client } = require('pg'); // Apenas pg, sem better-sqlite3

const app = express();
const PORT = process.env.PORT || 5000;

let db; // Variável global para a instância do banco de dados
let pgClient; // Variável para a instância do cliente PostgreSQL

// --- Middlewares ---
// Configuração do CORS para permitir o frontend do Vercel
app.use(cors({
  origin: 'https://crm-infinite-link-final.vercel.app', // <--- SUA URL EXATA DO VERCEL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// --- Inicialização do Banco de Dados (Assíncrona para PostgreSQL) ---
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
      // Se não houver DATABASE_URL (ambiente local de dev)
      console.log('Backend: Usando SQLite local para desenvolvimento.');
      const Database = require('better-sqlite3'); // Carrega better-sqlite3 apenas aqui
      const dbLocal = new Database('crm_leads.db', { verbose: console.log });

      dbLocal.run = (sql, params) => {
          return dbLocal.prepare(sql).run(params);
      };
      dbLocal.all = (sql, params) => {
          return dbLocal.prepare(sql).all(params);
      };

      dbLocal.exec(`
          CREATE TABLE IF NOT EXISTS leads (
              id TEXT PRIMARY KEY, dataCadastro TEXT, nome TEXT, cpf TEXT, email TEXT, dataNascimento TEXT,
              telefone TEXT, telefone2 TEXT, uf TEXT, cep TEXT, rua TEXT, numero TEXT, complemento TEXT,
              bairro TEXT, cidade TEXT, plano TEXT, vendedor TEXT, dataAgendamento TEXT, turnoAgendamento TEXT,
              status1 TEXT, statusEsteira TEXT, tecnico TEXT, obs TEXT, contrato TEXT, infoExtra TEXT,
              pontoReferencia TEXT, linkLocalizacao TEXT, obsEndereco TEXT, origemVenda TEXT, diaVencimento TEXT
          )
      `);
      console.log('Backend: Tabela leads verificada/criada no SQLite.');
      db = dbLocal; // Atribui a instância SQLite à variável global db
      return; // Sai da função, pois o DB local foi configurado
  }

  // --- Configuração para PostgreSQL no Heroku (SE process.env.DATABASE_URL existir) ---
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Necessário para Heroku Postgres
    }
  });

  try {
    await pgClient.connect();
    console.log('Backend: Conectado ao PostgreSQL no Heroku!');

    // Adaptação para métodos 'run' e 'all' para o cliente 'pg'
    pgClient.run = async (sql, params) => {
      let pgSql = sql.replace(/@(\w+)/g, (match, p1) => {
        const index = Object.keys(params).indexOf(p1) + 1;
        return `$${index}`;
      });
      const paramValues = Object.values(params);
      const res = await pgClient.query(pgSql, paramValues);
      return { changes: res.rowCount, lastInsertRowid: res.rows[0] ? res.rows[0].id : undefined };
    };

    pgClient.all = async (sql, params = {}) => {
      let pgSql = sql.replace(/@(\w+)/g, (match, p1) => {
        const index = Object.keys(params).indexOf(p1) + 1;
        return `$${index}`;
      });
      const paramValues = Object.values(params);
      const res = await pgClient.query(pgSql, paramValues);
      return res.rows;
    };

    // Cria a tabela 'leads' se ela não existir no PostgreSQL
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        dataCadastro TEXT,
        nome TEXT,
        cpf TEXT,
        email TEXT,
        dataNascimento TEXT,
        telefone TEXT,
        telefone2 TEXT,
        uf TEXT,
        cep TEXT,
        rua TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        plano TEXT,
        vendedor TEXT,
        dataAgendamento TEXT,
        turnoAgendamento TEXT,
        status1 TEXT,
        statusEsteira TEXT,
        tecnico TEXT,
        obs TEXT,
        contrato TEXT,
        infoExtra TEXT,
        pontoReferencia TEXT,
        linkLocalizacao TEXT,
        obsEndereco TEXT,
        origemVenda TEXT,
        diaVencimento TEXT
      )
    `);
    console.log('Backend: Tabela leads verificada/criada no PostgreSQL.');
    db = pgClient; // Atribui o cliente PostgreSQL à variável global 'db'

  } catch (err) {
    console.error('Backend: Erro de conexão ou criação de tabela PostgreSQL:', err.stack);
    process.exit(1);
  }
}

// --- Rotas da API ---

// Rota para obter todos os leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.all('SELECT * FROM leads ORDER BY dataCadastro DESC, id DESC');
    res.json(leads);
  } catch (error) {
    console.error("Backend: Erro ao obter leads:", error.message);
    res.status(500).json({ message: "Erro interno do servidor ao obter leads." });
  }
});

// Rota para adicionar um novo lead
app.post('/api/leads', async (req, res) => {
  const newLead = req.body;
  // Adicionado: Garante que dataCadastro tenha um valor válido (data atual) se não foi fornecido
  newLead.dataCadastro = newLead.dataCadastro || new Date().toISOString().slice(0, 10); 

  const sql = `
    INSERT INTO leads (
      id, dataCadastro, nome, cpf, email, dataNascimento, telefone, telefone2, uf, cep, rua, numero, complemento,
      bairro, cidade, plano, vendedor, dataAgendamento, turnoAgendamento, status1, statusEsteira, tecnico, obs,
      contrato, infoExtra, pontoReferencia, linkLocalizacao, obsEndereco, origemVenda, diaVencimento
    ) VALUES (
      @id, @dataCadastro, @nome, @cpf, @email, @dataNascimento, @telefone, @telefone2, @uf, @cep, @rua, @numero, @complemento,
      @bairro, @cidade, @plano, @vendedor, @dataAgendamento, @turnoAgendamento, @status1, @statusEsteira, @tecnico, @obs,
      @contrato, @infoExtra, @pontoReferencia, @linkLocalizacao, @obsEndereco, @origemVenda, @diaVencimento
    ) RETURNING id`;

  try {
    const info = await db.run(sql, newLead);
    res.status(201).json({ message: "Lead adicionado com sucesso!", lead: newLead, id: info.lastInsertRowid || newLead.id });
  } catch (error) {
    console.error("Backend: Erro ao adicionar lead:", error.message);
    res.status(500).json({ message: "Erro interno do servidor ao adicionar lead." });
  }
});

// Rota para atualizar um lead existente
app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const updatedLead = req.body;
  const sql = `
    UPDATE leads SET
      dataCadastro = @dataCadastro, nome = @nome, cpf = @cpf, email = @email, dataNascimento = @dataNascimento,
      telefone = @telefone, telefone2 = @telefone2, uf = @uf, cep = @cep, rua = @rua, numero = @numero,
      complemento = @complemento, bairro = @bairro, cidade = @cidade, plano = @plano, vendedor = @vendedor,
      dataAgendamento = @dataAgendamento, turnoAgendamento = @turnoAgendamento, status1 = @status1,
      statusEsteira = @statusEsteira, tecnico = @tecnico, obs = @obs, contrato = @contrato,
      infoExtra = @infoExtra, pontoReferencia = @pontoReferencia, linkLocalizacao = @linkLocalizacao,
      obsEndereco = @obsEndereco, origemVenda = @origemVenda, diaVencimento = @diaVencimento
    WHERE id = @id
  `;
  try {
    const paramsWithId = { ...updatedLead, id };
    const info = await db.run(sql, paramsWithId);
    if (info.changes > 0) {
      res.json({ message: "Lead atualizado com sucesso!", lead: updatedLead });
    } else {
      res.status(404).json({ message: "Lead não encontrado." });
    }
  } catch (error) {
    console.error("Backend: Erro ao atualizar lead:", error.message);
    res.status(500).json({ message: "Erro interno do servidor ao atualizar lead." });
  }
});

// Rota para deletar um lead
app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM leads WHERE id = $1`; // PostgreSQL usa '$1'
  try {
    const info = await db.run(sql, { 1: id }); // Usando 'run' abstrato
    if (info.changes > 0) {
      res.json({ message: "Lead excluído com sucesso!" });
    } else {
      res.status(404).json({ message: "Lead não encontrado." });
    }
  } catch (error) {
    console.error("Backend: Erro ao excluir lead:", error.message);
    res.status(500).json({ message: "Erro interno do servidor ao excluir lead." });
  }
});


// --- Inicia o Servidor (APÓS a inicialização do DB) ---
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend: Servidor rodando em http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Backend: Falha crítica ao iniciar o banco de dados e servidor:', err.message);
  process.exit(1);
});
