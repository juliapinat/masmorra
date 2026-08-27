const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do Jogo e Progressão
let nivelAtual = 1;
let salasLimpasNoNivel = 0;
const SALAS_PARA_SUBIR_NIVEL = 3;

let salaAtualX = 0;
let salaAtualY = 0;

// Contador global para controlar o ritmo das pernas e braços correndo (Animação)
let frameAnimacao = 0;

// Objeto do Jogador com propriedades de animação
const jogador = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    raio: 16,
    velocidade: 4.5,
    hp: 3,
    maxHp: 5,
    ataqueAtivo: false,
    timerAtaque: 0,
    raioAtaque: 40,
    andando: false,
    direcaoOlhar: 1 // 1 para direita, -1 para esquerda
};

// Lista de Inimigos e Portas
let inimigos = [];
let portas = [];

// Gerenciamento de Teclas
const teclas = {};
window.addEventListener("keydown", e => {
    teclas[e.key.toLowerCase()] = true;
    teclas[e.key.toUpperCase()] = true; 
});
window.addEventListener("keyup", e => {
    teclas[e.key.toLowerCase()] = false;
    teclas[e.key.toUpperCase()] = false;
});

function carregarSala() {
    inimigos = [];
    let qtdMinima = Math.min(2 + Math.floor(nivelAtual / 2), 6);
    let qtdMaxima = Math.min(3 + nivelAtual, 9);
    let qtdInimigos = Math.floor(Math.random() * (qtdMaxima - qtdMinima + 1)) + qtdMinima;

    if (nivelAtual === 1 && salaAtualX === 0 && salaAtualY === 0) {
        qtdInimigos = 1; 
    }

    for(let i = 0; i < qtdInimigos; i++) {
        let modificadorVelocidade = 1 + (nivelAtual * 0.15); 
        let velocidadeBase = Math.random() * 0.8 + 0.8;

        let ehGrande = Math.random() < 0.15 && nivelAtual > 2;
        
        inimigos.push({
            x: Math.random() * (canvas.width - 120) + 60,
            y: Math.random() * (canvas.height - 120) + 60,
            velocidade: velocidadeBase * modificadorVelocidade * (ehGrande ? 0.8 : 1),
            raio: ehGrande ? 24 : 14,
            ehGrande: ehGrande,
            dano: ehGrande ? 0.04 : 0.02,
            timerAtaqueInimigo: 0, // Controla visual do ataque do monstro
            direcaoOlhar: 1
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
    frameAnimacao++; // Incrementa relógio de animação

    // 1. Movimentação e detecção de estado de movimento
    let moveuX = 0;
    let moveuY = 0;

    if (teclas["w"] || teclas["arrowup"]) moveuY = -jogador.velocidade;
    if (teclas["s"] || teclas["arrowdown"]) moveuY = jogador.velocidade;
    if (teclas["a"] || teclas["arrowleft"]) { moveuX = -jogador.velocidade; jogador.direcaoOlhar = -1; }
    if (teclas["d"] || teclas["arrowright"]) { moveuX = jogador.velocidade; jogador.direcaoOlhar = 1; }

    jogador.x = Math.max(jogador.raio, Math.min(canvas.width - jogador.raio, jogador.x + moveuX));
    jogador.y = Math.max(jogador.raio, Math.min(canvas.height - jogador.raio, jogador.y + moveuY));
    
    // Define se o jogador está em movimento para animar as pernas
    jogador.andando = (moveuX !== 0 || moveuY !== 0);

    // Comando 'N' para pular de nível se a sala estiver limpa
    if (teclas["n"] || teclas["N"]) {
        teclas["n"] = false; teclas["N"] = false;
        if (inimigos.length === 0) {
            nivelAtual++;
            salasLimpasNoNivel = 0;
            alert(`🔹 PORTAS ABERTAS! Você avançou para o NÍVEL ${nivelAtual}! 🔹`);
            carregarSala();
            return;
        }
    }

    // 2. Sistema de Ataque do Jogador
    if (teclas[" "] && !jogador.ataqueAtivo) {
        jogador.ataqueAtivo = true;
        jogador.timerAtaque = 12; 
    }

    if (jogador.ataqueAtivo) {
        jogador.timerAtaque--;
        if (jogador.timerAtaque <= 0) jogador.ataqueAtivo = false;
    }

    // 3. IA e Ataque dos Inimigos
    inimigos.forEach((inimigo, index) => {
        let dx = jogador.x - inimigo.x;
        let dy = jogador.y - inimigo.y;
        let distancia = Math.sqrt(dx * dx + dy * dy);

        // Define para onde o inimigo está olhando
        if (dx > 0) inimigo.direcaoOlhar = 1;
        if (dx < 0) inimigo.direcaoOlhar = -1;

        if (distancia > 0) {
            inimigo.x += (dx / distancia) * inimigo.velocidade;
            inimigo.y += (dy / distancia) * inimigo.velocidade;
        }

        // Se o inimigo encostar no jogador, ele entra em estado de ataque
        if (distancia < jogador.raio + inimigo.raio) {
            jogador.hp -= inimigo.dano;
            inimigo.timerAtaqueInimigo = 10; // Ativa animação de garras do monstro

            if (jogador.hp <= 0) {
                alert(`Game Over! Você chegou até o Nível ${nivelAtual}.`);
                nivelAtual = 1; salasLimpasNoNivel = 0; jogador.hp = 3; salaAtualX = 0; salaAtualY = 0;
                carregarSala();
            }
        }

        // Reduz o timer de animação de ataque do monstro
        if (inimigo.timerAtaqueInimigo > 0) inimigo.timerAtaqueInimigo--;

        // Ataque do jogador atinge monstro
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

    // 4. Transição de Sala Regular
    if (inimigos.length === 0) {
        portas.forEach(porta => {
            if (jogador.x > porta.x && jogador.x < porta.x + porta.w &&
                jogador.y > porta.y && jogador.y < porta.y + porta.h) {
                
                salasLimpasNoNivel++;
                if (salasLimpasNoNivel >= SALAS_PARA_SUBIR_NIVEL) {
                    nivelAtual++;
                    salasLimpasNoNivel = 0;
                    alert(`🔹 VOCÊ DESCEU PARA O NÍVEL ${nivelAtual}! 🔹`);
                }

                salaAtualX += porta.dx; salaAtualY += porta.dy;
                if (porta.dx === 1) jogador.x = 40;
                if (porta.dx === -1) jogador.x = canvas.width - 40;
                if (porta.dy === 1) jogador.y = 40;
                if (porta.dy === -1) jogador.y = canvas.height - 40;

                carregarSala();
            }
        });
    }
}

// ARTE PROCEDURAL: Desenha o Sprite do Cavaleiro (Jogador)
function desenharJogador(x, y, jogadorObj) {
    ctx.save();
    ctx.translate(x, y);

    let balancoY = jogadorObj.andando ? Math.sin(frameAnimacao * 0.4) * 2 : 0;
    let movimentoPerna = jogadorObj.andando ? Math.sin(frameAnimacao * 0.4) * 6 : 0;

    // 1. Pernas/Botas
    ctx.fillStyle = "#333";
    ctx.fillRect(-8, 8 + (movimentoPerna > 0 ? -2 : 2), 5, 8); 
    ctx.fillRect(3, 8 + (movimentoPerna > 0 ? 2 : -2), 5, 8);  

    // 2. Capa do Cavaleiro
    ctx.fillStyle = "#A30000"; 
    if (jogadorObj.direcaoOlhar === 1) {
        ctx.fillRect(-15, -6 + balancoY, 8, 16);
    } else {
        ctx.fillRect(7, -6 + balancoY, 8, 16);
    }

    // 3. Corpo/Armadura
    ctx.fillStyle = "#708090"; 
    ctx.fillRect(-10, -8 + balancoY, 20, 18); 
    ctx.fillStyle = "#4682B4"; 
    ctx.fillRect(-6, -4 + balancoY, 12, 10);

    // 4. Capacete Metálico
    ctx.fillStyle = "#A9A9A9";
    ctx.fillRect(-8, -20 + balancoY, 16, 13);
    ctx.fillStyle = "#111";
    if (jogadorObj.direcaoOlhar === 1) {
        ctx.fillRect(-2, -16 + balancoY, 10, 3);
    } else {
        ctx.fillRect(-8, -16 + balancoY, 10, 3);
    }

    // 5. ANIMAÇÃO DE ATAQUE
    if (jogadorObj.ataqueAtivo) {
        ctx.strokeStyle = "#00FFFF"; 
        ctx.lineWidth = 4;
        ctx.beginPath();
        if (jogadorObj.direcaoOlhar === 1) {
            ctx.arc(10, 0, 22, -Math.PI/3, Math.PI/3);
        } else {
            ctx.arc(-10, 0, 22, Math.PI - Math.PI/3, Math.PI + Math.PI/3);
        }
        ctx.stroke();
    } else {
        ctx.fillStyle = "#C0C0C0";
        if (jogadorObj.direcaoOlhar === 1) {
            ctx.fillRect(10, -6 + balancoY, 3, 12); 
        } else {
            ctx.fillRect(-13, -6 + balancoY, 3, 12); 
        }
    }

    ctx.restore();
}

// ARTE PROCEDURAL: Desenha o Sprite do Monstro/Inimigo
function desenharInimigo(inimigoObj) {
    ctx.save();
    ctx.translate(inimigoObj.x, inimigoObj.y);

    let balancoMonstro = Math.sin(frameAnimacao * 0.2 + inimigoObj.x) * 3;
    let corPrincipal = inimigoObj.ehGrande ? "#4A0000" : "#2E8B57"; 

    // 1. Corpo Monstruoso
    ctx.fillStyle = corPrincipal;
    ctx.fillRect(-inimigoObj.raio, -inimigoObj.raio + balancoMonstro, inimigoObj.raio * 2, inimigoObj.raio * 2);

    // 2. Olhos Famintos
    ctx.fillStyle = "#FFD700";
    if (inimigoObj.direcaoOlhar === 1) {
        ctx.fillRect(2, -8 + balancoMonstro, 4, 4);
        ctx.fillRect(10, -8 + balancoMonstro, 4, 4);
    } else {
        ctx.fillRect(-14, -8 + balancoMonstro, 4, 4);
        ctx.fillRect(-6, -8 + balancoMonstro, 4, 4);
    }

    // 3. ANIMAÇÃO DE ATAQUE DO INIMIGO
    if (inimigoObj.timerAtaqueInimigo > 0) {
        ctx.fillStyle = "#FF0000"; 
        if (inimigoObj.direcaoOlhar === 1) {
            ctx.fillRect(inimigoObj.raio, -2 + balancoMonstro, 12, 4); 
        } else {
            ctx.fillRect(-inimigoObj.raio - 12, -2 + balancoMonstro, 12, 4);
        }
    } else {
        ctx.fillStyle = corPrincipal;
        let balancoBraco = Math.cos(frameAnimacao * 0.3) * 4;
        if (inimigoObj.direcaoOlhar === 1) {
            ctx.fillRect(inimigoObj.raio - 2, balancoBraco, 6, 8);
        } else {
            ctx.fillRect(-inimigoObj.raio - 4, balancoBraco, 6, 8);
        }
    }

    ctx.restore();
}

// Renderização Geral
function desenhar() {ctx.clearRect(0, 0, canvas.width, canvas.height);let tomVermelho = Math.min(nivelAtual * 12, 80);ctx.fillStyle = rgb(${15 + tomVermelho}, 15, 20);ctx.fillRect(0, 0, canvas.width, canvas.height);// Portasportas.forEach(porta => {ctx.fillStyle = (inimigos.length === 0) ? "#FFD700" : "#441111";ctx.fillRect(porta.x, porta.y, porta.w, porta.h);});// Desenha todos os Inimigos usando a nova função de Spriteinimigos.forEach(inimigo => {desenharInimigo(inimigo);});// Desenha o alcance de ataque sutil em voltaif (jogador.ataqueAtivo) {ctx.beginPath();ctx.arc(jogador.x, jogador.y, jogador.raioAtaque, 0, Math.PI * 2);ctx.fillStyle = "rgba(0, 255, 255, 0.15)";ctx.fill();ctx.closePath();}// Desenha o Jogador usando a nova função de SpritedesenharJogador(jogador.x, jogador.y, jogador);// Interface HUDctx.fillStyle = "white";ctx.font = "bold 16px sans-serif";let coracoes = "❤️".repeat(Math.floor(jogador.hp)) + (jogador.hp % 1 >= 0.5 ? "💔" : "");ctx.fillText(Vida: ${coracoes || "💀"}, 20, 30);ctx.fillStyle = "#FFD700";ctx.fillText(ANDAR: ${nivelAtual}, canvas.width / 2 - 40, 30);ctx.fillStyle = "#FFF";ctx.font = "14px sans-serif";ctx.fillText(Progresso do Andar: ${salasLimpasNoNivel}/${SALAS_PARA_SUBIR_NIVEL}, 20, canvas.height - 20);ctx.fillText(Sala: [${salaAtualX}, ${salaAtualY}], canvas.width - 110, 30);if(inimigos.length > 0) {ctx.fillStyle = "#FF6666";ctx.fillText(Inimigos na sala: ${inimigos.length}, canvas.width - 160, canvas.height - 20);} else {ctx.fillStyle = "#66FF66";ctx.fillText("Sala Limpa! Pressione [N] ou use as portas para avançar.", canvas.width - 390, canvas.height - 20);}}function loop() {atualizar();desenhar();requestAnimationFrame(loop);}carregarSala();loop();