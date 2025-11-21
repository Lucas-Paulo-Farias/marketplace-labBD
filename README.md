# 🚀 API de Marketplace - Laboratório de Banco de Dados

API RESTful para um sistema de marketplace, desenvolvida como projeto final da disciplina de Laboratório de Banco de Dados. O projeto demonstra o uso integrado de um SGBD relacional (MySQL) com recursos avançados e um banco NoSQL (Redis) para caching de alta performance.

---

## 🎯 Objetivos Acadêmicos do Projeto

O principal objetivo deste sistema é demonstrar o domínio de conceitos avançados de Sistemas Gerenciadores de Banco de Dados, atendendo aos seguintes requisitos:

* **SGBD Relacional (MySQL):**
    * Uso de **Índices** para otimização de consultas.
    * Implementação de **Triggers** para automação e auditoria.
    * Criação de **Views** para simplificação de consultas complexas.
    * Desenvolvimento de **Procedures e Functions** para encapsulamento de regras de negócio.
    * Definição de **Usuários e Controle de Acesso** granulares, evitando o uso do `root`.
    * Geração de IDs customizados (via `Function`) para dados críticos.
* **SGBD NoSQL (Redis):**
    * Justificativa de uso (caching) e implementação prática para melhoria de performance.
* **Aplicação Completa:**
    * **Backend (API):** Consome todos os recursos do banco de dados, com autenticação (JWT) e controle de acesso baseado em grupos.
    * **Frontend:** Interface simples (HTML/JS) para login e consumo da API.

---

## 🛠️ Tecnologias Utilizadas

* **Backend:** Node.js, Express
* **ORM e Migrações:** Prisma
* **Banco de Dados Relacional:** MySQL
* **Banco de Dados NoSQL:** Redis (para caching)
* **Autenticação:** JWT (JSON Web Tokens), bcrypt.js

---

## 🏁 Começando: Instalação e Configuração

Siga os passos abaixo para executar o projeto localmente.

### 1. Pré-requisitos

* [Node.js](https://nodejs.org/) (v18 ou superior)
* [Git](https://git-scm.com/)
* **Servidor MySQL** em execução (local, XAMPP ou Docker).
* **Servidor Redis** em execução (local ou Docker).

### 2. Clone e Instale

```bash
# Clone o repositório
git clone https://Lucas-Paulo-Farias/marketplace-labBD.git

# Entre na pasta do projeto
cd marketplace-labBD

# Instale as dependências
npm install
```

### 3. Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base) e preencha com suas credenciais.

```.env
# Conexão com o MySQL (NÃO USE ROOT)
DATABASE_URL="mysql://api_marketplace:sua_senha@localhost:3306/marketplace_db"

# Chave secreta para os tokens JWT
JWT_SECRET="sua-chave-secreta"

# Conexão do Redis
REDIS_URL="redis://localhost:6379"
```

### 4. Configuração do Banco de Dados (MySQL)

**Atenção:** O projeto foi configurado para NÃO usar `root`. Siga os passos:

1.  No seu cliente MySQL (Workbench, DBeaver) como `root`, crie o banco:
    ```sql
    CREATE DATABASE marketplace_db;
    ```
2.  Crie o usuário que a API irá usar e dê as permissões:
    ```sql
    -- Cria o usuário
    CREATE USER 'api_marketplace'@'localhost' IDENTIFIED BY 'sua_senha';

    -- Permite ao usuário criar bancos de dados
    GRANT CREATE ON *.* TO 'api_marketplace'@'localhost';
    
    -- Dá as permissões necessárias
    GRANT ALL PRIVILEGES ON marketplace_db.* TO 'api_marketplace'@'localhost';
    
    -- Atualiza os privilégios
    FLUSH PRIVILEGES;
    ```

### 5. Migrações e Dados Essenciais

1.  Execute as migrações do Prisma. Este comando irá criar **todas** as tabelas, **Views**, **Functions** e **Procedures** automaticamente:
    ```bash
    npm run prisma:migrate
    ```
2.  **IMPORTANTE:** Popule os dados essenciais (Grupos e Categorias) que o sistema precisa para funcionar e evitar erros de Foreign Key:
    ```bash
    # Abra o cliente interativo do Prisma
    npm run prisma:studio
    ```
    * Na interface web, vá até o modelo `GrupoUsuario` e adicione as 3 linhas:
        * `ADMIN`
        * `VENDEDOR`
        * `COMPRADOR`
    * Vá até o modelo `Categoria` e adicione pelo menos uma categoria:
        * `Roupas`
        * `Eletrônicos`

---

## 🚀 Executando o Servidor

Com o MySQL e o Redis rodando e o `.env` configurado, inicie o servidor:

```bash
npm start
```


---

## 🧪 Roteiro de Teste (Fluxo Principal via API)

Use um cliente de API (Postman, Insomnia) para seguir este fluxo:

1.  **Criar Vendedor:** `POST /api/auth/registrar-vendedor`
    * (Demonstra a **Procedure `sp_registrar_novo_vendedor`**)
2.  **Criar Comprador:** `POST /api/auth/registrar`
3.  **Login Vendedor:** `POST /api/auth/login` (salve o token)
4.  **Criar Produto:** `POST /api/produtos` (use o token de Vendedor)
5.  **Ver Produtos (Cache):**
    * `GET /api/products` (1ª vez: `CACHE MISS!`)
    * `GET /api/products` (2ª vez: `CACHE HIT!`)
    * (Demonstra o **NoSQL (Redis)** e a **View `v_produtos_detalhados`**)
6.  **Login Comprador:** `POST /api/auth/login` (salve o token)
7.  **Fazer Pedido:** `POST /api/pedidos` (use o token de Comprador)
    * (Demonstra a **Function `fnc_gerar_id_pedido`** e o **Trigger `trg_atualizar_estoque`**)
8.  **Ver Meus Pedidos:** `GET /api/pedidos` (use o token de Comprador)
    * (Demonstra a **View `v_resumo_pedidos_comprador`**)
9.  **Mudar Preço:** `PUT /api/products/preco/:id` (use o token de Vendedor)
    * (Demonstra o **Trigger `trg_log_mudanca_preco`** e a **Invalidação de Cache**)
10. **Teste de Acesso:** Tente criar um produto com token de Comprador.
    * (Demonstra o **Controle de Acesso (Middleware)**)

---

## ✒️ Autores

* Lucas Paulo de Sousa Farias
* Alexandre Torres Rezende
* Bruno Braga Dos Santos
* Daniel Dos Santos Cassemiro
* Iuri Pereira Marques
