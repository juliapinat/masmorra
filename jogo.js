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

// Gerenciamento de Teclas (Melhorado para aceitar maiúsculas e minúsculas)
const teclas = {};
window.addEventListener("keydown", e => {
    teclas[e.key.toLowerCase()] = true;
    teclas[e.key.toUpperCase()] = true; // Garante compatibilidade se o Caps Lock estiver ligado
});
window.addEventListener("keyup", e => {
    teclas[e.key.toLowerCase()] = false;
    teclas[e.key.toUpperCase()] = false;
});

// Inicializar ou mudar de sala (Gera dificuldade baseada no nivelAtual)
function carregarSala() {
    inimigos = [];
    
    // PROGRESSÃO DE DIFICULDADE
    let qtdMinima = Math.min(2 + Math.floor(nivelAtual / 2), 6);
    let qtdMaxima = Math.min(3 + nivelAtual, 9);
    let qtdInimigos = Math.floor(Math.random() * (qtdMaxima - qtdMinima + 1)) + qtdMinima;

    // Primeira sala do jogo é sempre mais fácil
    if (nivelAtual === 1 && salaAtualX === 0 && salaAtualY === 0) {
        qtdInimigos = 1; 
    }

    for(let i = 0; i < qtdInimigos; i++) {
        let modificadorVelocidade = 1 + (nivelAtual * 0.15); 
        let velocidadeBase = Math.random() * 0.8 + 1.0;

        let ehGrande = Math.random() < 0.15 && nivelAtual > 2;
        
        inimigos.push({
            x: Math.random() * (canvas.width - 120) + 60,
            y: Math.random() * (canvas.height - 120) + 60,
            velocidade: velocidadeBase * modificadorVelocidade * (ehGrande ? 0.8 : 1),
            raio: ehGrande ? 20 : (Math.random() * 4 + 10),
            cor: ehGrande ? "#8B0000" : "#FF0000",
            dano: ehGrande ? 0.04 : 0.02
        });
    }

    portas = [
        { x: canvas.width / 2 - 25, y: 0, w: 50, h: 15, dx: 0, dy: -1 },
        { x: canvas.width / 2 - 25, y: canvas.height - 15, w: 50, h: 15, dx: 0, dy: 1 },
        { x: 0, y: canvas.height / 2 - 25, w: 15, h: 50, dx: -1, dy: 0 },
        { x: canvas.width - 15, y: canvas.height / 2 - 25, w: 15, h: 50, dx: 1, dy: 0 }
    ];
}

// Lógica do Jogo (Atualização constante)
function atualizar() {
    // 1. Movimentação do jogador
    if (teclas["w"] || teclas["arrowup"]) jogador.y = Math.max(jogador.raio, jogador.y - jogador.velocidade);
    if (teclas["s"] || teclas["arrowdown"]) jogador.y = Math.min(canvas.height - jogador.raio, jogador.y + jogador.velocidade);
    if (teclas["a"] || teclas["arrowleft"]) jogador.x = Math.max(jogador.raio, jogador.x - jogador.velocidade);
    if (teclas["d"] || teclas["arrowright"]) jogador.x = Math.min(canvas.width - jogador.raio, jogador.x + jogador.velocidade);

    // TRAPAÇA CORRIGIDA: Pular de Nível ao apertar 'N' ou 'n'
    if (teclas["n"] || teclas["N"]) {
        teclas["n"] = false; 
        teclas["N"] = false; // Desativa ambos para evitar repetição contínua
        nivelAtual++;
        salasLimpasNoNivel = 0;
        alert(`⏩ COMANDO ATIVADO: Você pulou para o NÍVEL ${nivelAtual}!`);
        carregarSala();
        return; // Interrompe o frame atual para recarregar a sala com segurança
    }

    // 2. Sistema de Ataque
    if (teclas[" "] && !jogador.ataqueAtivo) {
        jogador.ataqueAtivo = true;
        jogador.timerAtaque = 8;
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

        if (distancia < jogador.raio + inimigo.raio) {
            jogador.hp -= inimigo.dano;
            if (jogador.hp <= 0) {
                alert(`Game Over! Você chegou até o Nível ${nivelAtual}.\nSalas limpas no total: ${salasLimpasNoNivel + ((nivelAtual-1) * SALAS_PARA_SUBIR_NIVEL)}`);
                nivelAtual = 1;
                salasLimpasNoNivel = 0;
                jogador.hp = 3;
                salaAtualX = 0; salaAtualY = 0;
                carregarSala();
            }
        }

        if (jogador.ataqueAtivo) {
            let distAtaque = Math.sqrt((jogador.x - inimigo.x)**2 + (jogador.y - inimigo.y)**2);
            if (distAtaque < jogador.raioAtaque + inimigo.raio) {
                inimigos.splice(index, 1);
                if (Math.random() < 0.15 && jogador.hp < jogador.maxHp) {
                    jogador.hp = Math.min(jogador.maxHp, jogador.hp + 0.5);
                }
            }
        }
    });

    // 4. Transição de Sala Regular pelas portas
    if (inimigos.length === 0) {
        portas.forEach(porta => {
            if (jogador.x > porta.x && jogador.x < porta.x + porta.w &&
                jogador.y > porta.y && jogador.y < porta.y + porta.h) {
                
                salasLimpasNoNivel++;
                
                if (salasLimpasNoNivel >= SALAS_PARA_SUBIR_NIVEL) {
                    nivelAtual++;
                    salasLimpasNoNivel = 0;
                    alert(`🔹 VOCÊ DESCEU PARA O NÍVEL ${nivelAtual}! 🔹\nOs monstros ficaram mais perigosos...`);
                }

                salaAtualX += porta.dx;
                salaAtualY += porta.dy;

                if (porta.dx === 1) jogador.x = 40;
                if (porta.dx === -1) jogador.x = canvas.width - 40;
                if (porta.dy === 1) jogador.y = 40;
                if (porta.dy === -1) jogador.y = canvas.height - 40;

                carregarSala();
            }
        });
    }
}

// Renderização Visual
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let tomVermelho = Math.min(nivelAtual * 12, 80);
    ctx.fillStyle = `rgb(${15 + tomVermelho}, 15, 20)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    portas.forEach(porta => {
        ctx.fillStyle = (inimigos.length === 0) ? "#FFD700" : "#441111";
        ctx.fillRect(porta.x, porta.y, porta.w, porta.h);
    });

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

    if (jogador.ataqueAtivo) {
        ctx.beginPath();
        ctx.arc(jogador.x, jogador.y, jogador.raioAtaque, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 255, 255, 0.35)";
        ctx.fill();
        ctx.closePath();
    }

    ctx.beginPath();
    ctx.arc(jogador.x, jogador.y, jogador.raio, 0, Math.PI * 2);
    ctx.fillStyle = jogador.cor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    
    let coracoes = "❤️".repeat(Math.floor(jogador.hp)) + (jogador.hp % 1 >= 0.5 ? "💔" : "");
    ctx.fillText(`Vida: ${coracoes || "💀"}`, 20, 30);
    
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

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

carregarSala();
loop();
