const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1600;
canvas.height = 900;

// --- Variáveis Globais de Lógica ---
let estadoDoJogo = 'carregando';
let plataformas = [], inimigos = [], projeteis = [], projeteisInimigos = [], efeitosVisuais = [];
let teclas = { a: { pressionada: false }, d: { pressionada: false } };
let mouse = { x: 0, y: 0, pressionado: false };
let opcoesDeUpgrade = [], player;
let ondaAtual = 0, timerProximaOnda = 0;
let textoEspecial = { texto: "", alpha: 0, duration: 2500, timer: 0 };
let menuButtons = {};
let bossFoiDerrotado = false;

// <<< NOVO: Lógica de Controles Virtuais >>>
const isMobile = isMobileDevice();
const virtualControls = {
    left:  { x: 100, y: canvas.height - 100, radius: 50 },
    right: { x: 220, y: canvas.height - 100, radius: 50 },
    jump:  { x: 160, y: canvas.height - 200, radius: 50 },
    shoot: { x: canvas.width - 150, y: canvas.height - 150, radius: 80 },
    special:{ x: canvas.width - 280, y: canvas.height - 80, radius: 40 }
};

// --- Funções de Inicialização ---
function inicializarJogo() {
    plataformas = [new Plataforma(0, canvas.height - 40, canvas.width, 40)];
    player = new Player();
    inimigos = []; projeteis = []; projeteisInimigos = []; efeitosVisuais = [];
    ondaAtual = 0;
    bossFoiDerrotado = false;
    estadoDoJogo = 'entreOndas';
    timerProximaOnda = Date.now() + TEMPO_ENTRE_ONDAS;
}

function iniciarProximaOnda() {
    ondaAtual++;
    estadoDoJogo = 'rodando';
    let defOnda = DEFINICOES_ONDAS[ondaAtual - 1] || {
        tipo1: Math.min(10, 5 + Math.floor((ondaAtual - 5) / 2)),
        tipo2: Math.min(6, 2 + Math.floor((ondaAtual - 5) / 3)),
        miniboss: bossFoiDerrotado ? 1 : 0
    };
    if (defOnda.boss) { inimigos.push(new Inimigo(canvas.width / 2 - 75, -160, 'boss')); }
    if (defOnda.miniboss) { inimigos.push(new Inimigo(Math.random() * (canvas.width - 110), -120 - Math.random() * 200, 'miniboss')); }
    for (let i = 0; i < (defOnda.tipo1 || 0); i++) { inimigos.push(new Inimigo(Math.random() * (canvas.width - 40), -60 - Math.random() * 200, 'tipo1')); }
    for (let i = 0; i < (defOnda.tipo2 || 0); i++) { inimigos.push(new Inimigo(Math.random() * (canvas.width - 80), -80 - Math.random() * 300, 'tipo2')); }
}

// --- Lógica de Atualização (Update) ---
function checarColisoes() {
    for (let i = projeteis.length - 1; i >= 0; i--) { const p = projeteis[i]; if (!p) continue; for (let j = inimigos.length - 1; j >= 0; j--) { const inimigo = inimigos[j]; if (isColliding(p, inimigo)) { inimigo.sofrerDano(p.dano); projeteis.splice(i, 1); if (inimigo.vida <= 0) { if (inimigo.tipo === 'boss') { const bossAudios = ['siteclonado', '75', '50', '25']; bossAudios.forEach(name => { if (assets[name]) { assets[name].pause(); assets[name].currentTime = 0; } }); } player.inimigoDerrotado(inimigo.expConcedida, inimigo.tipo); inimigos.splice(j, 1); } break; } } }
    for (let i = projeteisInimigos.length - 1; i >= 0; i--) { const p = projeteisInimigos[i]; if (isColliding(p, player)) { player.sofrerDano(p.dano); projeteisInimigos.splice(i, 1); break; } }
}

