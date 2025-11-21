const prisma = require('../lib/prismaClient');
const redis = require('../lib/redisClient');
const CACHE_KEY_PRODUTOS = 'produtos:all';


exports.getAllProducts = async (req, res) => {
  try {
    const cachedProducts = await redis.get(CACHE_KEY_PRODUTOS);
    if (cachedProducts) {
      console.log('CACHE HIT!');
      return res.json(JSON.parse(cachedProducts));
    }
    console.log('CACHE MISS!');
    const produtosDoBanco = await prisma.$queryRaw`SELECT * FROM v_produtos_detalhados`;
    await redis.set(CACHE_KEY_PRODUTOS, JSON.stringify(produtosDoBanco), 'EX', 3600);
    res.json(produtosDoBanco);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
};

exports.createProduct = async (req, res) => {
  const { nome, descricao, preco, estoque, categoria_id } = req.body;
  const vendedor_id = req.user.userId;

  try {
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
        vendedor_id,
        categoria_id: parseInt(categoria_id),
      },
    });
    await redis.del(CACHE_KEY_PRODUTOS);
    res.status(201).json(produto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Erro ao criar produto.' });
  }
};

exports.updateProductPrice = async (req, res) => {
  const { id } = req.params;
  const { novoPreco } = req.body;

  try {
    await prisma.produto.update({
      where: { id: parseInt(id) },
      data: { preco: parseFloat(novoPreco) },
    });
    await redis.del(CACHE_KEY_PRODUTOS);
    res.json({ message: 'Preço atualizado e log gerado pelo Trigger.' });
  } catch (error) {
  console.error('ERRO DETALHADO (PASSO 8):', error); 
  res.status(500).json({ 
    error: 'Erro ao atualizar preço.', 
    details: error.message 
  });
}
};

exports.getAllCategories = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany();
    res.json(categorias);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};