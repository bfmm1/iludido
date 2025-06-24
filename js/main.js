// --- FUNÇÕES DE RANKING ---
// Carrega o ranking do localStorage
function carregarRanking() {
    const rankingJSON = localStorage.getItem('oIludidoRanking');
    if (rankingJSON) {
        try {
            return JSON.parse(rankingJSON);
        } catch (e) {
            console.error("Erro ao carregar ranking:", e);
            return [];
        }
    }
    return [];
}

// Salva a nova pontuação no ranking
function salvarPontuacao(nome, pontuacao) {
    if (!nome) nome = "Anônimo"; // Garante que o nome não seja vazio
    const ranking = carregarRanking();
    ranking.push({ nome, pontuacao });
    // Ordena por pontuação (maior para menor) e mantém apenas os 10 melhores
    ranking.sort((a, b) => b.pontuacao - a.pontuacao);
    ranking.splice(10); // Mantém apenas o top 10
    localStorage.setItem('oIludidoRanking', JSON.stringify(ranking));
}


const assets = {};
const nomesImagens = ['playerc', 'playerd', 'playere', 'inimigo1', 'inimigo2', 'boss', 'kenner', 'dinheiro', 'coin', 'fundo', 'fase'];
const nomesAudios = ['siteclonado', '75', '50', '25', 'tiro', 'theme'];

let assetsCarregados = 0;
const totalAssets = nomesImagens.length + nomesAudios.length;

function assetCarregado() {
    assetsCarregados++;
    if (assetsCarregados === totalAssets) {
        estadoDoJogo = 'menuPrincipal';
    }
}

nomesImagens.forEach(nome => {
    const img = new Image();
    img.src = `${nome}.png`;
    img.onload = assetCarregado;
    img.onerror = () => { console.error(`Erro ao carregar imagem ${nome}.png`); assetCarregado(); };
    assets[nome] = img;
});

nomesAudios.forEach(nome => {
    const audio = new Audio();
    audio.src = `${nome}.mp3`;
    audio.addEventListener('canplay', assetCarregado, { once: true });
    audio.onerror = () => { console.error(`Erro ao carregar áudio ${nome}.mp3`); assetCarregado(); };
    assets[nome] = audio;
});

class Plataforma {
    constructor(x, y, largura, altura) {
        this.posicao = { x, y };
        this.largura = largura;
        this.altura = altura;
    }
    draw() {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.posicao.x, this.posicao.y, this.largura, this.altura);
    }
}

class Player {
    constructor() {
        // Atributos de Posição e Movimento
        this.posicao = { x: canvas.width / 2 - 40, y: canvas.height - 150 };
        this.velocidade = { x: 0, y: 0 };
        this.largura = 80;
        this.altura = 90;
        this.velocidadeMovimento = 4;
        this.forcaPuloBase = 15;
        this.estaNoChao = false;
        this.direcaoVisual = 'parado';

        // Atributos de Jogo e Combate
        this.vidaMax = 100;
        this.vida = 100;
        // EXP REMOVIDO
        this.danoProjetil = 10;
        this.chanceCritico = 0.05;
        this.defesa = 0;
        this.cooldownTiroBase = 800;
        this.ultimoTiro = 0;
        this.invencivel = false;
        this.tempoInvencivel = 500;
        this.timerInvencivel = 0;
        this.specialCharges = 3;
        this.maxSpecialCharges = 3;
        this.specialChargeProgress = 0;
        this.killsForNextCharge = 10;
        this.pickedUpgrades = [];
        
        // Propriedades dos Upgrades
        this.pierceCount = 0;
        this.projectileSizeMultiplier = 1.0;
        this.critDamageMultiplier = 1.5;
        this.maxJumps = 1;
        this.currentJumps = 0;
        this.lifesteal = 0;
        this.contactDamage = 0;
        this.lastContactDamage = 0;
        this.hasBarrier = false;
        this.barrierActive = true;
        this.barrierCooldown = 10000;
        this.barrierTimer = 0;
        this.revives = 0;
        this.upgradeChoices = 3;
        this.distanceTraveledForFriction = 0;
        this.frictionProjectiles = 0;
        this.thunderbolts = { count: 0, cooldown: 5000, timer: 0 };
        this.fragmentationCount = 0;
        this.hasColdEffect = false;
        this.hasRage = false;
        this.hpRegenPerEnemy = 0;
        this.hasFocus = false;
        this.focusTimer = 0;
        this.healingOrbChance = 0;
    }

    scalePlayer(factor) {
        this.largura *= factor;
        this.altura *= factor;
    }

    draw() {
        ctx.globalAlpha = this.invencivel ? 0.5 : 1.0;
        const sprites = { parado: assets.playerc, direita: assets.playerd, esquerda: assets.playere };
        drawImageWithFallback(sprites[this.direcaoVisual], this.posicao.x, this.posicao.y, this.largura, this.altura, '#1e90ff');
        ctx.globalAlpha = 1.0;
        if (this.hasBarrier && this.barrierActive) {
            ctx.beginPath();
            ctx.arc(this.posicao.x + this.largura/2, this.posicao.y + this.altura/2, this.largura/2 + 5, 0, 2*Math.PI);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }
    }

    update() {
        this.direcaoVisual = teclas.d.pressionada ? 'direita' : (teclas.a.pressionada ? 'esquerda' : 'parado');
        this.velocidade.x = 0;
        if (teclas.a.pressionada && this.posicao.x > 0) this.velocidade.x = -this.velocidadeMovimento;
        if (teclas.d.pressionada && this.posicao.x + this.largura < canvas.width) this.velocidade.x = this.velocidadeMovimento;
        this.posicao.x += this.velocidade.x;
        this.distanceTraveledForFriction += Math.abs(this.velocidade.x);

        if (this.frictionProjectiles > 0 && this.distanceTraveledForFriction > 100) {
            for (let i = 0; i < this.frictionProjectiles; i++) {
                efeitosVisuais.push(new UpwardProjectile(this.posicao.x + this.largura / 2, this.posicao.y));
            }
            this.distanceTraveledForFriction = 0;
        }

        this.velocidade.y += GRAVIDADE;
        this.posicao.y += this.velocidade.y;
        this.estaNoChao = false;
        plataformas.forEach(plataforma => {
            if (this.velocidade.y > 0 && this.posicao.y + this.altura >= plataforma.posicao.y && this.posicao.y + this.altura - this.velocidade.y <= plataforma.posicao.y && this.posicao.x + this.largura > plataforma.posicao.x && this.posicao.x < plataforma.posicao.x + plataforma.largura) {
                this.velocidade.y = 0;
                this.posicao.y = plataforma.posicao.y - this.altura;
                this.estaNoChao = true;
                this.currentJumps = this.maxJumps;
            }
        });

        if (this.invencivel) { if ((this.timerInvencivel -= 16.67) <= 0) this.invencivel = false; }
        if (this.hasBarrier && !this.barrierActive) { if ((this.barrierTimer -= 16.67) <= 0) this.barrierActive = true; }

        if (this.thunderbolts.count > 0) {
            this.thunderbolts.timer -= 16.67;
            if (this.thunderbolts.timer <= 0) {
                for (let i = 0; i < this.thunderbolts.count; i++) {
                    efeitosVisuais.push(new Thunderbolt(Math.random() * canvas.width));
                }
                this.thunderbolts.timer = this.thunderbolts.cooldown;
            }
        }

        if (this.velocidade.x === 0 && this.hasFocus) { this.focusTimer += 16.67; } else { this.focusTimer = 0; }
        if (this.hpRegenPerEnemy > 0 && this.vida < this.vidaMax) { this.vida = Math.min(this.vidaMax, this.vida + (inimigos.length * this.hpRegenPerEnemy)); }
    }
    
