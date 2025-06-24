// --- Gerenciador de Assets ---
const assets = {};
const nomesImagens = ['playerc', 'playerd', 'playere', 'inimigo1', 'inimigo2', 'boss', 'kenner', 'dinheiro'];
const nomesAudios = ['siteclonado', '75', '50', '25']; // <<< NOMES CORRIGIDOS

let assetsCarregados = 0;
const totalAssets = nomesImagens.length + nomesAudios.length;

function assetCarregado() {
    assetsCarregados++;
    if (assetsCarregados === totalAssets) {
        estadoDoJogo = 'menuPrincipal';
    }
}

// Carrega as imagens
nomesImagens.forEach(nome => {
    const img = new Image();
    img.src = `${nome}.png`;
    img.onload = assetCarregado;
    img.onerror = () => { console.error(`Erro ao carregar imagem ${nome}.png`); assetCarregado(); };
    assets[nome] = img;
});

// Carrega os áudios
nomesAudios.forEach(nome => {
    const audio = new Audio();
    audio.src = `${nome}.mp3`;
    // 'canplaythrough' pode demorar muito, 'canplay' é suficiente para saber que pode começar a tocar.
    audio.addEventListener('canplay', assetCarregado, { once: true });
    audio.onerror = () => { console.error(`Erro ao carregar áudio ${nome}.mp3`); assetCarregado(); };
    assets[nome] = audio;
});
