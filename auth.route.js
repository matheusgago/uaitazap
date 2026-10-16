const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'whatsapp'
});

router.post('/auth', async (req, res) => {
    const { telefone, senha } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT id, apelido, telefone FROM utilizadores WHERE telefone = ? AND senha = ?',
            [telefone, senha]
        );
        if (rows.length > 0) {
            return res.json({ isAuth: true, user: rows[0] });
        } else {
            return res.json({ isAuth: false });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ isAuth: false, error: 'Erro no servidor' });
    }
});


router.get('/utilizadores', async (req, res) => {
    const { meuTelefone } = req.query;
    try {
        const [rows] = await pool.query(
            'SELECT id, apelido, telefone FROM utilizadores WHERE telefone != ?',
            [meuTelefone]
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
});


router.post('/chat', async (req, res) => {
    const { telefone, mensagem, destino } = req.body;
    try {
        await pool.query(
            'INSERT INTO mensagens (remetente, destino, mensagem) VALUES (?, ?, ?)',
            [telefone, destino, mensagem]
        );
        return res.json({ sucesso: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ sucesso: false });
    }
});

router.get('/mensagens', async (req, res) => {
    const { remetente, destino } = req.query;
    try {
        const [rows] = await pool.query(
            `SELECT * FROM mensagens 
             WHERE (remetente = ? AND destino = ?) 
                OR (remetente = ? AND destino = ?)
             ORDER BY data ASC`,
            [remetente, destino, destino, remetente]
        );
        return res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

module.exports = router;