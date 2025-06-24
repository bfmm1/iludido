class Plataforma { constructor(x, y, largura, altura) { this.posicao = { x, y }; this.largura = largura; this.altura = altura; } draw() { ctx.fillStyle = '#2c3e50'; ctx.fillRect(this.posicao.x, this.posicao.y, this.largura, this.altura); } }

class Player {
    constructor() { Object.assign(this, { posicao: { x: canvas.width / 2 - 30, y: canvas.height - 150 }, velocidade: { x: 0, y: 0 }, largura: 80, altura: 90, velocidadeMovimento: 4, forcaPuloBase: 15, estaNoChao: false, direcaoVisual: 'parado', vidaMax: 100, vida: 100, exp: 0, nivel: 1, expParaProximoNivel: 100, danoProjetil: 10, chanceCritico: 0.05, defesa: 0, cooldownTiroBase: 400, ultimoTiro: 0, invencivel: false, tempoInvencivel: 500, timerInvencivel: 0, specialCharges: 3, maxSpecialCharges: 3, specialChargeProgress: 0, killsForNextCharge: 10 }); }
    draw() { ctx.globalAlpha = this.invencivel ? 0.5 : 1.0; const sprites = { parado: assets.playerc, direita: assets.playerd, esquerda: assets.playere }; drawImageWithFallback(sprites[this.direcaoVisual], this.posicao.x, this.posicao.y, this.largura, this.altura, '#1e90ff'); ctx.globalAlpha = 1.0; }
    update() { this.direcaoVisual = teclas.d.pressionada ? 'direita' : (teclas.a.pressionada ? 'esquerda' : 'parado'); this.velocidade.x = 0; if (teclas.a.pressionada && this.posicao.x > 0) this.velocidade.x = -this.velocidadeMovimento; if (teclas.d.pressionada && this.posicao.x + this.largura < canvas.width) this.velocidade.x = this.velocidadeMovimento; this.posicao.x += this.velocidade.x; this.velocidade.y += GRAVIDADE; this.posicao.y += this.velocidade.y; this.estaNoChao = false; plataformas.forEach(plataforma => { if (this.velocidade.y > 0 && this.posicao.y + this.altura >= plataforma.posicao.y && this.posicao.y + this.altura - this.velocidade.y <= plataforma.posicao.y && this.posicao.x + this.largura > plataforma.posicao.x && this.posicao.x < plataforma.posicao.x + plataforma.largura) { this.velocidade.y = 0; this.posicao.y = plataforma.posicao.y - this.altura; this.estaNoChao = true; } }); if (this.invencivel) { this.timerInvencivel -= 16.67; if (this.timerInvencivel <= 0) this.invencivel = false; } }
    pular() { if (this.estaNoChao) this.velocidade.y = -this.forcaPuloBase; }
    atirar() { const agora = Date.now(); if (agora - this.ultimoTiro > this.cooldownTiroBase) { this.ultimoTiro = agora; const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 }; let dano = this.danoProjetil * (Math.random() < this.chanceCritico ? 2 : 1); projeteis.push(new Projétil(centro.x, centro.y, dano)); } }
    sofrerDano(dano) { if (!this.invencivel) { this.vida -= dano * (1 - this.defesa); this.invencivel = true; this.timerInvencivel = this.tempoInvencivel; if (this.vida <= 0) { this.vida = 0; estadoDoJogo = 'gameOver'; } } }
    iniciarLevelUp() { opcoesDeUpgrade = [...todosOsUpgrades].sort(() => 0.5 - Math.random()).slice(0, 3); }
    usarEspecial() { if (this.specialCharges > 0 && ['rodando', 'entreOndas'].includes(estadoDoJogo)) { this.specialCharges--; efeitosVisuais.push(new SpecialProjectile(this.posicao.x + this.largura / 2, this.posicao.y + this.altura / 2)); ativarTextoEspecial("Kenner L7, paga só o frete"); } }
    inimigoDerrotado(exp, tipo) {
        if (tipo === 'boss') { // <<< NOVO: Registra que o chefe foi derrotado
            bossFoiDerrotado = true;
        }
        this.exp += exp;
        while (this.exp >= this.expParaProximoNivel) {
            this.exp -= this.expParaProximoNivel; this.nivel++; this.expParaProximoNivel = Math.floor(this.expParaProximoNivel * 1.5);
            estadoDoJogo = 'levelUp'; this.iniciarLevelUp();
        }
        if (this.specialCharges < this.maxSpecialCharges) {
            this.specialChargeProgress++;
            if (this.specialChargeProgress >= KILLS_PER_CHARGE) { this.specialCharges++; this.specialChargeProgress = 0; }
        }
    }
}

