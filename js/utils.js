// --- Funções Auxiliares ---

/**
 * Desenha uma imagem no canvas, com uma cor de fallback caso a imagem não carregue.
 */
function drawImageWithFallback(img, x, y, w, h, color) {
    if (img?.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, x, y, w, h);
    } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }
}

/**
 * Verifica se um ponto (como o mouse) está dentro de um retângulo.
 */
function isPointInRect(point, rect) {
    return (
        point.x > rect.x && point.x < rect.x + rect.width &&
        point.y > rect.y && point.y < rect.y + rect.height
    );
}

/**
 * Verifica colisão entre dois objetos retangulares (que possuem posicao, largura, altura).
 */
function isColliding(objA, objB) {
    return (
        objA.posicao.x < objB.posicao.x + objB.largura &&
        objA.posicao.x + objA.largura > objB.posicao.x &&
        objA.posicao.y < objB.posicao.y + objB.altura &&
        objA.posicao.y + objA.altura > objB.posicao.y
    );
}

/**
 * Ativa o texto grande que aparece na tela para o especial.
 */
function ativarTextoEspecial(texto) {
    textoEspecial.texto = texto;
    textoEspecial.timer = textoEspecial.duration;
    textoEspecial.alpha = 1.0;
}