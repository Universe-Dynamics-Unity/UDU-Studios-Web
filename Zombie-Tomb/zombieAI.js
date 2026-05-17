// ==========================================
// UDU STUDIOS - STALKER AI (VELOCIDAD PURA)
// ==========================================
class StalkerBrain {
    constructor(scene, sprite) {
        this.scene = scene;
        this.sprite = sprite;
        this.speed = 180; 
        this.animacionActual = ""; 
        
        // Desactivamos cualquier resistencia del motor
        if (this.sprite.body) {
            this.sprite.body.setDrag(0);
            this.sprite.body.setFriction(0, 0);
            this.sprite.body.setMaxVelocity(this.speed, this.speed);
        }
    }

    update() {
        let target = this.scene.player;
        if (!this.sprite || !this.sprite.body || !target || !target.active) return;

        const body = this.sprite.body;

        // --- LÓGICA DE MOVIMIENTO CONSTANTE ---
        // Si detectamos que la velocidad bajó aunque sea un poquito, 
        // reseteamos el rumbo inmediatamente para recuperar los 160.
        if (Math.abs(body.velocity.x) < this.speed && Math.abs(body.velocity.y) < this.speed) {
            this.decidirRumbo(target);
        }

        // --- GESTIÓN DE ANIMACIONES ---
        if (this.sprite.anims) {
            this.gestionarSprites(body.velocity);
        }
    }

    decidirRumbo(target) {
        const diffX = target.x - this.sprite.x;
        const diffY = target.y - this.sprite.y;

        // Analizamos qué eje causó el choque para "romperlo"
        // Si el zombie estaba intentando ir más fuerte en X y se paró...
        if (Math.abs(this.sprite.body.velocity.x) > Math.abs(this.sprite.body.velocity.y)) {
            // ¡Obligamos a que use el eje Y para rodear!
            this.sprite.body.setVelocityY(diffY > 0 ? this.speed : -this.speed);
            this.sprite.body.setVelocityX(0);
        } else {
            // ¡Obligamos a que use el eje X para rodear!
            this.sprite.body.setVelocityX(diffX > 0 ? this.speed : -this.speed);
            this.sprite.body.setVelocityY(0);
        }
        
        // Si por alguna razón los diffs son 0, le damos un empujón para que no se rinda
        if (this.sprite.body.velocity.x === 0 && this.sprite.body.velocity.y === 0) {
            this.sprite.body.setVelocityX(this.speed);
        }
    }

    gestionarSprites(velocity) {
        let nuevaAnim = "";
        const vX = velocity.x;
        const vY = velocity.y;

        if (Math.abs(vX) > Math.abs(vY)) {
            nuevaAnim = vX > 0 ? 'zombie_right' : 'zombie_left';
        } else if (Math.abs(vY) > 5) {
            nuevaAnim = vY > 0 ? 'zombie_down' : 'zombie_up';
        } else {
            nuevaAnim = 'zombie_idle';
        }

        if (this.animacionActual !== nuevaAnim) {
            this.sprite.play(nuevaAnim, true);
            this.animacionActual = nuevaAnim;
        }
    }
}