class Inimigo {
    constructor(x, y, tipo) {
        Object.assign(this, { tipo, posicao: { x, y }, vida: 0, velocidadeY: 1.0 + (ondaAtual * 0.05), velocidadeX: (0.5 + ondaAtual * 0.1) * (Math.random() < 0.5 ? 1 : -1), alvoY: canvas.height * 0.6 - Math.random() * 200, ultimoTiro: Date.now() + Math.random() * 2000, patrulhaRange: 40 + Math.random() * 40, patrulhaSpeed: (Math.random() * 0.05 + 0.02) / 1000, spawnTimestamp: Date.now(), podeMoverHorizontalmente: false });
        this.vidaMax = 20 + ondaAtual * 5; this.danoTiro = 5 + Math.floor(ondaAtual * 1.5);
        
        if (tipo === 'tipo1') {
            Object.assign(this, { imagem: assets.inimigo1, largura: 40, altura: 40, expConcedida: 35, cooldownTiroBase: 3000 });
        } else if (tipo === 'tipo2') {
            Object.assign(this, { imagem: assets.inimigo2, largura: 80, altura: 80, expConcedida: 70, cooldownTiroBase: 2200 });
            this.vidaMax *= 2.5; this.danoTiro *= 1.5;
        } else if (tipo === 'miniboss') { // <<< NOVO: Mini-chefe
            Object.assign(this, { imagem: assets.boss, largura: 110, altura: 110, expConcedida: 150, cooldownTiroBase: 2000 });
            this.vidaMax *= 4; this.danoTiro *= 2;
        } else if (tipo === 'boss') {
            Object.assign(this, { imagem: assets.boss, largura: 150, altura: 150, expConcedida: 500, cooldownTiroBase: 2000, estadoAtaque: 'movendo', timerAtaque: Date.now() });
            this.vidaMax = 500 + ondaAtual * 50; this.danoTiro = 15;
        }
        
        this.vida = this.vidaMax;
        this.proximoIntervaloTiro = this.cooldownTiroBase + Math.random() * 1500;
        this.patrulhaCenterY = this.alvoY;
    }
    draw() {
        drawImageWithFallback(this.imagem, this.posicao.x, this.posicao.y, this.largura, this.altura, this.tipo === 'tipo1' ? '#e63946' : '#fca311');
        const pVida = this.vida / this.vidaMax;
        if (this.tipo !== 'boss') {
            ctx.fillStyle = '#dc2f02';
            ctx.fillRect(this.posicao.x, this.posicao.y - 10, this.largura, 5);
            ctx.fillStyle = '#9ef01a';
            ctx.fillRect(this.posicao.x, this.posicao.y - 10, this.largura * pVida, 5);
        } else {
            ctx.fillStyle = '#333'; ctx.fillRect(canvas.width/4, 20, canvas.width/2, 20);
            ctx.fillStyle = '#d00000'; ctx.fillRect(canvas.width/4, 20, (canvas.width/2) * pVida, 20);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(canvas.width/4, 20, canvas.width/2, 20);
        }
    }
    update(player) {
        if (this.tipo === 'boss') { this.updateBoss(player); return; }
        if (this.posicao.y < this.alvoY) { this.posicao.y += this.velocidadeY; }
        if (!this.podeMoverHorizontalmente && Date.now() - this.spawnTimestamp > 4000) { this.podeMoverHorizontalmente = true; this.patrulhaCenterY = this.posicao.y; }
        if (this.podeMoverHorizontalmente) {
            this.posicao.x += this.velocidadeX;
            if (this.posicao.x <= 0 || this.posicao.x + this.largura >= canvas.width) { this.velocidadeX *= -1; }
            this.posicao.y = this.patrulhaCenterY + Math.sin(Date.now() * this.patrulhaSpeed) * this.patrulhaRange;
            const agora = Date.now();
            if (agora - this.ultimoTiro > this.proximoIntervaloTiro) {
                this.ultimoTiro = agora;
                this.proximoIntervaloTiro = this.cooldownTiroBase + Math.random() * 1500;
                const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 };
                const angulo = Math.atan2(player.posicao.y + player.altura / 2 - centro.y, player.posicao.x + player.largura / 2 - centro.x);
                const vel = { x: Math.cos(angulo) * 4, y: Math.sin(angulo) * 4 };
                projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 6, '#ff4d6d', vel, this.danoTiro));
            }
        }
    }
    updateBoss(player) {
        if (this.posicao.y < 100) { this.posicao.y += this.velocidadeY; } else { this.posicao.x += Math.sin(Date.now() / 2000) * 1.5; }
        const agora = Date.now();
        if (agora - this.timerAtaque > this.cooldownTiroBase) {
            this.timerAtaque = agora;
            this.estadoAtaque = Math.random() < 0.6 ? 'normal' : 'barragem';
            const centro = { x: this.posicao.x + this.largura / 2, y: this.posicao.y + this.altura / 2 };
            if (this.estadoAtaque === 'normal') {
                const angulo = Math.atan2(player.posicao.y + player.altura / 2 - centro.y, player.posicao.x + player.largura / 2 - centro.x);
                const vel = { x: Math.cos(angulo) * 6, y: Math.sin(angulo) * 6 };
                projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 10, '#ff6a00', vel, this.danoTiro));
            } else { // Barragem
                for (let i = -3; i <= 3; i++) { // <<< MUDANÇA: Mais projéteis
                    const angulo = Math.atan2(player.posicao.y - centro.y, player.posicao.x - centro.x) + (i * 0.2);
                    const vel = { x: Math.cos(angulo) * 5, y: Math.sin(angulo) * 5 };
                    projeteisInimigos.push(new InimigoProjétil(centro.x, centro.y, 7, '#ff8c00', vel, this.danoTiro));
                }
            }
        }
    }
    sofrerDano(dano) { this.vida -= dano; }
}