    pular() { if (this.currentJumps > 0) { this.velocidade.y = -this.forcaPuloBase; this.currentJumps--; } }
    
    atirar() {
        let cooldownAtual = this.cooldownTiroBase;
        if (this.hasFocus && this.focusTimer > 0) { cooldownAtual /= (1 + this.focusTimer / 2000); }
        const agora = Date.now();
        if (agora - this.ultimoTiro > cooldownAtual) {
            this.ultimoTiro = agora;
            const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 };
            let dano = this.danoProjetil;
            if (this.hasRage) { const vidaPerdida = 1 - (this.vida / this.vidaMax); if(vidaPerdida > 0) dano *= (1 + vidaPerdida / 2); }
            let isCrit = Math.random() < this.chanceCritico;
            if (isCrit) { dano *= this.critDamageMultiplier; }

            if (bossFoiDerrotado) { const anguloPrincipal = Math.atan2(mouse.y - centro.y, mouse.x - centro.x); const spread = 45 * (Math.PI / 180); projeteis.push(new Projétil(centro.x, centro.y, dano, isCrit, anguloPrincipal)); projeteis.push(new Projétil(centro.x, centro.y, dano, isCrit, anguloPrincipal - spread / 2)); projeteis.push(new Projétil(centro.x, centro.y, dano, isCrit, anguloPrincipal + spread / 2)); }
            else { projeteis.push(new Projétil(centro.x, centro.y, dano, isCrit)); }
            
            if (assets.tiro) { assets.tiro.currentTime = 0; assets.tiro.volume = volumeEfeitosSlider * MAX_VOLUME_TIRO; assets.tiro.play(); }
        }
    }

    sofrerDano(dano) {
        if (this.invencivel) return;
        if (this.hasBarrier && this.barrierActive) { this.barrierActive = false; this.barrierTimer = this.barrierCooldown; this.invencivel = true; this.timerInvencivel = 200; return; }
        this.vida -= dano * (1 - this.defesa);
        this.invencivel = true;
        this.timerInvencivel = this.tempoInvencivel;
        if (this.vida <= 0) {
            if (this.revives > 0) {
                this.revives--; this.vida = this.vidaMax;
                inimigos.forEach(i => i.vida = 0);
                this.invencivel = true; this.timerInvencivel = 3000;
            } else {
                this.vida = 0; 
                estadoDoJogo = 'gameOver';
                // Adiciona um pequeno delay para o prompt não bloquear o último frame
                setTimeout(() => {
                    const nome = prompt("Fim de Jogo! Digite seu nome para o ranking:", "Jogador");
                    salvarPontuacao(nome, score);
                }, 100);
            }
        }
    }

    inimigoDerrotado(tipo, scoreValue) { // EXP REMOVIDO
        if (tipo === 'boss') {
            bossFoiDerrotado = true;
        }
        score += scoreValue;

        if (this.specialCharges < this.maxSpecialCharges) {
            this.specialChargeProgress++;
            if (this.specialChargeProgress >= KILLS_PER_CHARGE) {
                this.specialCharges++;
                this.specialChargeProgress = 0;
            }
        }
    }

    iniciarLevelUp() {
        const upgradesDisponiveis = todosOsUpgrades.filter(up => {
            if (up.unimplemented) return false;
            if (up.maxPicks) {
                return this.pickedUpgrades.filter(p => p.nome === up.nome).length < up.maxPicks;
            }
            return true;
        });
        opcoesDeUpgrade = [...upgradesDisponiveis].sort(() => 0.5 - Math.random()).slice(0, this.upgradeChoices);
    }

    aplicarUpgrade(upgrade) {
        upgrade.aplicar(this);
        this.pickedUpgrades.push(upgrade);
    }

    usarEspecial() { if (this.specialCharges > 0 && ['rodando', 'entreOndas'].includes(estadoDoJogo)) { this.specialCharges--; efeitosVisuais.push(new SpecialProjectile(this.posicao.x + this.largura / 2, this.posicao.y + this.altura / 2)); ativarTextoEspecial("Kenner L7, paga só o frete"); } }
}

