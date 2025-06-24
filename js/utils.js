function drawImageWithFallback(img, x, y, w, h, color) { if (img?.complete && img.naturalHeight !== 0) { ctx.drawImage(img, x, y, w, h); } else { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); } }
function isPointInRect(point, rect) { return (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height); }
function isPointInCircle(point, circle) { const distance = Math.hypot(point.x - circle.x, point.y - circle.y); return distance < circle.radius; }
function isColliding(objA, objB) { return (objA.posicao.x < objB.posicao.x + objB.largura && objA.posicao.x + objA.largura > objB.posicao.x && objA.posicao.y < objB.posicao.y + objB.altura && objA.posicao.y + objA.altura > objB.posicao.y); }
function ativarTextoEspecial(texto) { textoEspecial.texto = texto; textoEspecial.timer = textoEspecial.duration; textoEspecial.alpha = 1.0; }
function isMobileDevice() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

function pararTodosOsSons() {
    for (const key in assets) {
        if (assets[key] instanceof HTMLAudioElement) {
            assets[key].pause();
            assets[key].currentTime = 0;
        }
    }
    themeMusicStarted = false;
}