/* ============================================
   DEPYL — Main Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Header scroll effect ----
    const header = document.getElementById('header');
    let lastScroll = 0;

    function onScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();


    // ---- Mobile nav toggle ----
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('open');
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }


    // ---- Smooth scrolling ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 72;
                const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });


    // ---- Scroll-triggered animations ----
    const animElements = document.querySelectorAll('[data-animate]');

    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // Stagger sibling animations
                const siblings = entry.target.parentElement.querySelectorAll('[data-animate]');
                let index = Array.from(siblings).indexOf(entry.target);
                if (index < 0) index = 0;

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 120);

                animObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    animElements.forEach(el => animObserver.observe(el));


    // ---- Active nav link on scroll ----
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNav() {
        const scrollY = window.scrollY;
        const headerHeight = header ? header.offsetHeight : 72;

        sections.forEach(section => {
            const top = section.offsetTop - headerHeight - 100;
            const bottom = top + section.offsetHeight;

            if (scrollY >= top && scrollY < bottom) {
                const id = section.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();


    // ---- Stat counter animation ----
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));

    function animateCounter(el) {
        const target = parseFloat(el.dataset.target);
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            if (isDecimal) {
                el.textContent = current.toFixed(1);
            } else {
                el.textContent = Math.round(current);
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                if (isDecimal) {
                    el.textContent = target.toFixed(1);
                } else {
                    el.textContent = target;
                }
            }
        }

        requestAnimationFrame(update);
    }

    // ---- Cursor fluid trail (canvas) ----
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (hasFinePointer) {
        const canvas = document.createElement('canvas');
        canvas.id = 'cursor-trail-canvas';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const trail = [];
        const MAX_POINTS = 50;
        const TRAIL_LIFESPAN = 600;
        const MAX_RADIUS = 6;
        const MIN_RADIUS = 0.5;

        let mouseX = -100, mouseY = -100;
        let isMoving = false;
        let moveTimer = null;

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        resize();
        window.addEventListener('resize', resize);

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            isMoving = true;
            clearTimeout(moveTimer);
            moveTimer = setTimeout(() => { isMoving = false; }, 100);
        });

        function addPoint() {
            if (!isMoving) return;
            if (trail.length > 0) {
                const last = trail[trail.length - 1];
                const dx = mouseX - last.x;
                const dy = mouseY - last.y;
                if (dx * dx + dy * dy < 9) return;
            }
            trail.push({ x: mouseX, y: mouseY, time: Date.now() });
            if (trail.length > MAX_POINTS) trail.shift();
        }

        function drawTrail() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            addPoint();

            const now = Date.now();
            while (trail.length > 0 && (now - trail[0].time) > TRAIL_LIFESPAN) {
                trail.shift();
            }

            if (trail.length < 2) {
                requestAnimationFrame(drawTrail);
                return;
            }

            const passes = [
                { r: 255, g: 60,  b: 60,  ox: -1.2, oy: 0.4, alpha: 0.12 },
                { r: 56,  g: 189, b: 248, ox: 0,    oy: 0,   alpha: 0.2  },
                { r: 80,  g: 100, b: 255, ox: 1.2,  oy: -0.4, alpha: 0.12 },
                { r: 255, g: 255, b: 255, ox: 0,    oy: 0,   alpha: 0.08 },
            ];

            for (const pass of passes) {
                for (let i = 0; i < trail.length; i++) {
                    const p = trail[i];
                    const age = (now - p.time) / TRAIL_LIFESPAN;
                    const t = i / (trail.length - 1);

                    const radius = (MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * t) * (1 - age * 0.6);
                    const opacity = pass.alpha * (1 - age) * (0.3 + 0.7 * t);

                    const px = p.x + pass.ox;
                    const py = p.y + pass.oy;

                    ctx.beginPath();
                    ctx.arc(px, py, Math.max(radius, 0.2), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${pass.r},${pass.g},${pass.b},${opacity})`;
                    ctx.fill();

                    if (i > 0) {
                        const prev = trail[i - 1];
                        const prevAge = (now - prev.time) / TRAIL_LIFESPAN;
                        const prevT = (i - 1) / (trail.length - 1);
                        const prevRadius = (MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * prevT) * (1 - prevAge * 0.6);
                        const prevOpacity = pass.alpha * (1 - prevAge) * (0.3 + 0.7 * prevT);
                        const avgOpacity = (opacity + prevOpacity) * 0.5;
                        const avgRadius = (radius + prevRadius) * 0.5;

                        ctx.beginPath();
                        ctx.moveTo(prev.x + pass.ox, prev.y + pass.oy);
                        ctx.lineTo(px, py);
                        ctx.strokeStyle = `rgba(${pass.r},${pass.g},${pass.b},${avgOpacity})`;
                        ctx.lineWidth = avgRadius * 2;
                        ctx.lineCap = 'round';
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(drawTrail);
        }

        requestAnimationFrame(drawTrail);
    }

});
