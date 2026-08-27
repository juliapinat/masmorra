const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Jogo e Progressão
let nivelAtual = 1;
let salasLimpasNoNivel = 0;
const SALAS_PARA_SUBIR_NIVEL = 3; // Quantas salas limpar para aumentar a dificuldade

let salaAtualX = 0;
let salaAtualY = 0;

// Objeto do Jogador
const jogador = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    raio: 15,
    velocidade: 4.5,
    hp: 3,
    maxHp: 5,
    cor: "#00FF00",
    ataqueAtivo: false,
    timerAtaque: 0,
    raioAtaque: 35
};

// Lista de Inimigos e Portas
let inimigos = [];
let portas = [];

// Gerenciamento de Teclas
const teclas = {};
window.addEventListener("keydown", e => teclas[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => teclas[e.key.toLowerCase()] = false);

// Inicializar ou mudar de sala (Gera dificuldade baseada no nivelAtual)
function carregarSala() {
    inimigos = [];
    
    // PROGRESSÃO DE DIFICULDADE:
    // Nível 1: 1 a 2 inimigos lentos
    // Níveis mais altos: Mais inimigos, mais rápidos e com tamanhos variados
    let qtdMinima = Math.min(2 + Math.floor(nivelAtual / 2), 6);
    let qtdMaxima = Math.min(3 + nivelAtual, 9);
    let qtdInimigos = Math.floor(Math.random() * (qtdMaxima - qtdMinima + 1)) + qtdMinima;

    // Se for a primeiríssima sala do jogo (Nível 1, Sala 0,0), facilita para o jogador aprender
    if (nivelAtual === 1 && salaAtualX === 0 && salaAtualY === 0) {
        qtdInimigos = 1; 
    }

    for(let i = 0; i < qtdInimigos; i++) {
        // Multiplicador de velocidade que aumenta com o nível
        let modificadorVelocidade = 1 + (nivelAtual * 0.15); 
        let velocidadeBase = Math.random() * 0.8 + 1.0; // entre 1.0 e 1.8

        // Inimigos em níveis altos têm chance de nascerem "Chefetes" (maiores e mais rápidos)
        let ehGrande = Math.random() < 0.15 && nivelAtual > 2;
        
        inimigos.push({
            x: Math.random() * (canvas.width - 120) + 60,
            y: Math.random() * (canvas.height - 120) + 60,
            velocidade: velocidadeBase * modificadorVelocidade * (ehGrande ? 0.8 : 1),
            raio: ehGrande ? 20 : (Math.random() * 4 + 10), // Tamanhos variados
            cor: ehGrande ? "#8B0000" : "#FF0000", // Vermelho escuro para os grandes
            dano: ehGrande ? 0.04 : 0.02
        });
    }

    // Configura as portas nas bordas da tela
    portas = [
        { x: canvas.width / 2 - 25, y: 0, w: 50, h: 15, dx: 0, dy: -1 },
        { x: canvas.width / 2 - 25, y: canvas.height - 15, w: 50, h: 15, dx: 0, dy: 1 },
        { x: 0, y: canvas.height / 2 - 25, w: 15, h: 50, dx: -1, dy: 0 },
        { x: canvas.width - 15, y: canvas.height / 2 - 25, w: 15, h: 50, dx: 1, dy: 0 }
    ];
}

// Lógica do Jogo (Atualização constante)
function atualizar() {
    // 1. Movimentação do jogador com barreiras físicas
    if (teclas["w"] || teclas["arrowup"]) jogador.y = Math.max(jogador.raio, jogador.y - jogador.velocidade);
    if (teclas["s"] || teclas["arrowdown"]) jogador.y = Math.min(canvas.height - jogador.raio, jogador.y + jogador.velocidade);
    if (teclas["a"] || teclas["arrowleft"]) jogador.x = Math.max(jogador.raio, jogador.x - jogador.velocidade);
    if (teclas["d"] || teclas["arrowright"]) jogador.x = Math.min(canvas.width - jogador.raio, jogador.x + jogador.velocidade);

    // TRAPAÇA / COMANDO DE TESTE: Pular de Nível ao apertar 'N'
    if (teclas["n"]) {
        teclas["n"] = false; // Reseta o estado para não pular vários níveis em sequência imediata
        nivelAtual++;
        salasLimpasNoNivel = 0;
        alert(`⏩ COMANDO ATIVADO: Você pulou para o NÍVEL ${nivelAtual}!`);
        carregarSala();
    }

    // 2. Sistema de Ataque
    if (teclas[" "] && !jogador.ataqueAtivo) {
        jogador.ataqueAtivo = true;
        jogador.timerAtaque = 8; // Duração rápida do golpe
    }

    if (jogador.ataqueAtivo) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) jogador.ataqueAtivo = false;
    }

    // 3. Inteligência Artificial dos Inimigos
    inimigos.forEach((inimigo, index) => {
        let dx = jogador.x - inimigo.x;
        let dy = jogador.y - inimigo.y;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia > 0) {
            inimigo.x += (dx / distancia) * inimigo.velocidade;
            inimigo.y += (dy / distancia) * inimigo.velocidade;
        }

        // Colisão: Monstro atacando jogador
        if (distancia < jogador.raio + inimigo.raio) {
            jogador.hp -= inimigo.dano; // Inimigos maiores dão mais dano
            if (jogador.hp <= 0) {
                alert(`Game Over! Você chegou até o Nível ${nivelAtual}.\nSalas limpas no total: ${salasLimpasNoNivel + ((nivelAtual-1) * SALAS_PARA_SUBIR_NIVEL)}`);
                // Reseta tudo para o início
                nivelAtual = 1;
                salasLimpasNoNivel = 0;
                jogador.hp = 3;
                salaAtualX = 0; salaAtualY = 0;
                carregarSala();
            }
        }

        // Colisão: Jogador derrotando monstro
        if (jogador.ataqueAtivo) {
            let distAtaque = Math.sqrt((jogador.x - inimigo.x)**2 + (jogador.y - inimigo.y)**2);
            if (distAtaque < jogador.raioAtaque + inimigo.raio) {
                inimigos.splice(index, 1);
                
                // Sistema de cura por sorte ao derrotar inimigos (ajuda nas fases difíceis)
                if (Math.random() < 0.15 && jogador.hp < jogador.maxHp) {
                    jogador.hp = Math.min(jogador.maxHp, jogador.hp + 0.5);
                }
            }
        }
    });

    // 4. Transição de Sala e Subida de Nível Regular
    if (inimigos.length === 0) {
        portas.forEach(porta => {
            if (jogador.x > porta.x && jogador.x < porta.x + porta.w &&
                jogador.y > porta.y && jogador.y < porta.y + porta.h) {
                
                salasLimpasNoNivel++;
                
                // Se limpou salas suficientes, o jogador desce mais fundo na masmorra
                if (salasLimpasNoNivel >= SALAS_PARA_SUBIR_NIVEL) {
                    nivelAtual++;
                    salasLimpasNoNivel = 0;
                    alert(`🔹 VOCÊ DESCEU PARA O NÍVEL ${nivelAtual}! 🔹\nOs monstros ficaram mais perigosos...`);
                }

                // Atualiza mapa global
                salaAtualX += porta.dx;
                salaAtualY += porta.dy;

                // Posiciona jogador na extremidade oposta da nova sala
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

    // Altera a cor do fundo sutilmente dependendo do perigo do nível
    let tomVermelho = Math.min(nivelAtual * 12, 80);
    ctx.fillStyle = `rgb(${15 + tomVermelho}, 15, 20)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Desenha as Portas
    portas.forEach(porta => {
        ctx.fillStyle = (inimigos.length === 0) ? "#FFD700" : "#441111";
        ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
    });

    // Desenha os Inimigos
    inimigos.forEach(inimigo => {
        ctx.beginPath();
        ctx.arc(inimigo.x, inimigo.y, inimigo.raio, 0, Math.PI * 2);
        ctx.fillStyle = inimigo.cor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFF";
        ctx.stroke();
        ctx.closePath();
    });

    // Desenha o Efeito Visual do Ataque
    if (jogador.ataqueAtivo) {
        ctx.beginPath();
        ctx.arc(jogador.x, jogador.y, jogador.raioAtaque, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 255, 0.35)";
        ctx.fill();
        ctx.closePath();
    }

    // Desenha o Jogador
    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fillStyle = jogador.cor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.closePath();

    // INTERFACE DO USUÁRIO (HUD)
    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    
    // Corações de vida dinâmicos
    let coracoes = "❤️".repeat(Math.floor(jogador.hp)) + (jogador.hp % 1 >= 0.5 ? "💔" : "");
    ctx.fillText(`Vida: ${coracoes || "💀"}`, 20, 30);
    
    // Informações do Andar
    ctx.fillStyle = "#FFD700";
    ctx.fillText(`ANDAR: ${nivelAtual}`, canvas.width / 2 - 40, 30);
    
    ctx.fillStyle = "#FFF";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Progresso do Andar: ${salasLimpasNoNivel}/${SALAS_PARA_SUBIR_NIVEL}`, 20, canvas.height - 20);
    ctx.fillText(`Sala: [${salaAtualX}, ${salaAtualY}]`, canvas.width - 110, 30);

    if(inimigos.length > 0) {
        ctx.fillStyle = "#FF6666";
        ctx.fillText(`Inimigos na sala: ${inimigos.length}`, canvas.width - 160, canvas.height - 20);
    } else {
        ctx.fillStyle = "#66FF66";
        ctx.fillText("Sala Limpa! Prossiga para a próxima porta.", canvas.width - 290, canvas.height - 20);
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
