// Importação dos módulos necessários
import express from "express"; // Framework para criar o servidor web
import cors from "cors"; // Permite que o frontend (React) acesse o backend
import dotenv from "dotenv"; // Gerencia variáveis de ambiente (.env)
import pkg from "pg"; // Cliente PostgreSQL para Node.js

// Carrega as variáveis do arquivo .env
dotenv.config();

// Teste para ver se esta funcioando o arquivo .env, assim descobri que o erro no process era um indicativo errado do VS.
// console.log("Variáveis de ambiente carregadas:");
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_NAME:", process.env.DB_NAME);
// console.log("DB_HOST:", process.env.DB_HOST);

// Desestruturação para pegar a classe Pool do pacote "pg"
const { Pool } = pkg;

// Inicializa o Express (nosso servidor backend)
const app = express();

// Middleware para permitir requisições de outros domínios (CORS)
app.use(cors());

// Middleware para permitir envio de JSON no corpo das requisições
app.use(express.json());

// Configuração da conexão com o PostgreSQL
/* eslint-disable no-undef */ // Isso aqui desabilita o "nao definido", esses caras funcionam mais meu VS ta locão."
const pool = new Pool({
  user: process.env.DB_USER, // Usuário do banco de dados (definido no .env)
  host: process.env.DB_HOST, // Host do banco (normalmente localhost)
  database: process.env.DB_NAME, // Nome do banco de dados
  password: process.env.DB_PASS, // Senha do banco
  port: process.env.DB_PORT || 5432, // Porta padrão do PostgreSQL
  ssl: { rejectUnauthorized: false } // Adiciona suporte a SSL
});
/* eslint-enable no-undef */

// ------------------- HISTORICO CALCULADORA -------------------
// 🔹 Rota para salvar um cálculo no histórico
app.post("/historico", async (req, res) => {
  const { numero1, numero2, resultado } = req.body;

  if (!numero1 || !numero2 || resultado === undefined) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO historico (numero1, numero2, resultado) VALUES ($1, $2, $3) RETURNING *",
      [numero1, numero2, resultado]
    );

    res.status(201).json(result.rows[0]); // Retorna o cálculo salvo
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Rota para obter todo o histórico de cálculos
app.get("/historico", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM historico ORDER BY data_hora DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Rota DELETE para excluir um cálculo pelo ID
app.delete("/historico/:id", async (req, res) => {
  const { id } = req.params; // 🔹 Captura o ID da URL

  try {
    const result = await pool.query("DELETE FROM historico WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cálculo não encontrado" });
    }

    res.json({ message: "Cálculo excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Criar tabela automaticamente se não existir
async function criarTabelas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico (
        id SERIAL PRIMARY KEY,
        numero1 DECIMAL(10,2) NOT NULL,
        numero2 DECIMAL(10,2) NOT NULL,
        resultado DECIMAL(10,2) NOT NULL,
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabela 'historico' verificada/criada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao criar tabela:", error);
  }
}

// 🔹 Executa a função ao iniciar o servidor
criarTabelas();

// ------------------- HISTORICO CALCULADORA -------------------

// Função que cria a tabela "usuarios" se ela ainda não existir
async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY, -- ID autoincrementado (chave primária)
      nome VARCHAR(100) NOT NULL, -- Nome do usuário (obrigatório)
      email VARCHAR(100) UNIQUE NOT NULL -- Email único (obrigatório)
    );
  `);
}

// Chama a função para garantir que a tabela exista ao iniciar o servidor
createTable();

// 🚀 Rota GET para buscar todos os usuários do banco de dados
app.get("/usuarios", async (req, res) => {
  try {
    // Faz uma consulta SQL para pegar todos os usuários
    const result = await pool.query("SELECT * FROM usuarios");
    
    // Retorna os dados em formato JSON
    res.json(result.rows);
  } catch (error) {
    // Retorna um erro caso algo dê errado
    res.status(500).json({ error: error.message });
  }
});

// 🚀 Rota POST para adicionar um novo usuário no banco de dados
app.post("/usuarios", async (req, res) => {
  const { nome, email } = req.body; // Captura "nome" e "email" do corpo da requisição

  try {
    // Insere os dados no banco e retorna o usuário recém-criado
    const result = await pool.query(
      "INSERT INTO usuarios (nome, email) VALUES ($1, $2) RETURNING *",
      [nome, email]
    );

    // Retorna o usuário cadastrado em formato JSON
    res.json(result.rows[0]);
  } catch (error) {
    // Retorna erro caso falhe a inserção (ex: email já cadastrado)
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Rota DELETE para excluir um usuário pelo ID
app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params; // Captura o ID da URL

  try {
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🚀 Inicia o servidor na porta 5000 e exibe uma mensagem no console
app.listen(5000, "0.0.0.0", () => console.log("🚀 Servidor rodando na porta 5000 e acessível pela rede"));
