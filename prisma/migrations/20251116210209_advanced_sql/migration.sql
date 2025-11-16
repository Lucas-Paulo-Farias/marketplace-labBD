CREATE TABLE `log_precos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `produto_id` INT NOT NULL,
    `data_mudanca` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `preco_antigo` DECIMAL(10, 2) NOT NULL,
    `preco_novo` DECIMAL(10, 2) NOT NULL,
    `usuario_modificador` VARCHAR(255)
);

CREATE FUNCTION `fnc_gerar_id_pedido`()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE novo_id VARCHAR(20);
    DECLARE timestamp_part VARCHAR(10);
    DECLARE random_part INT;

    SET timestamp_part = UNIX_TIMESTAMP();
    SET random_part = FLOOR(RAND() * 1000);

    SET novo_id = CONCAT('PED-', timestamp_part, '-', LPAD(random_part, 3, '0'));
    RETURN novo_id;
END;

CREATE PROCEDURE `sp_registrar_novo_vendedor`(
    IN p_nome VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_senha_hash VARCHAR(255)
)
BEGIN
    DECLARE grupo_id_vendedor INT;
    SELECT id INTO grupo_id_vendedor
    FROM GrupoUsuario
    WHERE nome = 'VENDEDOR'
    LIMIT 1;
    INSERT INTO Usuario (id, nome, email, senha_hash, grupo_id)
    VALUES (UUID(), p_nome, p_email, p_senha_hash, grupo_id_vendedor);
END;

CREATE TRIGGER `trg_atualizar_estoque_apos_pedido`
AFTER INSERT ON `ItensPedido`
FOR EACH ROW
BEGIN
    UPDATE Produto
    SET estoque = estoque - NEW.quantidade
    WHERE id = NEW.produto_id;
END;

CREATE TRIGGER `trg_log_mudanca_preco`
BEFORE UPDATE ON `Produto`
FOR EACH ROW
BEGIN
    IF OLD.preco <> NEW.preco THEN
        INSERT INTO `log_precos` (produto_id, preco_antigo, preco_novo, usuario_modificador)
        VALUES (OLD.id, OLD.preco, NEW.preco, CURRENT_USER());
    END IF;
END;

CREATE VIEW `v_produtos_detalhados` AS
SELECT 
    p.id,
    p.nome,
    p.descricao,
    p.preco,
    p.estoque,
    c.nome AS categoria,
    u.nome AS vendedor
FROM Produto p
JOIN Categoria c ON p.categoria_id = c.id
JOIN Usuario u ON p.vendedor_id = u.id;

CREATE VIEW `v_resumo_pedidos_comprador` AS
SELECT 
    p.id AS pedido_id,
    p.data_pedido,
    p.status,
    p.comprador_id,
    u.nome AS comprador_nome,
    SUM(ip.quantidade) AS total_itens,
    SUM(ip.quantidade * ip.preco_unitario) AS valor_total
FROM Pedido p
JOIN Usuario u ON p.comprador_id = u.id
JOIN ItensPedido ip ON p.id = ip.pedido_id
GROUP BY p.id, u.nome;