function update() {
    if (['gameOver', 'levelUp', 'carregando', 'menuPrincipal', 'menuPoderes'].includes(estadoDoJogo)) return;
    if (textoEspecial.timer > 0) { textoEspecial.timer -= 16.67; textoEspecial.alpha = textoEspecial.timer / textoEspecial.duration; }
    if (estadoDoJogo === 'entreOndas') { if (Date.now() >= timerProximaOnda) iniciarProximaOnda(); player.update(); }
    if (estadoDoJogo === 'rodando') { player.update(); if (mouse.pressionado) player.atirar(); inimigos.forEach(i => i.update(player)); checarColisoes(); if (estadoDoJogo === 'levelUp') return; if (inimigos.length === 0) { estadoDoJogo = 'entreOndas'; timerProximaOnda = Date.now() + TEMPO_ENTRE_ONDAS; } }
    [...projeteis, ...projeteisInimigos, ...efeitosVisuais].forEach(obj => obj.update());
    const naTela = p => p.posicao.x > -p.largura && p.posicao.x < canvas.width + p.largura && p.posicao.y > -p.altura && p.posicao.y < canvas.height + p.altura;
    projeteis = projeteis.filter(naTela); projeteisInimigos = projeteisInimigos.filter(naTela);
    efeitosVisuais = efeitosVisuais.filter(e => !e.remover);
}

