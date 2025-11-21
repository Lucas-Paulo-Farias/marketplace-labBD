const API_URL = 'http://localhost:3000/api';

function getToken() { return localStorage.getItem('authToken'); }
function getGroup() { return localStorage.getItem('userGrupo'); }
function getUserName() { return localStorage.getItem('userName') || 'Usuário'; }

function checkAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

function setupNav() {
    const nav = document.getElementById('navbar');
    const grupo = getGroup();
    
    let links = `
       <a href="index.html"> <span class="brand">Marketplace DB-LAB</span></a>
        <div>
            <a href="index.html">Produtos</a>
    `;

    if (grupo === 'COMPRADOR') {
        links += `<a href="pedidos.html">Meus Pedidos</a>`;
    }
    
    if (grupo === 'VENDEDOR' || grupo === 'ADMIN') {
        links += `<a href="painel.html">Painel do Vendedor</a>`;
    }

    links += `
            <a onclick="logout()">Sair (${getUserName()})</a>
        </div>
    `;
    
    nav.innerHTML = links;
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function addToCart(produto) {
    const inputQtd = document.getElementById(`qtd-${produto.id}`);
    
    const quantidadeSelecionada = inputQtd ? parseInt(inputQtd.value) : 1;

    if (isNaN(quantidadeSelecionada) || quantidadeSelecionada <= 0) {
        return alert('Por favor, selecione uma quantidade válida.');
    }
    if (quantidadeSelecionada > produto.estoque) {
        return alert(`Quantidade indisponível! Estoque máximo: ${produto.estoque}`);
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(p => p.id === produto.id);
    
    if(existing) {
        existing.quantidade += quantidadeSelecionada;
    } else {
        cart.push({ ...produto, quantidade: quantidadeSelecionada });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${quantidadeSelecionada} unidade(s) de "${produto.nome}" adicionada(s) ao carrinho!`);
    updateCartUI();
}

function updateCartUI() {
    const cartSummary = document.getElementById('cart-summary');
    if(!cartSummary) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((acc, item) => acc + item.quantidade, 0);
    
    if (totalItems > 0) {
        cartSummary.style.display = 'block';
        cartSummary.innerText = `🛒 ${totalItems} itens - Finalizar`;
    } else {
        cartSummary.style.display = 'none';
    }
}