class Inimigo { constructor(x, y, tipo) { Object.assign(this, { tipo, posicao: { x, y }, vida: 0, velocidadeY: 1.0 + (ondaAtual * 0.05), velocidadeX: (0.5 + ondaAtual * 0.1) * (Math.random() < 0.5 ? 1 : -1), alvoY: canvas.height * 0.6 - Math.random() * 200, ultimoTiro: Date.now() + Math.random() * 2000, patrulhaRange: 40 + Math.random() * 40, patrulhaSpeed: (Math.random() * 0.05 + 0.02) / 1000, spawnTimestamp: Date.now(), podeMoverHorizontalmente: false }); this.vidaMax = 20 + ondaAtual * 5; this.danoTiro = 5 + Math.floor(ondaAtual * 1.5); this.slowModifier = 1.0; if (tipo === 'tipo1') { Object.assign(this, { imagem: assets.inimigo1, largura: 40, altura: 40, scoreValue: 100, cooldownTiroBase: 3000 }); } else if (tipo === 'tipo2') { Object.assign(this, { imagem: assets.inimigo2, largura: 80, altura: 80, scoreValue: 250, cooldownTiroBase: 2200 }); this.vidaMax *= 2.5; this.danoTiro *= 1.5; } else if (tipo === 'boss') { Object.assign(this, { imagem: assets.boss, largura: 150, altura: 150, scoreValue: 5000, cooldownTiroBase: 1800, estadoAtaque: 'movendo', timerAtaque: Date.now(), tocouFalaEntrada: false, tocouFala75: false, tocouFala50: false, tocouFala25: false }); this.vidaMax = 4000; this.danoTiro = 15; } this.vida = this.vidaMax; this.proximoIntervaloTiro = this.cooldownTiroBase + Math.random() * 1500; this.patrulhaCenterY = this.alvoY; } draw() { drawImageWithFallback(this.imagem, this.posicao.x, this.posicao.y, this.largura, this.altura, this.tipo === 'tipo1' ? '#e63946' : '#fca311'); const pVida = this.vida / this.vidaMax; if (this.tipo !== 'boss') { ctx.fillStyle = '#dc2f02'; ctx.fillRect(this.posicao.x, this.posicao.y - 10, this.largura, 5); ctx.fillStyle = '#9ef01a'; ctx.fillRect(this.posicao.x, this.posicao.y - 10, this.largura * pVida, 5); } else { ctx.fillStyle = '#333'; ctx.fillRect(canvas.width/4, 20, canvas.width/2, 20); ctx.fillStyle = '#d00000'; ctx.fillRect(canvas.width/4, 20, (canvas.width/2) * pVida, 20); ctx.strokeStyle = '#fff'; ctx.strokeRect(canvas.width/4, 20, canvas.width/2, 20); } } _playVoiceLine(audioName) { const bossAudios = ['siteclonado', '75', '50', '25']; bossAudios.forEach(name => { if (assets[name]) { assets[name].pause(); assets[name].currentTime = 0; } }); if (assets[audioName]) { const volumeFinal = Math.min(1, volumeMusicaSlider * MAX_VOLUME_MUSICA + BOSS_VOICE_BOOST); assets[audioName].volume = volumeFinal; assets[audioName].play(); } } update(player) { if (this.tipo === 'boss') { this.updateBoss(player); return; } if (this.posicao.y < this.alvoY) { this.posicao.y += this.velocidadeY * this.slowModifier; } if (!this.podeMoverHorizontalmente && Date.now() - this.spawnTimestamp > 4000) { this.podeMoverHorizontalmente = true; this.patrulhaCenterY = this.posicao.y; } if (this.podeMoverHorizontalmente) { this.posicao.x += this.velocidadeX * this.slowModifier; if (this.posicao.x <= 0 || this.posicao.x + this.largura >= canvas.width) { this.velocidadeX *= -1; } this.posicao.y = this.patrulhaCenterY + Math.sin(Date.now() * this.patrulhaSpeed) * this.patrulhaRange; const agora = Date.now(); if (agora - this.ultimoTiro > this.proximoIntervaloTiro) { this.ultimoTiro = agora; this.proximoIntervaloTiro = this.cooldownTiroBase + Math.random() * 1500; const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 }; const angulo = Math.atan2(player.posicao.y + player.altura / 2 - centro.y, player.posicao.x + player.largura / 2 - centro.x); const vel = { x: Math.cos(angulo) * 4, y: Math.sin(angulo) * 4 }; projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 6, '#ff4d6d', vel, this.danoTiro)); } } } updateBoss(player) { if (this.posicao.y < 100) { this.posicao.y += this.velocidadeY; } else { this.posicao.x += Math.sin(Date.now() / 2000) * 1.5; } const percentualVida = this.vida / this.vidaMax; if (!this.tocouFalaEntrada) { this._playVoiceLine('siteclonado'); this.tocouFalaEntrada = true; } else if (percentualVida < 0.75 && !this.tocouFala75) { this._playVoiceLine('75'); this.tocouFala75 = true; } else if (percentualVida < 0.50 && !this.tocouFala50) { this._playVoiceLine('50'); this.tocouFala50 = true; } else if (percentualVida < 0.25 && !this.tocouFala25) { this._playVoiceLine('25'); this.tocouFala25 = true; } const agora = Date.now(); if (agora - this.timerAtaque > this.cooldownTiroBase) { this.timerAtaque = agora; this.estadoAtaque = Math.random() < 0.6 ? 'normal' : 'barragem'; const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 }; if (this.estadoAtaque === 'normal') { const angulo = Math.atan2(player.posicao.y + player.altura / 2 - centro.y, player.posicao.x + player.largura / 2 - centro.x); const vel = { x: Math.cos(angulo) * 6, y: Math.sin(angulo) * 6 }; projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 10, '#ff6a00', vel, this.danoTiro)); } else { for (let i = -3; i <= 3; i++) { const angulo = Math.atan2(player.posicao.y - centro.y, player.posicao.x - centro.x) + (i * 0.2); const vel = { x: Math.cos(angulo) * 5, y: Math.sin(angulo) * 5 }; projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 7, '#ff8c00', vel, this.danoTiro)); } } } } sofrerDano(dano) { this.vida -= dano; } }
class Projétil { constructor(x, y, dano, isCrit, angulo) { this.posicao = { x, y }; this.dano = dano; this.isCrit = isCrit; this.pierceLeft = player.pierceCount; this.largura = 30 * player.projectileSizeMultiplier; this.altura = 30 * player.projectileSizeMultiplier; const anguloTiro = angulo !== undefined ? angulo : Math.atan2(mouse.y - this.posicao.y, mouse.x - this.posicao.x); this.velocidade = { x: Math.cos(anguloTiro) * 5.4, y: Math.sin(anguloTiro) * 5.4 }; } draw() { drawImageWithFallback(assets.dinheiro, this.posicao.x - this.largura / 2, this.posicao.y - this.altura / 2, this.largura, this.altura, this.isCrit ? '#ffcc00' : '#f1c40f'); } update() { this.posicao.x += this.velocidade.x; this.posicao.y += this.velocidade.y; } }
class InimigoProjétil { constructor(x, y, raio, cor, vel, dano) { this.posicao = {x, y}; this.raio = raio; this.cor = cor; this.velocidade = vel; this.dano = dano; this.largura = raio * 2; this.altura = raio * 2; } draw() { ctx.beginPath(); ctx.arc(this.posicao.x, this.posicao.y, this.raio, 0, 2 * Math.PI); ctx.fillStyle = this.cor; ctx.fill(); } update() { this.posicao.x += this.velocidade.x; this.posicao.y += this.velocidade.y; } }
class SpecialProjectile { constructor(x, y) { this.posicao = { x, y }; this.alvo = { x: canvas.width / 2, y: canvas.height / 2 }; this.remover = false; this.angulo = Math.atan2(this.alvo.y - this.posicao.y, this.alvo.x - this.posicao.x); } update() { this.posicao.x += Math.cos(this.angulo) * SPECIAL_PROJECTILE_SPEED; this.posicao.y += Math.sin(this.angulo) * SPECIAL_PROJECTILE_SPEED; if (Math.hypot(this.alvo.x - this.posicao.x, this.alvo.y - this.posicao.y) < SPECIAL_PROJECTILE_SPEED) { this.remover = true; efeitosVisuais.push(new Explosion(this.alvo.x, this.alvo.y)); } } draw() { ctx.save(); ctx.translate(this.posicao.x, this.posicao.y); ctx.rotate(this.angulo + Math.PI / 2); drawImageWithFallback(assets.kenner, -25, -40, 50, 80, 'magenta'); ctx.restore(); } }
class Explosion { constructor(x, y) { this.posicao = { x, y }; this.remover = false; this.vida = 30; this.appliedDamage = false; } update() { if (!this.appliedDamage) { projeteisInimigos = []; inimigos.forEach(inimigo => { if (SPECIAL_DAMAGE >= inimigo.vida) { efeitosDeDano.push(new DamageNumber(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y, "OVERKILL")); inimigo.vida = 0; } else { inimigo.sofrerDano(SPECIAL_DAMAGE); efeitosDeDano.push(new DamageNumber(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y, SPECIAL_DAMAGE)); } }); this.appliedDamage = true; } this.vida--; if (this.vida <= 0) this.remover = true; } draw() { ctx.beginPath(); ctx.arc(this.posicao.x, this.posicao.y, SPECIAL_EXPLOSION_RADIUS * (1 - this.vida / 30), 0, 2 * Math.PI); ctx.strokeStyle = `rgba(255, 255, 0, ${this.vida / 30})`; ctx.lineWidth = 5; ctx.stroke(); } }
class Coin { constructor(x, y) { this.posicao = { x, y }; this.velocidade = { x: (Math.random() - 0.5) * 4, y: -5 }; this.largura = 20; this.altura = 20; this.remover = false; } update() { this.velocidade.y += GRAVIDADE * 0.5; this.posicao.y += this.velocidade.y; this.posicao.x += this.velocidade.x; if (this.posicao.y + this.altura > canvas.height - 40) { this.posicao.y = canvas.height - 40 - this.altura; this.velocidade.y *= -0.5; this.velocidade.x *= 0.8; } } draw() { drawImageWithFallback(assets.coin, this.posicao.x, this.posicao.y, this.largura, this.altura, 'gold'); } }
class DamageNumber { constructor(x, y, amount) { this.posicao = { x, y }; this.texto = amount === "OVERKILL" ? "OVERKILL" : Math.round(amount); this.cor = amount === "OVERKILL" ? "red" : "white"; this.vida = 60; this.alpha = 1; this.remover = false; } update() { this.posicao.y -= 1; this.vida--; this.alpha = this.vida / 60; if (this.vida <= 0) this.remover = true; } draw() { ctx.fillStyle = `rgba(${this.cor === 'red' ? '255, 0, 0' : '255, 255, 255'}, ${this.alpha})`; ctx.font = '22px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.texto, this.posicao.x, this.posicao.y); } }
class Thunderbolt { constructor(x) { this.posicao = { x, y: 0 }; this.largura = 10; this.altura = canvas.height; this.remover = false; this.vida = 20; this.appliedDamage = false; } update() { this.vida--; if (this.vida <= 0) { this.remover = true; } if (this.vida < 10 && !this.appliedDamage) { inimigos.forEach(inimigo => { if (Math.abs(inimigo.posicao.x + inimigo.largura/2 - this.posicao.x) < 50) { inimigo.sofrerDano(30); efeitosDeDano.push(new DamageNumber(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y, 30)); } }); this.appliedDamage = true; } } draw() { if (this.vida > 10) { ctx.fillStyle = `rgba(255, 255, 0, 0.2)`; ctx.fillRect(this.posicao.x - 25, 0, 50, canvas.height); } else { ctx.fillStyle = `rgba(255, 255, 255, 0.8)`; ctx.fillRect(this.posicao.x - this.largura/2, 0, this.largura, canvas.height); } } }
class UpwardProjectile { constructor(x, y) { this.posicao = {x, y}; this.velocidade = {x: 0, y: -5}; this.dano = 10; this.largura = 10; this.altura = 20; this.remover = false; } update() { this.posicao.y += this.velocidade.y; if (this.posicao.y < 0) this.remover = true; } draw() { ctx.fillStyle = 'orange'; ctx.fillRect(this.posicao.x - this.largura/2, this.posicao.y, this.largura, this.altura); } }
class HealingOrb { constructor(x, y) { this.posicao = {x, y}; this.raio = 12; this.remover = false; this.largura = 24; this.altura = 24; } update() {} draw() { ctx.beginPath(); ctx.arc(this.posicao.x, this.posicao.y, this.raio, 0, 2*Math.PI); ctx.fillStyle = 'lightgreen'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.stroke(); } }

// --- Constantes de Jogo e Balanceamento ---
const GRAVIDADE = 0.6;
const TEMPO_ENTRE_ONDAS = 3000;
const KILLS_PER_CHARGE = 10;
const SPECIAL_PROJECTILE_SPEED = 4;
const SPECIAL_DAMAGE = 40;
const SPECIAL_EXPLOSION_RADIUS = 250;
const MAX_VOLUME_MUSICA = 0.12;
const MAX_VOLUME_TIRO = 0.08;
const BOSS_VOICE_BOOST = 0.3;

// --- DEFINICOES_ONDAS removida, a lógica agora está em iniciarProximaOnda()

// --- Lista Completa de Upgrades ---
const todosOsUpgrades = [
    { nome: "Swift", descricao: "Velocidade de Movimento +20%", aplicar: (p) => p.velocidadeMovimento *= 1.2 },
    { nome: "Swift+", descricao: "Velocidade de Movimento +40%", aplicar: (p) => p.velocidadeMovimento *= 1.4 },
    { nome: "Catalyst+", descricao: "Dano do Projétil +4", aplicar: (p) => p.danoProjetil += 4 },
    { nome: "Charge", descricao: "Tamanho do Projétil +20%", aplicar: (p) => p.projectileSizeMultiplier += 0.2 },
    { nome: "Cloak", descricao: "Duração da invulnerabilidade +10%", aplicar: (p) => p.tempoInvencivel *= 1.1 },
    { nome: "Growth+", descricao: "Vida Máx. +20", aplicar: (p) => { p.vidaMax += 20; p.vida += 20; } },
    { nome: "Growth++", descricao: "Vida Máx. +40", aplicar: (p) => { p.vidaMax += 40; p.vida += 40; } },
    { nome: "Resonance+", descricao: "Vel. de Ataque +24%", aplicar: (p) => p.cooldownTiroBase *= 0.76 },
    { nome: "Shrink", descricao: "Deixa você 10% menor", aplicar: (p) => p.scalePlayer(0.9) },
    { nome: "Precision", descricao: "Dano de crítico +50%", aplicar: (p) => p.critDamageMultiplier += 0.5 },
    { nome: "Stability", descricao: "Projéteis perfuram +1 inimigo", aplicar: (p) => p.pierceCount++ },
    { nome: "Gush", descricao: "Adiciona +1 Pulo", aplicar: (p) => p.maxJumps++ },
    { nome: "Leech", descricao: "Roubo de Vida de 3% do Dano", aplicar: (p) => p.lifesteal += 0.03 },
    { nome: "Leech+", descricao: "Roubo de Vida de 9% do Dano", aplicar: (p) => p.lifesteal += 0.09 },
    { nome: "Overheat", descricao: "Seu corpo causa 40 de dano por contato", aplicar: (p) => p.contactDamage += 40 },
    { nome: "Barrier", descricao: "Cria um escudo que bloqueia dano a cada 10s", aplicar: (p) => p.hasBarrier = true },
    { nome: "Fragmentation", descricao: "Inimigos mortos soltam 2 projéteis fracos", aplicar: (p) => p.fragmentationCount += 2 },
    { nome: "Fragmentation+", descricao: "Inimigos mortos soltam 6 projéteis fracos", aplicar: (p) => p.fragmentationCount += 6 },
    { nome: "Cold", descricao: "Inimigos ficam mais lentos ao sofrer dano", aplicar: (p) => p.hasColdEffect = true },
    { nome: "Friction", descricao: "A cada metro corrido, 1 projétil é lançado para cima", aplicar: (p) => p.frictionProjectiles += 1 },
    { nome: "Friction+", descricao: "A cada metro corrido, 3 projéteis são lançados para cima", aplicar: (p) => p.frictionProjectiles += 3 },
    { nome: "Thunderbolt", descricao: "Cai um raio do céu a cada 5s", aplicar: (p) => p.thunderbolts.count += 1 },
    { nome: "Thunderbolt+", descricao: "Caem 3 raios do céu a cada 5s", aplicar: (p) => p.thunderbolts.count += 3 },
    { nome: "Rage", descricao: "Aumenta o dano com a vida baixa (até +50%)", aplicar: (p) => p.hasRage = true },
    { nome: "Regrowth", descricao: "Regenera Vida baseado nos inimigos vivos", aplicar: (p) => p.hpRegenPerEnemy += 0.005 },
    { nome: "Focus", descricao: "Ganha Vel. de Ataque ao ficar parado", aplicar: (p) => p.hasFocus = true },
    { nome: "Orb", descricao: "Inimigos tem 5% de chance de soltar um orbe de cura", aplicar: (p) => p.healingOrbChance += 0.05 },
    { nome: "Appraisal", descricao: "+1 opção de item ao subir de nível", aplicar: (p) => p.upgradeChoices++ },
    { nome: "Immortal", descricao: "+1 Reviver (mata todos os inimigos ao reviver)", aplicar: (p) => p.revives++, maxPicks: 1 },
    { nome: "Luck", descricao: "Maior chance de itens incomuns (Não impl.)", aplicar: (p) => {}, unimplemented: true },
    { nome: "Tome", descricao: "Novos itens comuns são 35% mais efetivos (Não impl.)", aplicar: (p) => {}, unimplemented: true },
    { nome: "Will-O-Wisp", descricao: "Invoca um ajudante (Não impl.)", aplicar: (p) => {}, unimplemented: true },
    { nome: "Wound", descricao: "Causa sangramento nos inimigos (Não impl.)", aplicar: (p) => {}, unimplemented: true },
];

function drawImageWithFallback(img, x, y, w, h, color) { if (img?.complete && img.naturalHeight !== 0) { ctx.drawImage(img, x, y, w, h); } else { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); } }
function isPointInRect(point, rect) { return (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height); }
function isColliding(objA, objB) { return (objA.posicao.x < objB.posicao.x + objB.largura && objA.posicao.x + objA.largura > objB.posicao.x && objA.posicao.y < objB.posicao.y + objB.altura && objA.posicao.y + objA.altura > objB.posicao.y); }
function ativarTextoEspecial(texto) { textoEspecial.texto = texto; textoEspecial.timer = textoEspecial.duration; textoEspecial.alpha = 1.0; }

function pararTodosOsSons(pararMusicaTema = true) {
    for (const key in assets) {
        if (assets[key] instanceof HTMLAudioElement) {
            if (key === 'theme' && !pararMusicaTema) continue;
            assets[key].pause();
            assets[key].currentTime = 0;
        }
    }
    if (pararMusicaTema) {
        themeMusicStarted = false;
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1600;
canvas.height = 900;

// --- Variáveis Globais de Lógica ---
let estadoDoJogo = 'carregando';
let gameStateBeforePause = null;
let menuStateBeforeOptions = null;
let plataformas = [], inimigos = [], projeteis = [], projeteisInimigos = [], efeitosVisuais = [], moedas = [], efeitosDeDano = [];
let teclas = { a: { pressionada: false }, d: { pressionada: false } };
let mouse = { x: 0, y: 0, pressionado: false };
let opcoesDeUpgrade = [], player;
let ondaAtual = 0, timerProximaOnda = 0, score = 0;
let textoEspecial = { texto: "", alpha: 0, duration: 2500, timer: 0 };
let menuButtons = {};
let bossFoiDerrotado = false;
let bossApareceu = false; // NOVA VARIÁVEL
let themeMusicStarted = false;
let draggingSlider = null;
let volumeMusicaSlider = 1.0;
let volumeEfeitosSlider = 1.0;

function inicializarJogo() {
    pararTodosOsSons(false);
    plataformas = [new Plataforma(0, canvas.height - 40, canvas.width, 40)];
    player = new Player();
    inimigos = []; projeteis = []; projeteisInimigos = []; efeitosVisuais = []; moedas = []; efeitosDeDano = [];
    ondaAtual = 0; score = 0;
    bossFoiDerrotado = false;
    bossApareceu = false; // Reseta a flag do boss
    estadoDoJogo = 'entreOndas';
    timerProximaOnda = Date.now() + TEMPO_ENTRE_ONDAS;
}

function playIntroAndStartGame() {
    estadoDoJogo = 'intro';
    const introVideo = document.getElementById('introVideo');
    canvas.style.display = 'none';
    introVideo.style.display = 'block';
    introVideo.currentTime = 0;
    introVideo.play().catch(e => {
        console.error("Erro ao tocar o vídeo de introdução:", e);
        startGameAfterIntro();
    });
    introVideo.onended = startGameAfterIntro;
}

function startGameAfterIntro() {
    const introVideo = document.getElementById('introVideo');
    introVideo.style.display = 'none';
    canvas.style.display = 'block';
    inicializarJogo();
}

function iniciarProximaOnda() {
    if (player.hasFocus) player.focusTimer = 0;
    ondaAtual++;
    estadoDoJogo = 'rodando';

    // Lógica de geração de inimigos modificada
    if (ondaAtual === 10 && !bossApareceu) {
        // Onda 10: Apenas o boss
        inimigos.push(new Inimigo(canvas.width / 2 - 75, -160, 'boss'));
        bossApareceu = true;
    } else {
        // Ondas normais e infinitas
        const numTipo1 = 2 + Math.floor(ondaAtual * 1.5);
        const numTipo2 = Math.floor(ondaAtual / 3);
        
        for (let i = 0; i < numTipo1; i++) {
            inimigos.push(new Inimigo(Math.random() * (canvas.width - 40), -60 - Math.random() * 200, 'tipo1'));
        }
        for (let i = 0; i < numTipo2; i++) {
            inimigos.push(new Inimigo(Math.random() * (canvas.width - 80), -80 - Math.random() * 300, 'tipo2'));
        }
    }
}

function checarColisoes() {
    for (let i = projeteis.length - 1; i >= 0; i--) { const p = projeteis[i]; if (!p) continue; for (let j = inimigos.length - 1; j >= 0; j--) { const inimigo = inimigos[j]; if (isColliding(p, inimigo)) { inimigo.sofrerDano(p.dano); if(player.hasColdEffect) inimigo.slowModifier = Math.max(0.2, inimigo.slowModifier * 0.99); if(player.lifesteal > 0) player.vida = Math.min(player.vidaMax, player.vida + p.dano * player.lifesteal); efeitosDeDano.push(new DamageNumber(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y, p.dano)); if(p.pierceLeft > 0) { p.pierceLeft--; } else { projeteis.splice(i, 1); } break; } } }
    const playerHitbox = { posicao: { x: player.posicao.x + (player.largura * 0.15), y: player.posicao.y + (player.altura * 0.15) }, largura: player.largura * 0.7, altura: player.altura * 0.7 };
    for (let i = projeteisInimigos.length - 1; i >= 0; i--) { const p = projeteisInimigos[i]; if (isColliding(p, playerHitbox)) { player.sofrerDano(p.dano); projeteisInimigos.splice(i, 1); break; } }
    for (let i = inimigos.length - 1; i >= 0; i--) { const inimigo = inimigos[i]; if(player.contactDamage > 0 && Date.now() - player.lastContactDamage > 500 && isColliding(player, inimigo)) { inimigo.sofrerDano(player.contactDamage); efeitosDeDano.push(new DamageNumber(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y, player.contactDamage)); player.lastContactDamage = Date.now(); } if (inimigo.vida <= 0) { if (inimigo.tipo === 'boss') { const bossAudios = ['siteclonado', '75', '50', '25']; bossAudios.forEach(name => { if (assets[name]) { assets[name].pause(); assets[name].currentTime = 0; } }); } if (Math.random() < player.healingOrbChance) { efeitosVisuais.push(new HealingOrb(inimigo.posicao.x, inimigo.posicao.y)); } if(player.fragmentationCount > 0) { for(let k=0; k < player.fragmentationCount; k++) { projeteisInimigos.push(new InimigoProjétil(inimigo.posicao.x, inimigo.posicao.y, 5, 'gray', {x: (Math.random()-0.5)*8, y: (Math.random()-0.5)*8}, 5)); } } player.inimigoDerrotado(inimigo.tipo, inimigo.scoreValue); moedas.push(new Coin(inimigo.posicao.x + inimigo.largura / 2, inimigo.posicao.y)); inimigos.splice(i, 1); } }
    for (let i = moedas.length - 1; i >= 0; i--) { if (isColliding(player, moedas[i])) { moedas.splice(i, 1); score += 10; } }
    for (let i = efeitosVisuais.length - 1; i >= 0; i--) { const efeito = efeitosVisuais[i]; if (efeito instanceof HealingOrb && isColliding(player, efeito)) { player.vida = Math.min(player.vidaMax, player.vida + 10); efeito.remover = true; } }
}

function update() {
    if (['gameOver', 'levelUp', 'carregando', 'menuPrincipal', 'menuPoderes', 'menuVolume', 'menuRanking', 'pausado', 'intro'].includes(estadoDoJogo)) return;
    if (textoEspecial.timer > 0) { textoEspecial.timer -= 16.67; textoEspecial.alpha = textoEspecial.timer / textoEspecial.duration; }
    if (estadoDoJogo === 'entreOndas') { if (Date.now() >= timerProximaOnda) iniciarProximaOnda(); player.update(); }
    if (estadoDoJogo === 'rodando') {
        player.update();
        if (mouse.pressionado) player.atirar();
        inimigos.forEach(i => i.update(player));
        checarColisoes();
        if (estadoDoJogo === 'gameOver') return; // Checagem para não processar mais após morrer
        if (inimigos.length === 0) {
            // Fim da onda -> Oferece upgrade
            player.iniciarLevelUp();
            estadoDoJogo = 'levelUp';
        }
    }
    [...projeteis, ...projeteisInimigos, ...efeitosVisuais, ...moedas, ...efeitosDeDano].forEach(obj => obj.update());
    const naTela = p => p.posicao.x > -p.largura && p.posicao.x < canvas.width + p.largura && p.posicao.y > -p.altura && p.posicao.y < canvas.height + p.altura;
    projeteis = projeteis.filter(naTela); projeteisInimigos = projeteisInimigos.filter(naTela);
    efeitosVisuais = efeitosVisuais.filter(e => !e.remover);
    efeitosDeDano = efeitosDeDano.filter(e => !e.remover);
}

// --- Funções de Desenho ---
function drawMainMenu() {
    drawImageWithFallback(assets.fundo, 0, 0, canvas.width, canvas.height, '#0f0f1e');
    ctx.textAlign = 'center';
    const buttonX = canvas.width - 400;
    const buttonYStart = 350; // Ajustado para dar espaço ao novo botão
    const buttonYSpacing = 90;
    menuButtons.iniciar = { x: buttonX, y: buttonYStart, width: 300, height: 70 };
    menuButtons.ranking = { x: buttonX, y: buttonYStart + buttonYSpacing, width: 300, height: 70 };
    menuButtons.poderes = { x: buttonX, y: buttonYStart + buttonYSpacing * 2, width: 300, height: 70 };
    menuButtons.volume = { x: buttonX, y: buttonYStart + buttonYSpacing * 3, width: 300, height: 70 };
    
    ctx.fillStyle = '#222';
    ctx.fillRect(menuButtons.iniciar.x, menuButtons.iniciar.y, menuButtons.iniciar.width, menuButtons.iniciar.height);
    ctx.fillRect(menuButtons.ranking.x, menuButtons.ranking.y, menuButtons.ranking.width, menuButtons.ranking.height);
    ctx.fillRect(menuButtons.poderes.x, menuButtons.poderes.y, menuButtons.poderes.width, menuButtons.poderes.height);
    ctx.fillRect(menuButtons.volume.x, menuButtons.volume.y, menuButtons.volume.width, menuButtons.volume.height);
    
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
    ctx.strokeRect(menuButtons.iniciar.x, menuButtons.iniciar.y, menuButtons.iniciar.width, menuButtons.iniciar.height);
    ctx.strokeRect(menuButtons.ranking.x, menuButtons.ranking.y, menuButtons.ranking.width, menuButtons.ranking.height);
    ctx.strokeRect(menuButtons.poderes.x, menuButtons.poderes.y, menuButtons.poderes.width, menuButtons.poderes.height);
    ctx.strokeRect(menuButtons.volume.x, menuButtons.volume.y, menuButtons.volume.width, menuButtons.volume.height);
    
    ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace';
    ctx.fillText("Iniciar Jogo", buttonX + 150, buttonYStart + 45);
    ctx.fillText("Ranking", buttonX + 150, buttonYStart + buttonYSpacing + 45);
    ctx.fillText("Poderes", buttonX + 150, buttonYStart + buttonYSpacing * 2 + 45);
    ctx.fillText("Volume", buttonX + 150, buttonYStart + buttonYSpacing * 3 + 45);
}

function drawRankingScreen() {
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = '60px "Courier New", monospace';
    ctx.fillText("TOP 10 PONTUAÇÕES", canvas.width / 2, 100);

    const ranking = carregarRanking();
    if (ranking.length === 0) {
        ctx.font = '30px "Courier New", monospace';
        ctx.fillText("Nenhuma pontuação registrada.", canvas.width / 2, 250);
    } else {
        ctx.font = '28px "Courier New", monospace';
        let yPos = 200;
        ranking.forEach((entry, index) => {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#00ffff';
            ctx.fillText(`${index + 1}. ${entry.nome}`, canvas.width / 2 - 250, yPos);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(entry.pontuacao, canvas.width / 2 + 250, yPos);
            yPos += 50;
        });
    }

    menuButtons.voltar = { x: canvas.width / 2 - 150, y: canvas.height - 150, width: 300, height: 70 };
    ctx.fillStyle = '#222';
    ctx.fillRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.strokeStyle = '#e63946';
    ctx.strokeRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("Voltar", canvas.width / 2, canvas.height - 105);
}


function drawVolumeMenu() {
    const sliderWidth = 500;
    const sliderX = canvas.width / 2 - sliderWidth / 2;
    menuButtons.sliderMusica = { x: sliderX, y: 300, width: sliderWidth, height: 40 };
    menuButtons.sliderEfeitos = { x: sliderX, y: 500, width: sliderWidth, height: 40 };
    menuButtons.voltar = { x: canvas.width/2 - 150, y: canvas.height - 150, width: 300, height: 70 };
    ctx.fillStyle = '#0f0f1e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '60px "Courier New", monospace';
    ctx.fillText("Opções de Volume", canvas.width / 2, 150);
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(`Música: ${(volumeMusicaSlider * 100).toFixed(0)}%`, canvas.width/2, 280);
    ctx.fillStyle = '#555'; ctx.fillRect(sliderX, 310, sliderWidth, 20);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(sliderX, 310, sliderWidth * volumeMusicaSlider, 20);
    ctx.fillText(`Efeitos: ${(volumeEfeitosSlider * 100).toFixed(0)}%`, canvas.width/2, 480);
    ctx.fillStyle = '#555'; ctx.fillRect(sliderX, 510, sliderWidth, 20);
    ctx.fillStyle = '#00ffff'; ctx.fillRect(sliderX, 510, sliderWidth * volumeEfeitosSlider, 20);
    ctx.fillStyle = '#222'; ctx.fillRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.strokeStyle = '#e63946'; ctx.strokeRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.fillStyle = '#fff'; ctx.fillText("Voltar", canvas.width / 2, canvas.height - 105);
}

function drawPowersMenu() {
    ctx.fillStyle = '#0f0f1e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '60px "Courier New", monospace';
    ctx.fillText("Lista de Poderes", canvas.width / 2, 100);
    let yPos = 150;
    todosOsUpgrades.forEach((up) => {
        if (up.unimplemented) return;
        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(up.nome, canvas.width / 2, yPos);
        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(up.descricao, canvas.width / 2, yPos + 22);
        yPos += 50;
    });
    menuButtons.voltar = { x: canvas.width/2 - 150, y: canvas.height - 150, width: 300, height: 70 };
    ctx.fillStyle = '#222'; ctx.fillRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.strokeStyle = '#e63946'; ctx.strokeRect(menuButtons.voltar.x, menuButtons.voltar.y, menuButtons.voltar.width, menuButtons.voltar.height);
    ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace';
    ctx.fillText("Voltar", canvas.width / 2, canvas.height - 105);
}

function drawTotalEnemyHealthBar() { if (!inimigos || inimigos.length === 0 || estadoDoJogo !== 'rodando') return; let totalVida = 0; let totalVidaMax = 0; inimigos.forEach(inimigo => { if (inimigo.tipo !== 'boss') { totalVida += inimigo.vida; totalVidaMax += inimigo.vidaMax; } }); if (totalVidaMax > 0) { const barWidth = 400; const barX = canvas.width / 2 - barWidth / 2; const percent = totalVida / totalVidaMax; ctx.fillStyle = '#111'; ctx.fillRect(barX, 10, barWidth, 15); ctx.fillStyle = 'red'; ctx.fillRect(barX, 10, barWidth * percent, 15); ctx.strokeStyle = '#555'; ctx.strokeRect(barX, 10, barWidth, 15); } }

function drawGameUI() {
    const p = player;
    // Barra de Vida
    ctx.fillStyle = '#333'; ctx.fillRect(20, 20, 250, 25);
    ctx.fillStyle = '#ff4757'; ctx.fillRect(20, 20, (p.vida / p.vidaMax) * 250, 25);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 20, 250, 25);
    ctx.fillStyle = '#fff'; ctx.font = '16px Arial'; ctx.fillText(`HP: ${Math.ceil(p.vida)} / ${p.vidaMax}`, 30, 38);
    
    // UI Especial e Pontos
    ctx.textAlign = 'right'; ctx.font = '24px Arial'; ctx.fillStyle = '#fff';
    ctx.fillText('Especial [F]', canvas.width - 20, 40);
    ctx.font = '22px Arial'; ctx.fillStyle = '#f1c40f';
    ctx.fillText(`Pontos: ${score}`, canvas.width - 20, 70);
    for (let i = 0; i < p.specialCharges; i++) drawImageWithFallback(assets.kenner, canvas.width - 60 - (i * 45), 85, 25, 40, 'magenta');
    if (p.specialCharges < p.maxSpecialCharges) {
        ctx.fillStyle = '#555'; ctx.fillRect(canvas.width - 20 - 150, 135, 150, 10);
        ctx.fillStyle = '#00ffff'; ctx.fillRect(canvas.width - 20 - 150, 135, (p.specialChargeProgress / KILLS_PER_CHARGE) * 150, 10);
    }
    
    // UI da Onda
    ctx.textAlign = 'center'; ctx.font = '32px "Courier New", monospace';
    if (estadoDoJogo === 'rodando') {
        let eBoss = inimigos.find(i => i.tipo === 'boss');
        if (eBoss) {
            ctx.fillStyle = '#d00000'; ctx.fillText(`!!! ONDA DO CHEFE !!!`, canvas.width / 2, 80);
        } else {
            ctx.fillStyle = '#e63946'; ctx.fillText(`ONDA ${ondaAtual}`, canvas.width / 2, 50);
        }
    } else if (estadoDoJogo === 'entreOndas') {
        const tempo = Math.ceil((timerProximaOnda - Date.now()) / 1000);
        ctx.fillStyle = '#00ffff';
        ctx.fillText(ondaAtual === 0 ? `O jogo começa em: ${tempo}s` : `Próxima onda em: ${tempo}s`, canvas.width / 2, 50);
    }
    
    if (textoEspecial.timer > 0) {
        ctx.font = '50px "Courier New", monospace';
        ctx.fillStyle = `rgba(255, 255, 0, ${textoEspecial.alpha})`;
        ctx.fillText(textoEspecial.texto, canvas.width / 2, canvas.height / 2);
    }
}

function drawLevelUpScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.font = '60px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('ONDA CONCLUÍDA!', canvas.width / 2, 150); ctx.font = '30px "Courier New", monospace'; ctx.fillText('Escolha um upgrade:', canvas.width / 2, 220); opcoesDeUpgrade.forEach((up, i) => { up.box = { x: canvas.width / 2 - 250, y: 280 + i * 120, width: 500, height: 100 }; ctx.fillStyle = '#222'; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.fillRect(up.box.x, up.box.y, up.box.width, up.box.height); ctx.strokeRect(up.box.x, up.box.y, up.box.width, up.box.height); ctx.fillStyle = '#00ffff'; ctx.font = '28px "Courier New", monospace'; ctx.fillText(up.nome, canvas.width / 2, up.box.y + 45); ctx.fillStyle = '#fff'; ctx.font = '20px "Courier New", monospace'; ctx.fillText(up.descricao, canvas.width / 2, up.box.y + 75); }); }

function drawGameOverScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#e63946'; ctx.font = '80px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText('FIM DE JOGO', canvas.width / 2, canvas.height / 2 - 50); ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace'; ctx.fillText(`Você sobreviveu até a Onda ${ondaAtual}`, canvas.width / 2, canvas.height / 2 + 20); ctx.fillText(`Pontuação Final: ${score}`, canvas.width / 2, canvas.height / 2 + 60); ctx.fillText('Clique para voltar ao menu', canvas.width / 2, canvas.height / 2 + 100); }

function drawPauseMenu() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '80px "Courier New", monospace'; ctx.fillText("PAUSADO", canvas.width / 2, 250); menuButtons.continuar = { x: canvas.width/2 - 200, y: 350, width: 400, height: 70 }; menuButtons.opcoesPausa = { x: canvas.width/2 - 200, y: 450, width: 400, height: 70 }; menuButtons.sair = { x: canvas.width/2 - 200, y: 550, width: 400, height: 70 }; ctx.fillStyle = '#222'; ctx.fillRect(menuButtons.continuar.x, menuButtons.continuar.y, menuButtons.continuar.width, menuButtons.continuar.height); ctx.fillRect(menuButtons.opcoesPausa.x, menuButtons.opcoesPausa.y, menuButtons.opcoesPausa.width, menuButtons.opcoesPausa.height); ctx.fillRect(menuButtons.sair.x, menuButtons.sair.y, menuButtons.sair.width, menuButtons.sair.height); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.strokeRect(menuButtons.continuar.x, menuButtons.continuar.y, menuButtons.continuar.width, menuButtons.continuar.height); ctx.strokeRect(menuButtons.opcoesPausa.x, menuButtons.opcoesPausa.y, menuButtons.opcoesPausa.width, menuButtons.opcoesPausa.height); ctx.strokeStyle = '#e63946'; ctx.strokeRect(menuButtons.sair.x, menuButtons.sair.y, menuButtons.sair.width, menuButtons.sair.height); ctx.fillStyle = '#fff'; ctx.font = '30px "Courier New", monospace'; ctx.fillText("Continuar", canvas.width / 2, 395); ctx.fillText("Opções de Volume", canvas.width / 2, 495); ctx.fillText("Voltar ao Menu", canvas.width / 2, 595); }

function drawGameWorld() {
    drawImageWithFallback(assets.fase, 0, 0, canvas.width, canvas.height, '#0f0f1e');
    plataformas.forEach(p => p.draw());
    moedas.forEach(c => c.draw());
    projeteis.forEach(p => p.draw());
    projeteisInimigos.forEach(p => p.draw());
    player.draw();
    inimigos.forEach(i => i.draw());
    efeitosVisuais.forEach(e => e.draw());
    efeitosDeDano.forEach(d => d.draw());
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    switch(estadoDoJogo) {
        case 'carregando': ctx.fillStyle = '#fff'; ctx.font = '40px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillText(`Carregando...`, canvas.width / 2, canvas.height / 2); break;
        case 'menuPrincipal': drawMainMenu(); break;
        case 'menuPoderes': drawPowersMenu(); break;
        case 'menuVolume': drawVolumeMenu(); break;
        case 'menuRanking': drawRankingScreen(); break;
        case 'intro': break;
        case 'rodando': case 'entreOndas': case 'pausado':
            if (player) {
                drawGameWorld();
                drawGameUI();
                if (estadoDoJogo !== 'pausado') drawTotalEnemyHealthBar();
                if (estadoDoJogo === 'pausado') drawPauseMenu();
            }
            break;
        case 'levelUp':
            if (player) { drawGameWorld(); drawGameUI(); }
            drawLevelUpScreen();
            break;
        case 'gameOver': drawGameOverScreen(); break;
    }
    ctx.textAlign = 'start';
}

function gameLoop() {
    if (!themeMusicStarted && estadoDoJogo !== 'carregando' && estadoDoJogo !== 'intro') {
        if (assets.theme) {
            assets.theme.loop = true;
            assets.theme.volume = volumeMusicaSlider * MAX_VOLUME_MUSICA;
            const promise = assets.theme.play();
            if (promise !== undefined) { promise.then(() => { themeMusicStarted = true; }).catch(() => {}); }
        }
    }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (estadoDoJogo === 'pausado' && key === 'escape') { estadoDoJogo = gameStateBeforePause; }
    else if (['rodando', 'entreOndas'].includes(estadoDoJogo)) {
        if (key === 'a') teclas.a.pressionada = true;
        else if (key === 'd') teclas.d.pressionada = true;
        else if (key === ' ') player.pular();
        else if (key === 'f') player.usarEspecial();
        else if (key === 'escape') { gameStateBeforePause = estadoDoJogo; estadoDoJogo = 'pausado'; }
    }
});

