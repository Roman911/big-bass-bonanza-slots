import {
    Application,
    Assets,
    Container,
    Texture,
    Sprite,
    BlurFilter,
} from 'pixi.js';

import iconTen from '../images/icon-10.png';
import iconFs from '../images/icon-40fs.png';
import iconBox from '../images/icon-box.png';
import iconDragonfly from '../images/icon-dragonfly.png';
import iconFish from '../images/icon-fish.png';
import iconJ from '../images/icon-J.png';
import iconK from '../images/icon-K.png';
import iconMan from '../images/icon-man.png';
import iconQ from '../images/icon-Q.png';
import iconRod from '../images/icon-rod.png';
import iconScatter from '../images/icon-scatter.png';

import sound from '../sounds/coin-win.wav';

(async () => {
    // Create a new application
    const app = new Application();

    // Initialize the application
    await app.init({backgroundAlpha: 0, width: 880, height: 480, text: 'center'});

    // Append the application canvas to the document body
    document.getElementById('app').appendChild(app.canvas);

    // Load the textures
    await Assets.load([
        iconTen,
        iconFs,
        iconBox,
        iconDragonfly,
        iconFish,
        iconJ,
        iconK,
        iconMan,
        iconQ,
        iconRod,
        iconScatter,
    ]);

    const REEL_WIDTH = 180;
    const SYMBOL_SIZE = 160;

    // Create different slot symbols
    const slotTextures = [
        Texture.from(iconTen),
        Texture.from(iconFs),
        Texture.from(iconBox),
        Texture.from(iconDragonfly),
        Texture.from(iconFish),
        Texture.from(iconJ),
        Texture.from(iconK),
        Texture.from(iconMan),
        Texture.from(iconQ),
        Texture.from(iconRod),
        Texture.from(iconScatter),
    ];

    // Build the reels
    const reels = [];
    const reelContainer = new Container();

    for (let i = 0; i < 5; i++) {
        const rc = new Container();

        rc.x = i * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel = {
            container: rc,
            symbols: [],
            position: 0,
            previousPosition: 0,
            blur: new BlurFilter(),
        };

        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [reel.blur];

        // Build the symbols
        for (let j = 0; j < 10; j++) {
            const symbol = new Sprite(slotTextures[Math.floor(Math.random() * slotTextures.length)]);
            // Scale the symbol to fit symbol area.

            symbol.y = j * SYMBOL_SIZE;
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
            reel.symbols.push(symbol);
            rc.addChild(symbol);
        }
        reels.push(reel);
    }

    app.stage.addChild(reelContainer);

    let running = false;

    // Function to start playing.
    function startPlay() {
        if (running) return;
        running = true;

        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const extra = 8;
            const target = r.position + 10 + i * 5 + extra;
            const time = 2500 + i * 600 + extra * 600;

            tweenTo(r, 'position', target, time, backout(0.5), null, i === reels.length - 1 ? reelsComplete : null);
        }
    }

    // Reels done handler.
    function reelsComplete() {
        running = false;
    }

    // Listen for animate update.
    app.ticker.add(() => {
        // Update the slots.
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            // Update blur filter y amount based on speed.
            // This would be better if calculated with time in mind also. Now blur depends on frame rate.

            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

            // Update symbol positions on reel.
            for (let j = 0; j < r.symbols.length; j++) {
                const s = r.symbols[j];
                const prevy = s.y;

                s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
                if (s.y < 0 && prevy > SYMBOL_SIZE) {
                    // Detect going over and swap a texture.
                    // This should in proper product be determined from some logical reel.
                    s.texture = slotTextures[Math.floor(Math.random() * slotTextures.length)];
                    s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                    s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                }

                if((i===0 && j===4)||(i===1 && j===9)||(i===2 && j===4)||(i===3 && j===9)||(i===4 && j===4)) {
                    s.texture = slotTextures[Math.floor(7)];
                    s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                    s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                }
            }
        }
    });

    // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
    const tweening = [];

    function tweenTo(object, property, target, time, easing, onchange, oncomplete) {
        const tween = {
            object,
            property,
            propertyBeginValue: object[property],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            start: Date.now(),
        };

        tweening.push(tween);

        return tween;
    }

    // Listen for animate update.
    app.ticker.add(() => {
        const now = Date.now();
        const remove = [];

        for (let i = 0; i < tweening.length; i++) {
            const t = tweening[i];
            const phase = Math.min(1, (now - t.start) / t.time);

            t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
            if (t.change) t.change(t);
            if (phase === 1) {
                t.object[t.property] = t.target;
                if (t.complete) t.complete(t);
                remove.push(t);
            }
        }
        for (let i = 0; i < remove.length; i++) {
            tweening.splice(tweening.indexOf(remove[i]), 1);
        }
    });

    // Basic lerp funtion.
    function lerp(a1, a2, t) {
        return a1 * (1 - t) + a2 * t;
    }

    // Backout function from tweenjs.
    function backout(amount) {
        return (t) => --t * t * ((amount + 1) * t + amount) + 1;
    }

    const btn = document.querySelector('.btn_spin');
    const winner = document.querySelector('.winner');
    const winElements = document.querySelectorAll('.win');
    const modalOverlay = document.querySelector('.modal_overlay');
    const modalSignup = document.querySelector('.modal_signup');
    const win = new Audio('https://n1md7.github.io/slot-game/sound/win.mp3');
    const spin = new Audio('https://n1md7.github.io/slot-game/sound/spin.mp3');
    //const closeBtn = document.querySelector('.close__btn');

    const winnerShow = () => {
        setTimeout(() => {
            win.play();
            winner.classList.add('active');
            // btn.style.opacity = 1;
            // btn.style.pointerEvents = 'auto';
            winElements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('active');
                }, index * 500); // Кожен елемент активується через 0.5 секунди після попереднього
            });
        }, 6800);

        setTimeout(() => {
            modalOverlay.classList.add('show');
            modalSignup.classList.add('show');
        }, 13000);
    };

    btn.addEventListener('click', (e) => {
        // document.getElementById('/src/sounds/coin-win.wav').play();
        spin.play();
        startPlay();
        winnerShow();
        btn.style.opacity = 0.5;
        btn.style.pointerEvents = 'none';
    });

    // closeBtn.addEventListener('click', (e) => {
    //     modalOverlay.classList.remove('show');
    //     modalSignup.classList.remove('show');
    // });
})();
