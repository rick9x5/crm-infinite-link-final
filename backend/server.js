// backend/server.js
const express = require('express');
const cors = require('cors');
// O cliente PG é carregado condicionalmente na função initializeDatabase
// const { Client } = require('pg'); // Removido daqui

const app = express(); // DEFINIR 'app' AQUI, NO INÍCIO!
const PORT = process.env.PORT || 5000;

let db; // Variável global para a instância do banco de dados (SQLite ou PG)

// --- Middlewares ---
// Configuração do CORS para permitir múltiplas origens (localhost e Vercel dinâmico)
const allowedOrigins = [
  'http://localhost:3000', // Para o ambiente de desenvolvimento local (frontend)
  'http://localhost:3002', // Se o seu frontend estiver rodando em 3002
  'https://crm-infinite-link-final.vercel.app', // A URL principal do seu frontend no Vercel
  // Regex para permitir qualquer subdomínio gerado pelo Vercel para o seu projeto
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
// Isso garante que db.run/db.all funcione consistentemente com objetos de parâmetros
function mapParamsToPositional(sql, params) {
  const paramNames = Object.keys(params);
  const paramValues = [];
  let positionalSql = sql;

  if (sql.includes('@')) { // Para SQL que usa @nome (SQLite e minha convenção)
    let index = 1;
    positionalSql = sql.replace(/@(\w+)/g, (match, p1) => {
      paramValues.push(params[p1]);
      return `$${index++}`; // Para PostgreSQL, usa $1, $2
    });
  } else if (sql.includes('$')) { // Para SQL que já usa $1 (DELETE no PG)
    // Se o SQL já é posicional (como DELETE), só extrai os valores em ordem esperada
    for (let i = 1; i <= paramNames.length; i++) {
        paramValues.push(params[i]); // Pega params[1], params[2] etc.
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

      // Adaptação de run/all para SQLite
      dbLocal.run = (sql, params) => {
          const { positionalSql, paramValues } = mapParamsToPositional(sql.replace(/\$(\d+)/g, '?'), params); // Substitui $n por ? para SQLite
          const stmt = dbLocal.prepare(positionalSql);
          const result = stmt.run(paramValues);
          return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      };

      dbLocal.all = (sql, params = {}) => {
          const { positionalSql, paramValues } = mapParamsToPositional(sql.replace(/\$(\d+)/g, '?'), params); // Substitui $n por ? para SQLite
          const stmt = dbLocal.prepare(positionalSql);
          return stmt.all(paramValues);
      };

      dbLocal.exec(`
          CREATE TABLE IF NOT EXISTS leads (
              id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
              dataCadastro TEXT DEFAULT (strftime('%Y-%m-%d', 'now', 'localtime')),
              nome TEXT, cpf TEXT, email TEXT, dataNascimento TEXT,
              telefone TEXT, telefone2 TEXT, uf TEXT, cep TEXT, rua TEXT, numero TEXT, complemento TEXT,
              bairro TEXT, cidade TEXT, plano TEXT, vendedor TEXT, dataAgendamento TEXT, turnoAgendamento TEXT,
              status1 TEXT, statusEsteira TEXT, tecnico TEXT, obs TEXT, contrato TEXT, infoExtra TEXT,
              pontoReferencia TEXT, linkLocalizacao TEXT, obsEndereco TEXT, origemVenda TEXT, diaVencimento TEXT
          )
      `);
      console.log('Backend: Tabla leads verificada/creada en SQLite.');
      db = dbLocal;
      return;
  }

  // --- Configuración para PostgreSQL en Heroku ---
  const { Client } = require('pg'); // Carregar pg aqui
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await pgClient.connect();
    console.log('Backend: Conectado a PostgreSQL en Heroku!');

    // Adaptação de run/all para PostgreSQL
    pgClient.run = async (sql, params) => {
        const { positionalSql, paramValues } = mapParamsToPositional(sql, params);
        const res = await pgClient.query(positionalSql, paramValues);
        return { changes: res.rowCount, lastInsertRowid: res.rows[0] ? res.rows[0].id : undefined, rows: res.rows }; // Incluir 'rows' para RETURNING
    };

    pgClient.all = async (sql, params = {}) => {
        const { positionalSql, paramValues } = mapParamsToPositional(sql, params);
        const res = await pgClient.query(positionalSql, paramValues);
        return res.rows;
    };

    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dataCadastro TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'),
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
    const leads = await db.all('SELECT * FROM leads ORDER BY dataCadastro DESC, id DESC');
    res.json(leads);
  } catch (error) {
    console.error("Backend: Error al obtener leads:", error.message);
    res.status(500).json({ message: "Internal server error when obtaining leads." });
  }
});

app.post('/api/leads', async (req, res) => {
  const newLead = req.body;
  
  // Garantir que newLead.dataCadastro esteja no formato YYYY-MM-DD ou seja a data atual
  newLead.dataCadastro = (newLead.dataCadastro && String(newLead.dataCadastro).match(/^\d{4}-\d{2}-\d{2}$/))
                          ? String(newLead.dataCadastro).slice(0, 10)
                          : new Date().toISOString().slice(0, 10); // Default to current date

  const columns = [
    'nome', 'cpf', 'email', 'dataNascimento', 'telefone', 'telefone2', 'uf', 'cep', 'rua', 'numero', 'complemento',
    'bairro', 'cidade', 'plano', 'vendedor', 'dataAgendamento', 'turnoAgendamento', 'status1', 'statusEsteira', 'tecnico', 'obs',
    'contrato', 'infoExtra', 'pontoReferencia', 'linkLocalizacao', 'obsEndereco', 'origemVenda', 'diaVencimento', 'dataCadastro' // Incluir dataCadastro aqui
  ];
  
  const placeholders = columns.map(col => `@${col}`); // Usar @ para nomeados
  const values = {};
  columns.forEach(col => {
      values[col] = newLead[col] !== undefined ? newLead[col] : null; // Mapear para null se for undefined
  });
  
  // Se o ID for enviado do frontend (ex: para re-inserção de mocks), inclua-o
  if (newLead.id) {
    columns.unshift('id'); // Adiciona 'id' ao início da lista de colunas
    placeholders.unshift('@id'); // Adiciona '@id' ao início da lista de placeholders
    values.id = newLead.id; // Adiciona o valor do ID
  }

  const sql = `
    INSERT INTO leads (
      ${columns.join(', ')}
    ) VALUES (
      ${placeholders.join(', ')}
    ) RETURNING id, dataCadastro`; // Sempre retorna o ID e dataCadastro gerados/usados

  try {
    const info = await db.run(sql, values); // Passar o objeto 'values' aqui
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
      dataCadastro = @dataCadastro, nome = @nome, cpf = @cpf, email = @email, dataNascimento = @dataNascimento,
      telefone = @telefone, telefone2 = @telefone2, uf = @uf, cep = @cep, rua = @rua, numero = @numero,
      complemento = @complemento, bairro = @bairro, ciudad = @cidade, plano = @plano, vendedor = @vendedor,
      dataAgendamento = @dataAgendamento, turnoAgendamento = @turnoAgendamento, status1 = @status1,
      statusEsteira = @statusEsteira, tecnico = @tecnico, obs = @obs, contrato = @contrato,
      infoExtra = @infoExtra, puntoReferencia = @pontoReferencia, linkLocalizacion = @linkLocalizacao,
      obsEndereco = @obsEndereco, origenVenta = @origemVenta, diaVencimiento = @diaVencimiento
    WHERE id = @id
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
  const sql = `DELETE FROM leads WHERE id = $1`;
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
