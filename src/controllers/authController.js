const prisma = require('../lib/prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const grupoComprador = await prisma.grupoUsuario.findUnique({
      where: { nome: 'COMPRADOR' },
    });
    if (!grupoComprador) {
      return res.status(500).json({ error: 'Grupo de usuário padrão não encontrado.' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha_hash,
        grupo_id: grupoComprador.id,
      },
    });

    res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: usuario.id });

  } catch (error) {
    res.status(400).json({ error: 'Email já existe ou dados inválidos.' });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { grupo: true }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const payload = {
      userId: usuario.id,
      grupo: usuario.grupo.nome,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({ token, userId: usuario.id, grupo: usuario.grupo.nome });

  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
};

exports.registerVendedor = async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    const senha_hash = await bcrypt.hash(senha, 10);
    await prisma.$executeRaw`
      CALL sp_registrar_novo_vendedor(
        ${nome}, 
        ${email}, 
        ${senha_hash}
      )
    `;

    res.status(201).json({ message: 'Vendedor registrado com sucesso!' });

  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target.includes('email')) {
      return res.status(400).json({ error: 'Email já está em uso.' });
    }
    
    console.error('Erro ao registrar vendedor:', error);
    res.status(500).json({ error: 'Erro ao registrar vendedor.' });
  }
};