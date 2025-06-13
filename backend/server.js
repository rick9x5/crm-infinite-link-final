// backend/server.js
// ... (código acima) ...

// --- Inicialização do Banco de Dados (Assíncrona) ---
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
      // ... (código SQLite, apenas a linha CREATE TABLE é alterada) ...
      dbLocal.exec(`
          CREATE TABLE IF NOT EXISTS leads (
              id TEXT PRIMARY KEY,
              dataCadastro TEXT DEFAULT (strftime('%Y-%m-%d', 'now', 'localtime')), -- <--- CORREÇÃO AQUI PARA SQLITE
              nome TEXT, cpf TEXT, email TEXT, dataNascimento TEXT,
              telefone TEXT, telefone2 TEXT, uf TEXT, cep TEXT, rua TEXT, numero TEXT, complemento TEXT,
              bairro TEXT, cidade TEXT, plano TEXT, vendedor TEXT, dataAgendamento TEXT, turnoAgendamento TEXT,
              status1 TEXT, statusEsteira TEXT, tecnico TEXT, obs TEXT, contrato TEXT, infoExtra TEXT,
              pontoReferencia TEXT, linkLocalizacao TEXT, obsEndereco TEXT, origemVenda TEXT, diaVencimento TEXT
          )
      `);
      // ... (restante do código SQLite) ...
      return;
  }

  // --- Configuração para PostgreSQL no Heroku ---
  pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
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
        dataCadastro TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD'), -- <--- CORREÇÃO AQUI PARA POSTGRESQL
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
    db = pgClient;

  } catch (err) {
    console.error('Backend: Erro de conexão ou criação de tabela PostgreSQL:', err.stack);
    process.exit(1);
  }
}

// ... (restante do initializeDatabase) ...

// Rota para adicionar um novo lead
app.post('/api/leads', async (req, res) => {
  const newLead = req.body;
  // Garante que dataCadastro tenha um valor válido (data atual) se não foi fornecido
  // OU usa o valor do payload, convertendo para string
  newLead.dataCadastro = (newLead.dataCadastro && String(newLead.dataCadastro).match(/^\d{4}-\d{2}-\d{2}$/))
                          ? String(newLead.dataCadastro).slice(0, 10)
                          : new Date().toISOString().slice(0, 10); // <--- GARANTE A DATA AQUI TAMBÉM

  const sql = `
    INSERT INTO leads (
      id, dataCadastro, nome, cpf, email, dataNascimento, telefone, telefone2, uf, cep, rua, numero, complemento,
      bairro, cidade, plano, vendedor, dataAgendamento, turnoAgendamento, status1, statusEsteira, tecnico, obs,
      contrato, infoExtra, pontoReferencia, linkLocalizacao, obsEndereco, origemVenda, diaVencimento
    ) VALUES (
      @id, COALESCE(@dataCadastro, TO_CHAR(NOW(), 'YYYY-MM-DD')), @nome, @cpf, @email, @dataNascimento, @telefone, @telefone2, @uf, @cep, @rua, @numero, @complemento,
      @bairro, @cidade, @plano, @vendedor, @dataAgendamento, @turnoAgendamento, @status1, @statusEsteira, @tecnico, @obs,
      @contrato, @infoExtra, @pontoReferencia, @linkLocalizacao, @obsEndereco, @origemVenda, @diaVencimento
    ) RETURNING id`; // <--- ADICIONADO COALESCE AQUI NO SQL INSERT

  try {
    const info = await db.run(sql, newLead);
    res.status(201).json({ message: "Lead adicionado com sucesso!", lead: newLead, id: info.lastInsertRowid || newLead.id });
  } catch (error) {
    console.error("Backend: Erro ao adicionar lead:", error.message);
    res.status(500).json({ message: "Erro interno do servidor ao adicionar lead." });
  }
});

// ... (restante do código do server.js) ...