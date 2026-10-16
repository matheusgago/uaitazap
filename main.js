const express = require('express');
const cors = require('cors');
const conexao = require('./db/connection'); 
const app = express();
app.use(cors());
app.use(express.json());
app.post('/auth', async (req, res) => {
  const { telefone, senha } = req.query;

  try {
    const [usuarios] = await conexao.query(
      'SELECT id, apelido, telefone FROM utilizadores WHERE telefone = ? AND senha = ?',
      [telefone, senha]
    );

    if (usuarios.length > 0) {
      return res.json({ isAuth: true, user: usuarios[0] });
    } else {
      return res.json({ isAuth: false });
    }
  } catch (err) {
    console.error('Erro na autenticação:', err);
    return res.status(500).json({ isAuth: false, mensagem: 'Erro no servidor.' });
  }
});
app.post('/signin', async (req, res) => {
  const { apelido, telefone, senha } = req.body;

  if (!apelido || !telefone || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos!' });
  }

  try {
    await conexao.query(
      'CALL sp_registar_utilizador(?, ?, ?)',
      [apelido, telefone, senha]
    );

    return res.status(201).json({ sucesso: true, mensagem: 'Usuário registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensagem: 'Este telefone já está cadastrado!' });
    }
    return res.status(500).json({ mensagem: 'Erro interno no banco de dados.' });
  }
});
app.get('/utilizadores', async (req, res) => {
  const { meuTelefone } = req.query;

  try {
    const [utilizadores] = await conexao.query(
      'SELECT id, apelido, telefone FROM utilizadores WHERE telefone != ?',
      [meuTelefone]
    );
    return res.json(utilizadores);
  } catch (err) {
    console.error('Erro ao buscar contatos:', err);
    return res.status(500).json({ mensagem: 'Erro ao buscar contatos.' });
  }
});
app.get('/mensagens', async (req, res) => {
  const { remetente, destino } = req.query;
  try {
    const [resultados] = await conexao.query(
      'CALL sp_obter_historico(?, ?)',
      [remetente, destino]
    );
    return res.json(resultados[0] || []);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return res.status(500).json({ mensagem: 'Erro ao buscar mensagens.' });
  }
});
app.post('/chat', async (req, res) => {
  const { telefone, destino, mensagem } = req.body;

  if (!telefone || !destino || !mensagem) {
    return res.status(400).json({ mensagem: 'Dados incompletos para envio.' });
  }

  try {
    await conexao.query(
      'CALL sp_enviar_mensagem(?, ?, ?)',
      [telefone, destino, mensagem]
    );
    return res.status(201).json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ mensagem: 'Erro ao enviar mensagem.' });
  }
});
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});