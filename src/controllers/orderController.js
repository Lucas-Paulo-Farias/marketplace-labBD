const prisma = require('../lib/prismaClient');

exports.createOrder = async (req, res) => {
  const compradorId = req.user.userId;
  const { itens } = req.body;

  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ error: 'O array de "itens" é obrigatório.' });
  }

  try {
    const idsProdutos = itens.map(item => item.produto_id);
    
    const resultado = await prisma.$transaction(async (tx) => {
      
      const produtosNoBanco = await tx.produto.findMany({
        where: { id: { in: idsProdutos } },
      });

      const mapaProdutos = new Map(produtosNoBanco.map(p => [p.id, p]));
      
      const itensParaCriar = [];
      
      for (const item of itens) {
        const produto = mapaProdutos.get(item.produto_id);

        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(`Estoque insuficiente para o produto "${produto.nome}".`);
        }

        itensParaCriar.push({
          produto_id: produto.id,
          quantidade: item.quantidade,
          preco_unitario: produto.preco,
        });
      }

      const [{ novo_id }] = await tx.$queryRaw`SELECT fnc_gerar_id_pedido() AS novo_id`;
      const novoPedido = await tx.pedido.create({
        data: {
          id: novo_id,
          comprador_id: compradorId,
          status: 'PENDENTE',
          itens: {
            create: itensParaCriar,
          },
        },
        include: {
          itens: true,
        },
      });

      return novoPedido;
    });

    res.status(201).json(resultado);

  } catch (error) {
    console.error('Erro ao criar pedido:', error.message);
    res.status(400).json({ error: 'Erro ao processar pedido.', details: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  const compradorId = req.user.userId;

  try {
    const pedidos = await prisma.$queryRaw`
      SELECT * FROM v_resumo_pedidos_comprador
      WHERE comprador_id = ${compradorId}
      ORDER BY data_pedido DESC
    `;
    res.json(pedidos);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error.message);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
};