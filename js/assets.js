// --- Gerenciador de Assets ---
const assets = {};
const nomesAssets = ['playerc', 'playerd', 'playere', 'inimigo1', 'inimigo2', 'boss', 'kenner', 'dinheiro'];
let assetsCarregados = 0;

nomesAssets.forEach(nome => {
    const img = new Image();
    img.src = `${nome}.png`;
    img.onload = () => {
        assetsCarregados++;
        if (assetsCarregados === nomesAssets.length) {
            estadoDoJogo = 'menuPrincipal'; // Muda o estado quando tudo estiver carregado
        }
    };
    img.onerror = () => {
        console.error(`Erro ao carregar ${nome}.png`);
        assetsCarregados++;
        if (assetsCarregados === nomesAssets.length) {
            estadoDoJogo = 'menuPrincipal';
        }
    };
    assets[nome] = img;
});