const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Jogo
const TILE_SIZE = 40;
let salaAtualX = 0;
let salaAtualY = 0;

// Objeto do Jogador
const jogador = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    raio: 15,
    velocidade: 4,
    hp: 3,
    cor: "#00FF00",
    ataqueAtivo: false,
    timerAtaque: 0,
    raioAtaque: 30
};

// Lista de Inimigos e Portas
let inimigos = [];
let portas = [];

// Gerenciamento de Teclas
const teclas = {};
window.addEventListener("keydown", e => teclas[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => teclas[e.key.toLowerCase()] = false);

// Inicializar ou mudar de sala
function carregarSala() {
    inimigos = [];
    
    // Cria de 2 a 4 inimigos baseados na sorte da sala
    let qtdInimigos = Math.floor(Math.random() * 3) + 2;
    for(let i = 0; i < qtdInimigos; i++) {
        inimigos.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            velocidade: 1.5,
            raio: 12,
            cor: "#FF0000"
        });
    }

    // Configura as portas (Norte, Sul, Leste, Oeste)
    portas = [
        { x: canvas.width / 2 - 20, y: 0, w: 40, h: 15, dx: 0, dy: -1, nome: "Norte" },
        { x: canvas.width / 2 - 20, y: canvas.height - 15, w: 40, h: 15, dx: 0, dy: 1, nome: "Sul" },
        { x: 0, y: canvas.height / 2 - 20, w: 15, h: 40, dx: -1, dy: 0, nome: "Oeste" },
        { x: canvas.width - 15, y: canvas.height / 2 - 20, w: 15, h: 40, dx: 1, dy: 0, nome: "Leste" }
    ];
}

// Lógica do Jogo (Atualização constante)
function atualizar() {
    // 1. Movimentação do jogador com colisão com as bordas da tela
    if (teclas["w"] || teclas["arrowup"]) jogador.y = Math.max(jogador.raio, jogador.y - jogador.velocidade);
    if (teclas["s"] || teclas["arrowdown"]) jogador.y = Math.min(canvas.height - jogador.raio, jogador.y + jogador.velocidade);
    if (teclas["a"] || teclas["arrowleft"]) jogador.x = Math.max(jogador.raio, jogador.x - jogador.velocidade);
    if (teclas["d"] || teclas["arrowright"]) jogador.x = Math.min(canvas.width - jogador.raio, jogador.x + jogador.velocidade);

    // 2. Sistema de Ataque
    if (teclas[" "] && !jogador.ataqueAtivo) {
        jogador.ataqueAtivo = true;
        jogador.timerAtaque = 10; // Duração do ataque em frames
    }

    if (jogador.ataqueAtivo) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) jogador.ataqueAtivo = false;
    }

    // 3. Inteligência Artificial dos Inimigos (Perseguição)
    inimigos.forEach((inimigo, index) => {
        let dx = jogador.x - inimigo.x;
        let dy = jogador.y - inimigo.y;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        // Move na direção do jogador
        if (distancia > 0) {
            inimigo.x += (dx / distancia) * inimigo.velocidade;
            inimigo.y += (dy / distancia) * inimigo.velocidade;
        }

        // Colisão: Inimigo toca no jogador
        if (distancia < jogador.raio + inimigo.raio) {
            jogador.hp -= 0.02; // Reduz a vida aos poucos enquanto toca
            if (jogador.hp <= 0) {
                alert("Game Over! Você foi derrotado.");
                jogador.hp = 3;
                salaAtualX = 0; salaAtualY = 0;
                carregarSala();
            }
        }

        // Colisão: Ataque do jogador atinge o inimigo
        if (jogador.ataqueAtivo) {
            let distAtaque = Math.sqrt((jogador.x - inimigo.x)**2 + (jogador.y - inimigo.y)**2);
            if (distAtaque < jogador.raioAtaque + inimigo.raio) {
                inimigos.splice(index, 1); // Elimina o inimigo
            }
        }
    });

    // 4. Transição de Sala pelas Portas (Apenas se a sala estiver limpa)
    if (inimigos.length === 0) {
        portas.forEach(porta => {
            if (jogador.x > porta.x && jogador.x < porta.x + porta.w &&
                jogador.y > porta.y && jogador.y < porta.y + porta.h) {
                
                // Muda a coordenada da sala global
                salaAtualX += porta.dx;
                salaAtualY += porta.dy;

                // Reposiciona o jogador no lado oposto para simular entrada na nova sala
                if (porta.dx === 1) jogador.x = 40;
                if (porta.dx === -1) jogador.x = canvas.width - 40;
                if (porta.dy === 1) jogador.y = 40;
                if (porta.dy === -1) jogador.y = canvas.height - 40;

                carregarSala();
            }
        });
    }
}

// Renderização Visual (Desenho na tela)
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as Portas (Amarelo se aberto, Vermelho escuro se trancado)
    portas.forEach(porta => {
        ctx.fillStyle = (inimigos.length === 0) ? "#FFD700" : "#550000";
        ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
    });

    // Desenha os Inimigos
    inimigos.forEach(inimigo => {
        ctx.beginPath();
        ctx.arc(inimigo.x, inimigo.y, inimigo.raio, 0, Math.PI * 2);
        ctx.fillStyle = inimigo.cor;
        ctx.fill();
        ctx.closePath();
    });

    // Desenha o Alcance do Ataque (Efeito visual)
    if (jogador.ataqueAtivo) {
        ctx.beginPath();
        ctx.arc(jogador.x, jogador.y, jogador.raioAtaque, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
        ctx.fill();
        ctx.closePath();
    }

    // Desenha o Jogador
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fillStyle = jogador.cor;
    ctx.fill();
    ctx.closePath();

    // Interface (HUD) - Vida e Coordenadas da Sala
    ctx.fillStyle = "white";
    ctx.font = "16px sans-serif";
    ctx.fillText(`Vida: ${"❤️".repeat(Math.ceil(jogador.hp))}`, 20, 30);
    ctx.fillText(`Sala Atual: [X: ${salaAtualX}, Y: ${salaAtualY}]`, canvas.width - 180, 30);
    if(inimigos.length > 0) {
        ctx.fillStyle = "#FF4444";
        ctx.fillText(`Inimigos restantes: ${inimigos.length}`, 20, canvas.height - 20);
    } else {
        ctx.fillStyle = "#44FF44";
        ctx.fillText("Sala Limpa! Portas Abertas.", 20, canvas.height - 20);
    }
}

// Loop Principal do Jogo
function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

// Início do Jogo
carregarSala();
loop();