class Projétil { constructor(x, y, dano) { this.posicao = { x, y }; this.dano = dano; this.largura = 30; this.altura = 30; const angulo = Math.atan2(mouse.y - this.posicao.y, mouse.x - this.posicao.x); this.velocidade = { x: Math.cos(angulo) * 8, y: Math.sin(angulo) * 8 }; } draw() { drawImageWithFallback(assets.dinheiro, this.posicao.x - this.largura / 2, this.posicao.y - this.altura / 2, this.largura, this.altura, '#f1c40f'); } update() { this.posicao.x += this.velocidade.x; this.posicao.y += this.velocidade.y; } }
class InimigoProjétil { constructor(x, y, raio, cor, vel, dano) { this.posicao = {x, y}; this.raio = raio; this.cor = cor; this.velocidade = vel; this.dano = dano; this.largura = raio * 2; this.altura = raio * 2; } draw() { ctx.beginPath(); ctx.arc(this.posicao.x, this.posicao.y, this.raio, 0, 2 * Math.PI); ctx.fillStyle = this.cor; ctx.fill(); } update() { this.posicao.x += this.velocidade.x; this.posicao.y += this.velocidade.y; } }
class SpecialProjectile { constructor(x, y) { this.posicao = { x, y }; this.alvo = { x: canvas.width / 2, y: canvas.height / 2 }; this.remover = false; this.angulo = Math.atan2(this.alvo.y - this.posicao.y, this.alvo.x - this.posicao.x); } update() { this.posicao.x += Math.cos(this.angulo) * SPECIAL_PROJECTILE_SPEED; this.posicao.y += Math.sin(this.angulo) * SPECIAL_PROJECTILE_SPEED; if (Math.hypot(this.alvo.x - this.posicao.x, this.alvo.y - this.posicao.y) < SPECIAL_PROJECTILE_SPEED) { this.remover = true; efeitosVisuais.push(new Explosion(this.alvo.x, this.alvo.y)); } } draw() { ctx.save(); ctx.translate(this.posicao.x, this.posicao.y); ctx.rotate(this.angulo + Math.PI / 2); drawImageWithFallback(assets.kenner, -25, -40, 50, 80, 'magenta'); ctx.restore(); } }
class Explosion { constructor(x, y) { this.posicao = { x, y }; this.remover = false; this.vida = 30; projeteisInimigos = []; inimigos.forEach(inimigo => inimigo.sofrerDano(SPECIAL_DAMAGE)); } update() { this.vida--; if (this.vida <= 0) this.remover = true; } draw() { ctx.beginPath(); ctx.arc(this.posicao.x, this.posicao.y, SPECIAL_EXPLOSION_RADIUS * (1 - this.vida / 30), 0, 2 * Math.PI); ctx.strokeStyle = `rgba(255, 255, 0, ${this.vida / 30})`; ctx.lineWidth = 5; ctx.stroke(); } }