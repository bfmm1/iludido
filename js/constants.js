// --- Constantes de Jogo e Balanceamento ---
const GRAVIDADE = 0.6;
const TEMPO_ENTRE_ONDAS = 5000;
const KILLS_PER_CHARGE = 10;
const SPECIAL_PROJECTILE_SPEED = 4;
const SPECIAL_DAMAGE = 100;
const SPECIAL_EXPLOSION_RADIUS = 250;
const MAX_VOLUME_MUSICA = 0.12;
const MAX_VOLUME_TIRO = 0.08;
const BOSS_VOICE_BOOST = 0.3;

// --- Definições de Ondas ---
const DEFINICOES_ONDAS = [
    { tipo1: 3, tipo2: 0 }, { tipo1: 3, tipo2: 1 }, { tipo1: 4, tipo2: 1 },
    { tipo1: 4, tipo2: 2 }, { boss: 1 },
];

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