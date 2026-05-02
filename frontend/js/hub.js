// HUB PAGE (INDEX.HTML) LOGIC
function launchCoinCannonConfetti() {
    const existing = document.querySelector('.coin-confetti-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'coin-confetti-container';
    document.body.appendChild(container);

    const coinTemplate = document.createElement('div');
    coinTemplate.innerHTML = `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#7a5200"/>
                    <stop offset="20%" stop-color="#d49c19"/>
                    <stop offset="50%" stop-color="#fff5cc"/>
                    <stop offset="80%" stop-color="#a37410"/>
                    <stop offset="100%" stop-color="#e6b022"/>
                </linearGradient>
                <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="30%" stop-color="#ffe600"/>
                    <stop offset="60%" stop-color="#ffb300"/>
                    <stop offset="90%" stop-color="#cc7a00"/>
                    <stop offset="100%" stop-color="#ffcc00"/>
                </linearGradient>
                <linearGradient id="glareGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(255,255,255,1)"/>
                    <stop offset="20%" stop-color="rgba(255,255,255,0.7)"/>
                    <stop offset="40%" stop-color="rgba(255,255,255,0)"/>
                    <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                </linearGradient>
            </defs>
            <path d="M 15,45 A 35,22 0 0,0 85,45 L 85,55 A 35,22 0 0,1 15,55 Z" fill="url(#edgeGrad)"/>
            <ellipse cx="50" cy="45" rx="35" ry="22" fill="url(#faceGrad)"/>
            <ellipse cx="50" cy="45" rx="30" ry="19" fill="none" stroke="#b37700" stroke-width="1.5"/>
            <g transform="translate(50, 46.5) scale(1, 0.65)">
                <text x="0" y="0" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="#8f5b00" filter="drop-shadow(1px 1px 0px rgba(255,255,255,0.7))">$</text>
            </g>
            <ellipse cx="50" cy="45" rx="35" ry="22" fill="url(#glareGrad)"/>
        </svg>
    `;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    function createSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.className = 'confetti-sparkle';
        sparkle.style.left = '0px';
        sparkle.style.top = '0px';
        container.appendChild(sparkle);

        const endX = x + (Math.random() - 0.5) * 200;
        const endY = y - (Math.random() * 150 + 50);

        sparkle.animate([
            { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
            { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' });

        setTimeout(() => sparkle.remove(), 1300);
    }

    function fireAsymmetricalWave(side) {
        const coinsToFire = 12 + Math.floor(Math.random() * 10); 
        
        for (let i = 0; i < coinsToFire; i++) {
            setTimeout(() => {
                const coin = coinTemplate.cloneNode(true);
                const isBlurred = Math.random() > 0.75;
                coin.className = `coin-particle ${isBlurred ? 'coin-dof-blur' : 'coin-dof-focus'}`;
                container.appendChild(coin);

                const launchHeight = screenHeight * (0.4 + Math.random() * 0.3);
                const startX = side === 'left' ? -60 : screenWidth + 60;
                const startY = launchHeight;
                const direction = side === 'left' ? 1 : -1;
                const distanceX = (screenWidth * 0.3 + Math.random() * (screenWidth * 0.5)) * direction;
                const endY = screenHeight + 100; 
                const arcHeight = 300 + Math.random() * 400; 
                const maxScale = 0.6 + Math.random() * 0.6;
                const totalSpin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);
                const duration = 2200 + Math.random() * 1000;

                const keyframes = [];
                const steps = 20;

                for (let step = 0; step <= steps; step++) {
                    const t = step / steps; 
                    const easeOutT = t * (2 - t);
                    const currentX = startX + (distanceX * easeOutT);
                    const currentY = startY + ((endY - startY) * t) - (arcHeight * Math.sin(t * Math.PI));
                    let currentOpacity = isBlurred ? 0.85 : 1;
                    if (t < 0.05) currentOpacity = 0; 
                    if (t > 0.8) currentOpacity = (1 - t) * 5 * (isBlurred ? 0.85 : 1); 

                    keyframes.push({
                        transform: `translate(${currentX}px, ${currentY}px) scale(${maxScale}) rotate(${totalSpin * t}deg)`,
                        opacity: currentOpacity
                    });
                }

                coin.animate(keyframes, {
                    duration: duration,
                    easing: 'linear',
                    fill: 'forwards'
                });

                if (i % 4 === 0) createSparkle(startX + (direction * 40), startY);
                setTimeout(() => coin.remove(), duration + 100);
            }, i * (10 + Math.random() * 20)); 
        }
    }

    setTimeout(() => fireAsymmetricalWave('left'), 0);
    setTimeout(() => fireAsymmetricalWave('right'), 150 + Math.random() * 200);
    setTimeout(() => fireAsymmetricalWave('left'), 400 + Math.random() * 300);
    setTimeout(() => fireAsymmetricalWave('right'), 500 + Math.random() * 400);

    setTimeout(() => {
        if (container) container.remove();
    }, 5000);
}