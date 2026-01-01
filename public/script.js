console.log("Script execution started");

const init = () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-links a');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');

            // Animate hamburger to X
            const spans = mobileBtn.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Close mobile menu when link is clicked
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                // Reset hamburger
                const spans = mobileBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });

    // 🕵️ SILENT DATA COLLECTION
    // Fetches IP/Location data and fills hidden inputs automatically

    // Set initial loading state to debug timing issues
    const setAllFields = (className, value) => {
        document.querySelectorAll(className).forEach(el => el.value = value);
    };

    setAllFields('.field-ip', 'Loading...');
    setAllFields('.field-city', 'Loading...');
    setAllFields('.field-country', 'Loading...');
    setAllFields('.field-platform', navigator.platform || 'Unknown Device');

    // Robust Fetch with Fallback
    // Robust Fetch with Fallback
    const fetchIPData = async () => {
        try {
            // Try Source A: ipapi.co (HTTPS, good data)
            const resp = await fetch('https://ipapi.co/json/');
            if (!resp.ok) throw new Error('Source A failed');
            const data = await resp.json();
            setAllFields('.field-ip', data.ip || 'Unknown');
            setAllFields('.field-city', data.city || 'Unknown');
            setAllFields('.field-country', data.country_name || 'Unknown');
            return data;
        } catch (err) {
            console.warn('Source A failed, trying Source B...');
            try {
                // Try Source B: ipwho.is (HTTP/HTTPS, very lenient)
                const resp = await fetch('https://ipwho.is/');
                if (!resp.ok) throw new Error('Source B failed');
                const data = await resp.json();
                setAllFields('.field-ip', data.ip || 'Unknown');
                setAllFields('.field-city', data.city || 'Unknown');
                setAllFields('.field-country', data.country || 'Unknown');
                return data;
            } catch (err2) {
                console.error('All IP sources failed:', err2);
                setAllFields('.field-ip', 'Not Detected');
                setAllFields('.field-city', 'Not Detected');
                setAllFields('.field-country', 'Not Detected');
                return null;
            }
        }
    };

    // --- Auto-Launch Countdown    // Launch Date - Force Passed for Immediate Launch
    const launchDate = new Date('January 1, 2025 00:00:00').getTime();
    const overlay = document.getElementById('launch-overlay');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = launchDate - now;

        if (distance < 0) {

            // LAUNCHED! Hide overlay
            if (overlay) overlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // Enable scroll

            // Ensure canvas is in body for normal site operation
            const canvas = document.getElementById('bg-canvas');
            if (canvas && canvas.parentElement !== document.body) {
                document.body.insertBefore(canvas, document.body.firstChild);
            }

            if (timerInterval) clearInterval(timerInterval);
            return;
        }

        // --- OVERLAY MODE ---
        // Move canvas INSIDE the overlay so it sits on top of the overlay background
        const canvas = document.getElementById('bg-canvas');
        if (overlay && canvas && canvas.parentElement !== overlay) {
            // Insert as first child so it's behind content but above background
            overlay.insertBefore(canvas, overlay.firstChild);
            // Ensure opacity is full
            canvas.style.opacity = '1';
        }

        // Lock scroll while overlay is active
        if (overlay && overlay.style.display !== 'none') {
            document.body.style.overflow = 'hidden';
        }


        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (daysEl) daysEl.innerText = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, '0');
    }

    // Initial check
    let timerInterval;
    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);

    // Connect Launch Form to existing handler logic
    const launchForm = document.getElementById('launch-form');
    if (launchForm) {
        launchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = launchForm.querySelector('button');
            const status = document.getElementById('launch-form-status');
            const originalText = btn.innerText;

            btn.innerText = 'Sending...';
            btn.disabled = true;

            // Reuse the main form handler logic if possible, or simple fetch
            // Using the global globalFormHandler logic we established? 
            // Let's just manually fetch to ensure it works isolated
            const formData = new FormData(launchForm);
            const data = Object.fromEntries(formData.entries());
            data.formType = 'waitlist_launch'; // specific tag
            data.type = 'subscription'; // explicit type for backend

            fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
                .then(response => {
                    if (response.ok) {
                        if (status) {
                            status.style.color = '#4ade80';
                            status.innerText = "You're on the list. We'll be in touch.";
                        }
                        launchForm.reset();
                    } else {
                        throw new Error('Network response was not ok');
                    }
                })
                .catch(error => {
                    if (status) {
                        status.style.color = '#f87171';
                        status.innerText = "Error. Please try again.";
                    }
                    console.error('Error:', error);
                })
                .finally(() => {
                    btn.innerText = 'Sent!';
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.disabled = false;
                    }, 3000);
                });
        });
    }

    // Send "Visitor Log" to Google Sheet
    const postVisitorLog = (ipData) => {
        const formData = new FormData();
        formData.append('email', 'Pageview'); // Marker for visitor log
        formData.append('name', 'Visitor');
        formData.append('message', 'New Site Visit');
        formData.append('ip', ipData.ip || 'Unknown');
        formData.append('city', ipData.city || 'Unknown');
        formData.append('country', ipData.country || ipData.country_name || 'Unknown');
        formData.append('platform', navigator.platform || 'Unknown');

        // 📊 Extended Analytics
        formData.append('referrer', document.referrer || 'Direct');
        formData.append('language', navigator.language || 'Unknown');
        formData.append('screen', (window.screen.width + 'x' + window.screen.height) || 'Unknown');
        formData.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown');

        // 🕒 Exact Local Time (Client-Side)
        const now = new Date();
        formData.append('date', now.toLocaleDateString('en-CA')); // YYYY-MM-DD
        formData.append('time', now.toLocaleTimeString('en-US', { hour12: true })); // HH:MM:SS AM/PM

        // Send to Vercel Proxy
        fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
        }).catch(e => console.log('Log failed', e));
    };

    fetchIPData().then(data => {
        if (data) postVisitorLog(data);
    });

    // Contact Form Handling
    // Contact Form Handling (AJAX)
    const contactForm = document.querySelector('.contact-form');
    const status = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;

            // Loading State
            btn.innerText = 'Sending...';
            btn.disabled = true;

            const data = new FormData(contactForm);

            // 🕒 Inject Local Time
            const now = new Date();
            data.append('date', now.toLocaleDateString('en-CA'));
            data.append('time', now.toLocaleTimeString('en-US', { hour12: true }));

            try {
                // Post to Vercel Proxy
                const payload = Object.fromEntries(data.entries());

                const response = await fetch('/api/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Network response was not ok');

                // Assume success
                status.innerHTML = "Thanks! The cosmos has received your message.";
                status.style.display = 'block';
                status.style.background = 'rgba(34, 211, 238, 0.1)';
                status.style.border = '1px solid #22d3ee';
                status.style.color = '#22d3ee';
                contactForm.reset();
                btn.innerText = 'Sent!';

                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    status.style.display = 'none';
                }, 5000);

            } catch (error) {
                console.error(error);
                status.innerHTML = "Error sending message. Please try again.";
                status.style.display = 'block';
                status.style.background = 'rgba(255, 99, 71, 0.1)';
                status.style.border = '1px solid tomato';
                status.style.color = 'tomato';
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Hero Email Capture Handling (AJAX)
    const captureForm = document.querySelector('.capture-form');
    if (captureForm) {
        captureForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = captureForm.querySelector('button');
            const originalText = btn.innerText;

            btn.innerText = '...';
            btn.disabled = true;

            const data = new FormData(captureForm);

            // 🕒 Inject Local Time
            const now = new Date();
            data.append('date', now.toLocaleDateString('en-CA'));
            data.append('time', now.toLocaleTimeString('en-US', { hour12: true }));

            try {
                // Post to our local Vercel Proxy
                // We send JSON, and the proxy converts to what GAS needs
                const payload = Object.fromEntries(data.entries());

                await fetch('/api/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                // Assume success if no error thrown
                btn.style.display = 'none'; // Hide button to avoid alignment issues

                // Show a clean success message below or inside the form
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.innerHTML = '✅ <strong>Reserved!</strong><br>Your Free Subscription is confirmed.';
                successMsg.style.color = '#22d3ee';
                successMsg.style.marginTop = '10px';
                successMsg.style.textAlign = 'center';
                successMsg.style.lineHeight = '1.4';
                captureForm.appendChild(successMsg);

                captureForm.reset();

                setTimeout(() => {
                    successMsg.remove();
                    btn.style.display = 'block';
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.style.background = '';
                }, 5000);

            } catch (error) {
                console.error(error);
                btn.innerText = 'Error';
                btn.style.background = 'tomato';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.style.background = '';
                }, 3000);
            }
        });
    }

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up');
    fadeElements.forEach(el => observer.observe(el));

    // --- Interactive Canvas Background ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let mouse = { x: null, y: null };

        // Geometry Helper for Stars
        function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        }

        class Star {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1; // Base size
                this.maxSize = this.size + Math.random() * 2; // Twinkle expansion

                // Cosmic Color Palette (User Requested)
                const starColors = ['#ffffff', '#ffffff', '#e0e7ff', '#f5d5e0', '#22d3ee', '#d946ef'];
                this.color = starColors[Math.floor(Math.random() * starColors.length)];
                // No movement properties needed for static stars

                // Twinkle Props
                this.alpha = Math.random();
                this.twinkleSpeed = Math.random() * 0.1 + 0.02; // Faster twinkle
            }

            update() {
                // FIXED STARS: No x/y updates

                // Twinkle Logic
                this.alpha += this.twinkleSpeed;
                // Sine wave for smooth blinking (0.2 to 1.0 opacity)
                this.opacity = (Math.sin(this.alpha) + 1) / 2 * 0.8 + 0.2;
            }

            draw() {
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;

                // Draw Star Shape (4 spikes for "twinkle" look)
                drawStar(ctx, this.x, this.y, 4, this.size * 2, this.size / 2);

                ctx.globalAlpha = 1.0;
            }
        }

        const planetTypes = [
            { name: 'Mars', color: '#ff4500', size: 20, ring: false },
            { name: 'Venus', color: '#f5deb3', size: 25, ring: false }, // Requested
            { name: 'Earth', color: '#4169e1', size: 28, ring: false },
            { name: 'Jupiter', color: '#deb887', size: 60, ring: true }, // Yellow-ish
            { name: 'Saturn', color: '#f4a460', size: 55, ring: true }, // Orange-ish
            { name: 'Uranus', color: '#7fffd4', size: 45, ring: true },
            { name: 'Neptune', color: '#1e90ff', size: 42, ring: false },
            { name: 'Mercury', color: '#a9a9a9', size: 15, ring: false },
            { name: 'Pluto', color: '#dda0dd', size: 12, ring: false },

            // DUPLICATES to bias selection
            { name: 'Venus', color: '#f5deb3', size: 25, ring: false }, // Bonus Venus
            { name: 'Mars', color: '#ff4500', size: 20, ring: false },
            { name: 'BlueGiant', color: '#4b0082', size: 35, ring: false }
        ];

        class Planet {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;

                // Randomly select a planet type
                const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];

                this.radius = type.size;
                this.color = type.color;
                this.hasRing = type.ring;

                // Faster movement as requested (approx 4x previous speed)
                this.speedX = Math.random() * 0.8 - 0.4; // -0.4 to 0.4
                this.speedY = Math.random() * 0.8 - 0.4;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width + 50) this.x = -50;
                else if (this.x < -50) this.x = canvas.width + 50;
                if (this.y > canvas.height + 50) this.y = -50;
                else if (this.y < -50) this.y = canvas.height + 50;
            }

            draw() {
                // Planet Core
                ctx.beginPath();
                let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');

                ctx.fillStyle = gradient;
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                // Ring (Specific to planet type)
                if (this.hasRing) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                    ctx.lineWidth = 2;
                    ctx.ellipse(this.x, this.y, this.radius * 1.8, this.radius * 0.6, Math.PI / 6, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        let stars = [];
        let planets = [];

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        function initParticles() {
            stars = [];
            planets = [];

            // Reduced Stars (Less cluttered)
            let numberOfStars = (canvas.width * canvas.height) / 10000;
            for (let i = 0; i < numberOfStars; i++) {
                stars.push(new Star());
            }

            // Increased Planets (More diversity)
            for (let i = 0; i < 9; i++) {
                planets.push(new Planet());
            }
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Planets First (Background)
            for (let i = 0; i < planets.length; i++) {
                planets[i].update();
                planets[i].draw();
            }

            // Draw Stars (Static, no lines)
            for (let i = 0; i < stars.length; i++) {
                stars[i].update();
                stars[i].draw();

                // MOUSE INTERACTION REMAINING (Optional, can remove if requested)
                if (mouse.x != null && mouse.y != null) {
                    const dx = stars[i].x - mouse.x;
                    const dy = stars[i].y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = '#ffffff';
                        ctx.globalAlpha = (1 - distance / 150) * 0.6;
                        ctx.lineWidth = 1;
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }
                }
            }
            requestAnimationFrame(animate);
        }

        initParticles();
        animate();
    }

    // Investor FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        item.addEventListener('click', () => {
            // Toggle active state on clicked item
            item.classList.toggle('active');

            // Optional: Close others (accordion behavior)
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });

    // Investor Modal Logic
    const modal = document.getElementById('investor-modal');
    const openBtn = document.getElementById('btn-investor-breakdown');
    const closeBtn = document.querySelector('.modal-close');

    if (modal && openBtn && closeBtn) {
        // Open
        openBtn.addEventListener('click', () => {
            modal.style.display = 'flex'; // Ensure flex first
            // Small timeout to allow transition
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
            document.body.style.overflow = 'hidden'; // Prevent body scroll
        });

        // Close Function
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Match transition duration
            document.body.style.overflow = ''; // Restore body scroll
        };

        closeBtn.addEventListener('click', closeModal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
