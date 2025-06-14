// backend/server.js
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

let db;
let pgClient;

// --- Middlewares ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'https://crm-infinite-link-final.vercel.app',
  /https:\/\/crm-infinite-link-final-(.+)\.vercel\.app$/ 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.some(regex => regex instanceof RegExp && regex.test(origin))) {
      return callback(null, true);
    }
    console.error('CORS blocked origin:', origin);
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());


// --- Função para Mapear Parâmetros Nomeados (@param) para Posicionais ($n ou ?) ---
function mapParamsToPositional(sql, params) {
  const paramValues = [];
  let positionalSql = sql;

  if (sql.includes('@')) {
    let index = 1;
    positionalSql = sql.replace(/@(\w+)/g, (match, p1) => {
      paramValues.push(params[p1]);
      return `$${index++}`;
    });
  } else if (sql.includes('$')) {
    // Para DELETE, o SQL já usa $1, então só pega o valor do param 1
    if (params[1]) { 
        paramValues.push(params[1]);
    }
  }

  return { positionalSql, paramValues };
}


// --- Inicialização do Banco de Dados (Assíncrona) ---
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
      // === Configuração para SQLite local ===
      const Database = require('better-sqlite3');
      console.log('Backend: Usando SQLite local para desenvolvimento.');
      const dbLocal = new Database('crm_leads.db', { verbose: console.log });

      dbLocal.run = (sql, params) => {
          const { positionalSql, paramValues } = mapParamsToPositional(sql.replace(/\$(\d+)/g, '?'), params);
          const stmt = dbLocal.prepare(positionalSql);
          const result = stmt.run(paramValues);
          return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      };

      dbLocal.all = (sql, params = {}) => {
          const { positionalSql, paramValues } = mapParamsToPositional(sql.replace(/\$(\d+)/g, '?'), params);
          const stmt = dbLocal.prepare(positionalSql);
          return stmt.all(paramValues);
      };

      dbLocal.exec(`
          CREATE TABLE IF NOT EXISTS leads (
              id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
              "dataCadastro" TEXT DEFAULT (strftime('%Y-%m-%d', 'now', 'localtime')),
              "nome" TEXT, "cpf" TEXT, "email" TEXT, "dataNascimento" TEXT,
              "telefone" TEXT, "telefone2" TEXT, "uf" TEXT, "cep" TEXT, "rua" TEXT, "numero" TEXT, "complemento" TEXT,
              "bairro" TEXT, "cidade" TEXT, "plano" TEXT, "vendedor" TEXT, "dataAgendamento" TEXT, "turnoAgendamento" TEXT,
              "status1" TEXT, "statusEsteira" TEXT, "tecnico" TEXT, "obs" TEXT, "contrato" TEXT, "infoExtra" TEXT,
              "pontoReferencia" TEXT, "linkLocalizacao" TEXT, "obsEndereco" TEXT, "origemVenda" TEXT, "diaVencimento" TEXT -- Corrigido nome da coluna
          )
      `);
      console.log('Backend: Tabla leads verificada/creada en SQLite.');
      db = dbLocal;
      return;
  }

  // --- Configuración para PostgreSQL en Heroku ---
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pgClient.connect();
    console.log('Backend: Conectado a PostgreSQL en Heroku!');

    pgClient.run = async (sql, params) => {
        const { positionalSql, paramValues } = mapParamsToPositional(sql, params);
        const res = await pgClient.query(positionalSql, paramValues);
        return { changes: res.rowCount, lastInsertRowid: res.rows[0] ? res.rows[0].id : undefined, rows: res.rows };
    };

    pgClient.all = async (sql, params = {}) => {
        const { positionalSql, paramValues } = mapParamsToPositional(sql, params);
        const res = await pgClient.query(positionalSql, paramValues);
        return res.rows;
    };

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS leads (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "dataCadastro" TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
        "nome" TEXT,
        "cpf" TEXT,
        "email" TEXT,
        "dataNascimento" TEXT,
        "telefone" TEXT,
        "telefone2" TEXT,
        "uf" TEXT,
        "cep" TEXT,
        "rua" TEXT,
        "numero" TEXT,
        "complemento" TEXT,
        "bairro" TEXT,
        "cidade" TEXT,
        "plano" TEXT,
        "vendedor" TEXT,
        "dataAgendamento" TEXT,
        "turnoAgendamento" TEXT,
        "status1" TEXT,
        "statusEsteira" TEXT,
        "tecnico" TEXT,
        "obs" TEXT,
        "contrato" TEXT,
        "infoExtra" TEXT,
        "pontoReferencia" TEXT,
        "linkLocalizacao" TEXT,
        "obsEndereco" TEXT,
        "origemVenda" TEXT, -- Corrigido nome da coluna
        "diaVencimento" TEXT
      )
    `);
    console.log('Backend: Tabla leads verificada/creada en PostgreSQL.');
    db = pgClient;

  } catch (err) {
    console.error('Backend: Error de conexión o creación de tabla PostgreSQL:', err.stack);
    process.exit(1);
  }
}


// --- Rutas de la API ---

app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.all('SELECT * FROM leads ORDER BY "dataCadastro" DESC, "id" DESC'); // Usar aspas duplas na leitura
    res.json(leads);
  } catch (error) {
    console.error("Backend: Error al obtener leads:", error.message);
    res.status(500).json({ message: "Internal server error when obtaining leads." });
  }
});

app.post('/api/leads', async (req, res) => {
  const newLead = req.body;
  
  const columns = [
    '"nome"', '"cpf"', '"email"', '"dataNascimento"', '"telefone"', '"telefone2"', '"uf"', '"cep"', '"rua"', '"numero"', '"complemento"',
    '"bairro"', '"cidade"', '"plano"', '"vendedor"', '"dataAgendamento"', '"turnoAgendamento"', '"status1"', '"statusEsteira"', '"tecnico"', '"obs"',
    '"contrato"', '"infoExtra"', '"pontoReferencia"', '"linkLocalizacao"', '"obsEndereco"', '"origemVenda"', '"diaVencimento"', '"dataCadastro"' 
  ];
  
  const placeholders = columns.map(col => `@${col.replace(/"/g, '')}`); // Remove aspas para o placeholder @
  const values = {};
  columns.forEach(col => {
      const cleanCol = col.replace(/"/g, ''); // Nome da coluna sem aspas
      values[cleanCol] = newLead[cleanCol] !== undefined ? newLead[cleanCol] : null; 
  });

  // Garantir que dataCadastro tenha um valor, priorizando o que vem do frontend
  // ou usando a data atual, no formato ISO (YYYY-MM-DD).
  values.dataCadastro = (newLead.dataCadastro && String(newLead.dataCadastro).match(/^\d{4}-\d{2}-\d{2}$/))
                          ? String(newLead.dataCadastro).slice(0, 10)
                          : new Date().toISOString().slice(0, 10);
  
  // Se o ID for enviado do frontend (ex: para re-inserção de mocks), inclua-o
  if (newLead.id) {
    columns.unshift('"id"'); 
    placeholders.unshift('@id'); 
    values.id = newLead.id; 
  }

  const sql = `
    INSERT INTO leads (
      ${columns.join(', ')}
    ) VALUES (
      ${placeholders.join(', ')}
    ) RETURNING "id", "dataCadastro"`; // Retornar dataCadastro também com aspas

  try {
    const info = await db.run(sql, values);
    res.status(201).json({ 
        message: "Lead added successfully!", 
        lead: { ...newLead, id: info.rows[0].id, dataCadastro: info.rows[0].dataCadastro } 
    });
  } catch (error) {
    console.error("Backend: Error al agregar lead:", error.message);
    res.status(500).json({ message: "Internal server error when adding lead." });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const updatedLead = req.body;
  const sql = `
    UPDATE leads SET
      "dataCadastro" = @dataCadastro, "nome" = @nome, "cpf" = @cpf, "email" = @email, "dataNascimento" = @dataNascimento,
      "telefone" = @telefone, "telefone2" = @telefone2, "uf" = @uf, "cep" = @cep, "rua" = @rua, "numero" = @numero,
      "complemento" = @complemento, "bairro" = @bairro, "cidade" = @cidade, "plano" = @plano, "vendedor" = @vendedor,
      "dataAgendamento" = @dataAgendamento, "turnoAgendamento" = @turnoAgendamento, "status1" = @status1,
      "statusEsteira" = @statusEsteira, "tecnico" = @tecnico, "obs" = @obs, "contrato" = @contrato,
      "infoExtra" = @infoExtra, "pontoReferencia" = @pontoReferencia, "linkLocalizacao" = @linkLocalizacao,
      "obsEndereco" = @obsEndereco, "origemVenda" = @origemVenda, "diaVencimento" = @diaVencimento
    WHERE "id" = @id
  `;
  try {
    const paramsWithId = { ...updatedLead, id };
    const info = await db.run(sql, paramsWithId);
    if (info.changes > 0) {
      res.json({ message: "Lead updated successfully!", lead: updatedLead });
    } else {
      res.status(404).json({ message: "Lead not found." });
    }
  } catch (error) {
    console.error("Backend: Error al actualizar lead:", error.message);
    res.status(500).json({ message: "Internal server error when updating lead." });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM leads WHERE "id" = $1`;
  try {
    const info = await db.run(sql, { 1: id });
    if (info.changes > 0) {
      res.json({ message: "Lead deleted successfully!" });
    } else {
      res.status(404).json({ message: "Lead not found." });
    }
  } catch (error) {
    console.error("Backend: Error al eliminar lead:", error.message);
    res.status(500).json({ message: "Internal server error when deleting lead." });
  }
});

// --- Inicia el Servidor (después de la inicialización de la DB) ---
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend: Servidor corriendo en http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Backend: Critical failure starting database and server:', err.message);
  process.exit(1);
});