// --- Lógica de Desenho (Draw) ---
function drawVirtualControls() {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '30px Arial';

    // Botões da Esquerda
    ctx.beginPath(); ctx.arc(virtualControls.left.x, virtualControls.left.y, virtualControls.left.radius, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(virtualControls.right.x, virtualControls.right.y, virtualControls.right.radius, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(virtualControls.jump.x, virtualControls.jump.y, virtualControls.jump.radius, 0, 2 * Math.PI); ctx.fill();
    
    // Botões da Direita
    ctx.beginPath(); ctx.arc(virtualControls.shoot.x, virtualControls.shoot.y, virtualControls.shoot.radius, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(virtualControls.special.x, virtualControls.special.y, virtualControls.special.radius, 0, 2 * Math.PI); ctx.fill();

    // Texto dos botões
    ctx.fillStyle = '#000';
    ctx.fillText('<', virtualControls.left.x, virtualControls.left.y + 10);
    ctx.fillText('>', virtualControls.right.x, virtualControls.right.y + 10);
    ctx.fillText('↑', virtualControls.jump.x, virtualControls.jump.y + 10);
    ctx.fillText('ATIRAR', virtualControls.shoot.x, virtualControls.shoot.y + 10);
    ctx.font = '24px Arial';
    ctx.fillText('F', virtualControls.special.x, virtualControls.special.y + 8);

    ctx.globalAlpha = 1.0;
}

// ... (Outras funções de desenho: drawMainMenu, drawPowersMenu, etc. inalteradas) ...
function drawMainMenu() { ctx.fillStyle = '#0f0f1e'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '100px "Courier New", monospace'; ctx.fillText("O Iludido", canvas.width / 2, 250); menuButtons.iniciar = { x: canvas.width/2 - 150, y: 400, width: 300, height: 70 }; menuButtons.poderes = { x: canvas.width/2 - 150, y: 500, width: 300, height: 70 }; ctx.fillStyle = '#222'; ctx.fillRect(menuButtons.iniciar.x, menuButtons.iniciar.y, menuButtons.iniciar.width, menuButtons.iniciar.height); ctx.fillRect(menuButtons.poderes.x, menuButtons.poderes.y, menuButtons.poderes.width, menuButtons.poderes.height); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.strokeRect(menuButtons.iniciar.x, menuButtons.iniciar.y, menuButtons.iniciar.width, menuButtons.iniciar.height); ctx.strokeRect(menuButtons.poderes.x, menuButtons.poderes.y, menuButtons.poderes.width, menuButtons.poderes.height); ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace'; ctx.fillText("Iniciar Jogo", canvas.width / 2, 445); ctx.fillText("Poderes", canvas.width / 2, 545); }
function drawPowersMenu() { ctx.fillStyle = '#0f0f1e'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '60px "Courier New", monospace'; ctx.fillText("Lista de Poderes", canvas.width / 2, 100); todosOsUpgrades.forEach((up, i) => { const yPos = 200 + i * 60; ctx.font = '28px "Courier New", monospace'; ctx.fillStyle = '#00ffff'; ctx.fillText(up.nome, canvas.width/2, yPos); ctx.font = '20px "Courier New", monospace'; ctx.fillStyle = '#fff'; ctx.fillText(up.descricao, canvas.width/2, yPos + 25); }); menuButtons.voltar = { x: canvas.width/2 - 150, y: canvas.height - 150, width: 300, height: 70 }; ctx.fillStyle = '#222'; ctx.fillRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height); ctx.strokeStyle = '#e63946'; ctx.strokeRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height); ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace'; ctx.fillText("Voltar", canvas.width / 2, canvas.height - 105); }
function drawGameUI() { const p = player; ctx.fillStyle = '#333'; ctx.fillRect(20, 20, 250, 25); ctx.fillStyle = '#ff4757'; ctx.fillRect(20, 20, (p.vida / p.vidaMax) * 250, 25); ctx.fillStyle = '#333'; ctx.fillRect(20, 55, 250, 20); ctx.fillStyle = '#f1c40f'; ctx.fillRect(20, 55, (p.exp / p.expParaProximoNivel) * 250, 20); ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 20, 250, 25); ctx.strokeRect(20, 55, 250, 20); ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.fillText(`HP: ${Math.ceil(p.vida)} / ${p.vidaMax}`, 30, 38); ctx.font = '14px Arial'; ctx.fillText(`EXP: ${p.exp} / ${p.expParaProximoNivel}`, 30, 70); ctx.font = '24px Arial'; ctx.fillText(`Nível: ${p.nivel}`, 290, 45); ctx.textAlign = 'right'; ctx.font = '24px Arial'; ctx.fillStyle = '#fff'; ctx.fillText('Especial [F]', canvas.width - 20, 40); for (let i = 0; i < p.specialCharges; i++) drawImageWithFallback(assets.kenner, canvas.width - 60 - (i * 45), 50, 25, 40, 'magenta'); if (p.specialCharges < p.maxSpecialCharges) { ctx.fillStyle = '#555'; ctx.fillRect(canvas.width - 20 - 150, 100, 150, 10); ctx.fillStyle = '#00ffff'; ctx.fillRect(canvas.width - 20 - 150, 100, (p.specialChargeProgress / KILLS_PER_CHARGE) * 150, 10); } ctx.textAlign = 'center'; ctx.font = '32px "Courier New", monospace'; if (estadoDoJogo === 'rodando') { let eBoss = inimigos.find(i => i.tipo === 'boss'); if (eBoss) { ctx.fillStyle = '#d00000'; ctx.fillText(`!!! ONDA DO CHEFE !!!`, canvas.width / 2, 80); } else { ctx.fillStyle = '#e63946'; ctx.fillText(`ONDA ${ondaAtual}`, canvas.width / 2, 50); } } else if (estadoDoJogo === 'entreOndas') { const tempo = Math.ceil((timerProximaOnda - Date.now()) / 1000); ctx.fillStyle = '#00ffff'; ctx.fillText(ondaAtual === 0 ? `O jogo começa em: ${tempo}s` : `Próxima onda em: ${tempo}s`, canvas.width / 2, 50); } if (textoEspecial.timer > 0) { ctx.font = '50px "Courier New", monospace'; ctx.fillStyle = `rgba(255, 255, 0, ${textoEspecial.alpha})`; ctx.fillText(textoEspecial.texto, canvas.width / 2, canvas.height / 2); } }
function drawLevelUpScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.font = '60px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('LEVEL UP!', canvas.width / 2, 150); ctx.font = '30px "Courier New", monospace'; ctx.fillText('Escolha um upgrade:', canvas.width / 2, 220); opcoesDeUpgrade.forEach((up, i) => { up.box = { x: canvas.width / 2 - 250, y: 280 + i * 120, width: 500, height: 100 }; ctx.fillStyle = '#222'; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.fillRect(up.box.x, up.box.y, up.box.width, up.box.height); ctx.strokeRect(up.box.x, up.box.y, up.box.width, up.box.height); ctx.fillStyle = '#00ffff'; ctx.font = '28px "Courier New", monospace'; ctx.fillText(up.nome, canvas.width / 2, up.box.y + 45); ctx.fillStyle = '#fff'; ctx.font = '20px "Courier New", monospace'; ctx.fillText(up.descricao, canvas.width / 2, up.box.y + 75); }); }
function drawGameOverScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#e63946'; ctx.font = '80px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('FIM DE JOGO', canvas.width / 2, canvas.height / 2 - 50); ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace'; ctx.fillText(`Você sobreviveu até a Onda ${ondaAtual}`, canvas.width / 2, canvas.height / 2 + 20); ctx.fillText('Clique para voltar ao menu', canvas.width / 2, canvas.height / 2 + 80); }

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch(estadoDoJogo) {
        case 'carregando':
            ctx.fillStyle = '#fff'; ctx.font = '40px "Courier New", monospace';
            ctx.textAlign = 'center'; ctx.fillText(`Carregando...`, canvas.width / 2, canvas.height / 2);
            break;
        case 'menuPrincipal': drawMainMenu(); break;
        case 'menuPoderes': drawPowersMenu(); break;
        case 'rodando': case 'entreOndas':
            plataformas.forEach(p => p.draw()); projeteis.forEach(p => p.draw()); projeteisInimigos.forEach(p => p.draw());
            player.draw(); inimigos.forEach(i => i.draw()); efeitosVisuais.forEach(e => e.draw());
            drawGameUI();
            if (isMobile) drawVirtualControls(); // <<< NOVO: Desenha os controles na tela
            break;
        case 'levelUp':
            plataformas.forEach(p => p.draw()); projeteis.forEach(p => p.draw()); projeteisInimigos.forEach(p => p.draw());
            player.draw(); inimigos.forEach(i => i.draw()); efeitosVisuais.forEach(e => e.draw());
            drawGameUI(); drawLevelUpScreen();
            break;
        case 'gameOver':
            drawGameOverScreen();
            break;
    }
    ctx.textAlign = 'start';
}

// --- Loop Principal e Eventos ---
function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
// Teclado
window.addEventListener('keydown', (e) => { if (['rodando', 'entreOndas'].includes(estadoDoJogo)) { const key = e.key.toLowerCase(); if (key === 'a') teclas.a.pressionada = true; else if (key === 'd') teclas.d.pressionada = true; else if (key === ' ') player.pular(); else if (key === 'f') player.usarEspecial(); } });
window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if (key === 'a') teclas.a.pressionada = false; else if (key === 'd') teclas.d.pressionada = false; });
// Mouse
canvas.addEventListener('mousemove', (e) => { const rect = canvas.getBoundingClientRect(); mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top; });
canvas.addEventListener('mouseup', () => { mouse.pressionado = false; });
canvas.addEventListener('mousedown', () => { switch(estadoDoJogo) { case 'menuPrincipal': if (isPointInRect(mouse, menuButtons.iniciar)) inicializarJogo(); if (isPointInRect(mouse, menuButtons.poderes)) estadoDoJogo = 'menuPoderes'; break; case 'menuPoderes': if (isPointInRect(mouse, menuButtons.voltar)) estadoDoJogo = 'menuPrincipal'; break; case 'rodando': case 'entreOndas': mouse.pressionado = true; break; case 'gameOver': estadoDoJogo = 'menuPrincipal'; break; case 'levelUp': opcoesDeUpgrade.forEach(up => { if (isPointInRect(mouse, up.box)) { up.aplicar(player); estadoDoJogo = inimigos.length === 0 ? 'entreOndas' : 'rodando'; if (estadoDoJogo === 'entreOndas') timerProximaOnda = Date.now() + TEMPO_ENTRE_ONDAS; } }); break; } });

// <<< NOVO: Eventos de Toque para Mobile >>>
function handleTouch(e) {
    if (!['rodando', 'entreOndas'].includes(estadoDoJogo)) return;
    e.preventDefault();
    
    // Reseta o estado dos botões antes de verificar os toques atuais
    teclas.a.pressionada = false;
    teclas.d.pressionada = false;
    mouse.pressionado = false;

    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const touchPos = { x: touch.clientX - canvas.getBoundingClientRect().left, y: touch.clientY - canvas.getBoundingClientRect().top };

        // Lado Esquerdo - Movimento
        if (isPointInCircle(touchPos, virtualControls.left)) teclas.a.pressionada = true;
        if (isPointInCircle(touchPos, virtualControls.right)) teclas.d.pressionada = true;
        if (isPointInCircle(touchPos, virtualControls.jump)) player.pular(); // Pulo é um evento, não um estado

        // Lado Direito - Ações
        if (isPointInCircle(touchPos, virtualControls.special)) player.usarEspecial();
        if (isPointInCircle(touchPos, virtualControls.shoot)) {
            mouse.x = touchPos.x;
            mouse.y = touchPos.y;
            mouse.pressionado = true;
        }
    }
}

if (isMobile) {
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', handleTouch);
}

gameLoop();
