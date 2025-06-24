// --- Constantes de Jogo e Balanceamento ---
const GRAVIDADE = 0.6;
const TEMPO_ENTRE_ONDAS = 5000;
const KILLS_PER_CHARGE = 10;
const SPECIAL_PROJECTILE_SPEED = 4;
const SPECIAL_DAMAGE = 100;
const SPECIAL_EXPLOSION_RADIUS = 250;
const MAX_VOLUME_MUSICA = 0.2;
const MAX_VOLUME_TIRO = 0.1;
const BOSS_VOICE_BOOST = 0.3;

// --- Definições de Ondas e Upgrades ---
const DEFINICOES_ONDAS = [
    { tipo1: 3, tipo2: 0 }, { tipo1: 3, tipo2: 1 }, { tipo1: 4, tipo2: 1 },
    { tipo1: 4, tipo2: 2 }, { boss: 1 },
];

const todosOsUpgrades = [
    { nome: "Catalisador", descricao: "Dano do Projétil +2", aplicar: (p) => p.danoProjetil += 2 },
    { nome: "Olhar Aguçado", descricao: "Chance de Crítico +5%", aplicar: (p) => p.chanceCritico += 0.05 },
    { nome: "Crescimento", descricao: "Vida Máx. +10", aplicar: (p) => { p.vidaMax += 10; p.vida += 10; } },
    { nome: "Impulso", descricao: "Altura do Pulo +30%", aplicar: (p) => p.forcaPuloBase *= 1.3 },
    { nome: "Renovação", descricao: "Cura toda a Vida", aplicar: (p) => p.vida = p.vidaMax },
    { nome: "Resistência", descricao: "Defesa +4%", aplicar: (p) => p.defesa += 0.04 },
    { nome: "Ressonância", descricao: "Vel. de Ataque +12%", aplicar: (p) => p.cooldownTiroBase *= 0.88 }
];