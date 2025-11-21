-- Script completo do banco para o Marketplace DB-LAB


-- 1) Banco e usuário da aplicação (senha: trabalho)
CREATE DATABASE IF NOT EXISTS marketplace_db;
CREATE USER IF NOT EXISTS 'api_marketplace'@'localhost' IDENTIFIED BY 'trabalho';
GRANT CREATE ON *.* TO 'api_marketplace'@'localhost';
GRANT ALL PRIVILEGES ON marketplace_db.* TO 'api_marketplace'@'localhost';
FLUSH PRIVILEGES;

USE marketplace_db;

-- 2) Tabelas base (limpa antes se existir)
DROP TABLE IF EXISTS ItensPedido;
DROP TABLE IF EXISTS Pedido;
DROP TABLE IF EXISTS Produto;
DROP TABLE IF EXISTS Categoria;
DROP TABLE IF EXISTS Usuario;
DROP TABLE IF EXISTS GrupoUsuario;
DROP TABLE IF EXISTS LogMudancaPreco;

CREATE TABLE GrupoUsuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Usuario (
  id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  nome VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  senha_hash VARCHAR(191) NOT NULL,
  grupo_id INT NOT NULL,
  CONSTRAINT fk_usuario_grupo FOREIGN KEY (grupo_id) REFERENCES GrupoUsuario(id),
  INDEX idx_usuario_grupo (grupo_id)
);

CREATE TABLE Categoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL UNIQUE
);

CREATE TABLE Produto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL,
  descricao TEXT NULL,
  preco DECIMAL(10,2) NOT NULL,
  estoque INT NOT NULL,
  vendedor_id CHAR(36) NOT NULL,
  categoria_id INT NOT NULL,
  CONSTRAINT fk_produto_vendedor FOREIGN KEY (vendedor_id) REFERENCES Usuario(id),
  CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES Categoria(id),
  INDEX idx_produto_nome (nome),
  INDEX idx_produto_vendedor (vendedor_id),
  INDEX idx_produto_categoria (categoria_id),
  CHECK (preco >= 0),
  CHECK (estoque >= 0)
);

CREATE TABLE Pedido (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  comprador_id CHAR(36) NOT NULL,
  CONSTRAINT fk_pedido_comprador FOREIGN KEY (comprador_id) REFERENCES Usuario(id),
  INDEX idx_pedido_comprador (comprador_id)
);

CREATE TABLE ItensPedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  pedido_id VARCHAR(32) NOT NULL,
  produto_id INT NOT NULL,
  CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES Pedido(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES Produto(id),
  INDEX idx_item_pedido (pedido_id),
  INDEX idx_item_produto (produto_id),
  CHECK (quantidade > 0),
  CHECK (preco_unitario >= 0)
);

CREATE TABLE LogMudancaPreco (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  preco_antigo DECIMAL(10,2) NOT NULL,
  preco_novo DECIMAL(10,2) NOT NULL,
  alterado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_produto FOREIGN KEY (produto_id) REFERENCES Produto(id)
);

-- 3) Views
CREATE OR REPLACE VIEW v_produtos_detalhados AS
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

CREATE OR REPLACE VIEW v_resumo_pedidos_comprador AS
SELECT
  pe.id AS pedido_id,
  pe.comprador_id,
  pe.data_pedido,
  pe.status,
  SUM(ip.quantidade) AS total_itens,
  SUM(ip.quantidade * ip.preco_unitario) AS valor_total
FROM Pedido pe
JOIN ItensPedido ip ON pe.id = ip.pedido_id
GROUP BY pe.id, pe.comprador_id, pe.data_pedido, pe.status;

-- 4) Functions (mínimo 2)
DELIMITER $$
CREATE OR REPLACE FUNCTION fnc_gerar_id_pedido()
RETURNS VARCHAR(32)
DETERMINISTIC
BEGIN
  RETURN CONCAT(
    'PED-',
    DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'),
    '-',
    LPAD(FLOOR(RAND() * 9999), 4, '0')
  );
END$$

CREATE OR REPLACE FUNCTION fnc_calcular_total_pedido(p_pedido_id VARCHAR(32))
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
  DECLARE v_total DECIMAL(12,2);
  SELECT IFNULL(SUM(ip.quantidade * ip.preco_unitario), 0) INTO v_total
  FROM ItensPedido ip
  WHERE ip.pedido_id = p_pedido_id;
  RETURN v_total;
END$$
DELIMITER ;

-- 5) Procedures (mínimo 2)
DELIMITER $$
CREATE OR REPLACE PROCEDURE sp_registrar_novo_vendedor(
  IN p_nome VARCHAR(255),
  IN p_email VARCHAR(255),
  IN p_senha_hash VARCHAR(255)
)
BEGIN
  DECLARE v_grupo_id INT;

  SELECT id INTO v_grupo_id FROM GrupoUsuario WHERE nome = 'VENDEDOR' LIMIT 1;
  IF v_grupo_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Grupo VENDEDOR não encontrado.';
  END IF;

  INSERT INTO Usuario (nome, email, senha_hash, grupo_id)
  VALUES (p_nome, p_email, p_senha_hash, v_grupo_id);
END$$

CREATE OR REPLACE PROCEDURE sp_atualizar_status_pedido(
  IN p_pedido_id VARCHAR(32),
  IN p_novo_status VARCHAR(20)
)
BEGIN
  UPDATE Pedido
  SET status = p_novo_status
  WHERE id = p_pedido_id;
END$$
DELIMITER ;

-- 6) Triggers
DELIMITER $$
CREATE OR REPLACE TRIGGER trg_atualizar_estoque
AFTER INSERT ON ItensPedido
FOR EACH ROW
BEGIN
  UPDATE Produto
    SET estoque = estoque - NEW.quantidade
  WHERE id = NEW.produto_id;

  IF (SELECT estoque FROM Produto WHERE id = NEW.produto_id) < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estoque insuficiente para o item do pedido.';
  END IF;
END$$

CREATE OR REPLACE TRIGGER trg_log_mudanca_preco
BEFORE UPDATE ON Produto
FOR EACH ROW
BEGIN
  IF NEW.preco <> OLD.preco THEN
    INSERT INTO LogMudancaPreco (produto_id, preco_antigo, preco_novo)
    VALUES (OLD.id, OLD.preco, NEW.preco);
  END IF;
END$$
DELIMITER ;

-- 7) Seeds mínimos
INSERT IGNORE INTO GrupoUsuario (nome) VALUES ('ADMIN'), ('VENDEDOR'), ('COMPRADOR');
INSERT IGNORE INTO Categoria (nome) VALUES ('Roupas'), ('Eletrônicos');
