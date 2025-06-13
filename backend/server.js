    // backend/server.js
    const express = require('express');
    const cors = require('cors');
    const { Client } = require('pg'); // Apenas pg, sem better-sqlite3

    const app = express();
    const PORT = process.env.PORT || 5000;

    let db; // Variável global para a instância do banco de dados
    let pgClient; // Variável para a instância do cliente PostgreSQL

    // --- Middlewares ---
    // Configuração do CORS para permitir múltiplas origens (localhost e Vercel dinâmico)
    const allowedOrigins = [
      'http://localhost:3000', // Para o ambiente de desenvolvimento local (frontend)
      'http://localhost:3002', // SE o seu frontend estiver rodando em 3002
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


    // --- Inicialização do Banco de Dados (Assíncrona para PostgreSQL) ---
    async function initializeDatabase() {
      if (!process.env.DATABASE_URL) {
          // === Configuração para SQLite local ===
          const Database = require('better-sqlite3');
          console.log('Backend: Usando SQLite local para desenvolvimento.');
          const dbLocal = new Database('crm_leads.db', { verbose: console.log });

          dbLocal.run = (sql, params) => {
              const sqliteSql = sql.replace(/\$(\d+)/g, '?');
              const stmt = dbLocal.prepare(sqliteSql);
              const boundParams = {};
              if (params) {
                Object.keys(params).forEach(key => {
                    boundParams[key] = params[key];
                });
              }
              const result = stmt.run(Object.values(boundParams));
              return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
          };

          dbLocal.all = (sql, params = {}) => {
              const sqliteSql = sql.replace(/\$(\d+)/g, '?');
              const stmt = dbLocal.prepare(sqliteSql);
              const boundParams = {};
              if (params) {
                Object.keys(params).forEach(key => {
                    boundParams[key] = params[key];
                });
              }
              return stmt.all(boundParams);
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
          console.log('Backend: Tabela leads verificada/creada en SQLite.');
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
      newLead.dataCadastro = (newLead.dataCadastro && String(newLead.dataCadastro).match(/^\d{4}-\d{2}-\d{2}$/))
                              ? String(newLead.dataCadastro).slice(0, 10)
                              : new Date().toISOString().slice(0, 10);
      
      const sql = `
        INSERT INTO leads (
          nome, cpf, email, dataNascimento, telefone, telefone2, uf, cep, rua, numero, complemento,
          bairro, cidade, plano, vendedor, dataAgendamento, turnoAgendamento, status1, statusEsteira, tecnico, obs,
          contrato, infoExtra, pontoReferencia, linkLocalizacao, obsEndereco, origemVenda, diaVencimento
        ) VALUES (
          @nome, COALESCE(@dataCadastro, TO_CHAR(NOW(), 'YYYY-MM-DD')), @cpf, @email, @dataNascimento, @telefone, @telefone2, @uf, @cep, @rua, @numero, @complemento,
          @bairro, @cidade, @plano, @vendedor, @dataAgendamento, @turnoAgendamento, @status1, @statusEsteira, @tecnico, @obs,
          @contrato, @infoExtra, @pontoReferencia, @linkLocalizacao, @obsEndereco, @origemVenda, @diaVencimento
        ) RETURNING id, dataCadastro`; // Siempre retorna el ID y dataCadastro generados/usados

      try {
        const info = await db.run(sql, newLead);
        res.status(201).json({ 
            message: "Lead added successfully!", 
            lead: { ...newLead, id: info.rows[0].id, dataCadastro: info.rows[0].dataCadastro } 
        }); // Retorna el ID y dataCadastro real del DB
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
          infoExtra = @infoExtra, puntoReferencia = @pontoReferencia, linkLocalizacion = @linkLocalizacion,
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
    