window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if (key === 'a') teclas.a.pressionada = false; else if (key === 'd') teclas.d.pressionada = false; });
canvas.addEventListener('mousemove', (e) => { const rect = canvas.getBoundingClientRect(); mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top; if (draggingSlider) { const slider = menuButtons[draggingSlider === 'musica' ? 'sliderMusica' : 'sliderEfeitos']; let newValue = (mouse.x - slider.x) / slider.width; newValue = Math.max(0, Math.min(1, newValue)); if (draggingSlider === 'musica') { volumeMusicaSlider = newValue; if (assets.theme) assets.theme.volume = volumeMusicaSlider * MAX_VOLUME_MUSICA; } else { volumeEfeitosSlider = newValue; } } });
canvas.addEventListener('mouseup', () => { mouse.pressionado = false; draggingSlider = null; });
canvas.addEventListener('mousedown', () => {
    if (!themeMusicStarted && assets.theme) { assets.theme.play().catch(e => {}); themeMusicStarted = true; }
    switch(estadoDoJogo) {
        case 'menuPrincipal':
            if (isPointInRect(mouse, menuButtons.iniciar)) playIntroAndStartGame();
            if (isPointInRect(mouse, menuButtons.ranking)) estadoDoJogo = 'menuRanking';
            if (isPointInRect(mouse, menuButtons.poderes)) estadoDoJogo = 'menuPoderes';
            if (isPointInRect(mouse, menuButtons.volume)) { menuStateBeforeOptions = 'menuPrincipal'; estadoDoJogo = 'menuVolume'; }
            break;
        case 'menuRanking':
        case 'menuPoderes': 
            if (isPointInRect(mouse, menuButtons.voltar)) estadoDoJogo = 'menuPrincipal'; 
            break;
        case 'menuVolume': if (isPointInRect(mouse, menuButtons.voltar)) estadoDoJogo = menuStateBeforeOptions; if (isPointInRect(mouse, menuButtons.sliderMusica)) draggingSlider = 'musica'; if (isPointInRect(mouse, menuButtons.sliderEfeitos)) draggingSlider = 'efeitos'; if (draggingSlider) canvas.dispatchEvent(new MouseEvent('mousemove', {clientX: mouse.x, clientY: mouse.y})); break;
        case 'pausado':
            if (isPointInRect(mouse, menuButtons.continuar)) estadoDoJogo = gameStateBeforePause;
            if (isPointInRect(mouse, menuButtons.opcoesPausa)) { menuStateBeforeOptions = 'pausado'; estadoDoJogo = 'menuVolume'; }
            if (isPointInRect(mouse, menuButtons.sair)) { pararTodosOsSons(); estadoDoJogo = 'menuPrincipal'; }
            break;
        case 'rodando': case 'entreOndas': mouse.pressionado = true; break;
        case 'gameOver': pararTodosOsSons(); estadoDoJogo = 'menuPrincipal'; break;
        case 'levelUp':
            opcoesDeUpgrade.forEach(up => {
                if (isPointInRect(mouse, up.box)) {
                    player.aplicarUpgrade(up);
                    estadoDoJogo = 'entreOndas';
                    timerProximaOnda = Date.now() + TEMPO_ENTRE_ONDAS;
                }
            });
            break;
    }
});

gameLoop();
