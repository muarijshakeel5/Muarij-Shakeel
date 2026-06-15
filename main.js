(function () {
            'use strict';
            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            /* ══ NAVBAR SCROLL + ACTIVE LINKS ══════════════════════════ */
            const navbar = document.getElementById('navbar');
            const sections = document.querySelectorAll('section[id]');
            const navLinks = document.querySelectorAll('.nav-link');
            let lastScrollY = window.scrollY;

            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                navbar.classList.toggle('scrolled', currentScrollY > 40);
                
                if (currentScrollY > lastScrollY && currentScrollY > 100) {
                    navbar.classList.add('nav-hidden');
                } else if (currentScrollY < lastScrollY) {
                    navbar.classList.remove('nav-hidden');
                }
                lastScrollY = currentScrollY;

                let current = '';
                sections.forEach(s => { if (currentScrollY >= s.offsetTop - 140) current = s.id; });
                navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
            }, { passive: true });

            /* ══ MOBILE MENU ════════════════════════════════════════════ */
            const hamburger = document.getElementById('hamburger');
            const mobileMenu = document.getElementById('mobileMenu');
            hamburger.addEventListener('click', () => {
                const open = hamburger.classList.toggle('open');
                hamburger.setAttribute('aria-expanded', String(open));
                mobileMenu.classList.toggle('open', open);
                document.body.style.overflow = open ? 'hidden' : '';
            });
            document.querySelectorAll('.mobile-link').forEach(a => {
                a.addEventListener('click', () => {
                    hamburger.classList.remove('open');
                    hamburger.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('open');
                    document.body.style.overflow = '';
                });
            });

            /* ══ SCROLL REVEAL ══════════════════════════════════════════ */
            const revealObs = new IntersectionObserver(entries => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
            }, { threshold: 0.1 });
            document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

            /* ══ TECHNICAL BLUEPRINT (LIVING BLUEPRINT) ════════════════════════════════════ */
            const bpContainer = document.querySelector('.blueprint-container');
            if (bpContainer) {
                const nodes = bpContainer.querySelectorAll('.bp-node');
                const lines = bpContainer.querySelectorAll('.bp-line');
                const overlay = document.getElementById('bp-modal-overlay');
                let expandedNode = null;
                let isAnimating = { eng: false, growth: false, workflow: false };
                let hasLoaded = false;

                const triggerBranch = (branchId, isReplay = false) => {
                    if (isReplay && isAnimating[branchId]) return;
                    if (isReplay) isAnimating[branchId] = true;

                    const primaryLine = document.getElementById(`p-h-${branchId.charAt(0)}`);
                    const triggerParticle = document.getElementById(`trig-${branchId}`);
                    const animTrigger = document.getElementById(`anim-trig-${branchId}`);
                    const primaryNode = bpContainer.querySelector(`.primary[data-node="${branchId}"]`);
                    const leafLines = bpContainer.querySelectorAll(`.${branchId}-line`);
                    const leaves = bpContainer.querySelectorAll(`.${branchId}-leaf`);

                    if (!isReplay && primaryLine) primaryLine.classList.add('line-visible');
                    
                    if (isReplay) {
                        leafLines.forEach(l => l.classList.remove('line-visible'));
                        leaves.forEach(l => {
                            l.style.transitionDelay = '0s';
                            l.classList.remove('node-visible');
                        });
                        bpContainer.classList.remove('streams-active');
                    }

                    // Small delay to allow CSS reset if replaying
                    setTimeout(() => {
                        if (triggerParticle) triggerParticle.classList.add('active');
                        if (animTrigger) animTrigger.beginElement();

                        setTimeout(() => {
                            if (triggerParticle) triggerParticle.classList.remove('active');
                            if (!isReplay && primaryNode) primaryNode.classList.add('node-visible');
                            
                            leafLines.forEach(l => l.classList.add('line-visible'));
                            leaves.forEach((leaf, idx) => {
                                leaf.style.transitionDelay = `${idx * 0.1}s`;
                                leaf.classList.add('node-visible');
                                setTimeout(() => { leaf.style.transitionDelay = '0s'; }, 1000 + (idx * 100));
                            });

                            if (isReplay) {
                                setTimeout(() => {
                                    bpContainer.classList.add('streams-active');
                                    isAnimating[branchId] = false;
                                }, 1000);
                            }
                        }, 600); // Trigger particle duration matches animateMotion dur
                    }, 50);
                };

                const startInitialSequence = () => {
                    if (hasLoaded) return;
                    hasLoaded = true;
                    
                    const hub = bpContainer.querySelector('.hub');
                    if (hub) hub.classList.add('node-visible');

                    setTimeout(() => triggerBranch('eng'), 250);
                    setTimeout(() => triggerBranch('growth'), 500);
                    setTimeout(() => triggerBranch('work'), 750);
                    
                    setTimeout(() => {
                        bpContainer.classList.add('streams-active');
                    }, 2000);
                };

                const bpObserver = new IntersectionObserver(entries => {
                    entries.forEach(e => {
                        if (e.isIntersecting) {
                            startInitialSequence();
                            bpObserver.unobserve(e.target);
                        }
                    });
                }, { threshold: 0.3 });
                bpObserver.observe(bpContainer);
                
                nodes.forEach(node => {
                    node.addEventListener('mouseenter', () => {
                        if(window.innerWidth <= 900 || expandedNode) return; // Disable hover if on mobile or panel open
                        bpContainer.classList.add('has-hover');
                        const nodeId = node.dataset.node;
                        node.classList.add('active');
                        
                        // Adaptive Theming
                        if (nodeId === 'eng' || node.classList.contains('eng-leaf')) {
                            bpContainer.classList.add('theme-eng');
                        } else if (nodeId === 'growth' || node.classList.contains('growth-leaf')) {
                            bpContainer.classList.add('theme-growth');
                        }
                        
                        if (node.classList.contains('primary') && hasLoaded) {
                            triggerBranch(nodeId, true);
                        }
                        
                        if (node.classList.contains('primary') || node.classList.contains('hub')) {
                            lines.forEach(line => {
                                if (line.dataset.source === nodeId || line.dataset.target === nodeId) {
                                    line.classList.add('active');
                                    bpContainer.querySelectorAll(`.bp-node[data-node="${line.dataset.target}"], .bp-node[data-node="${line.dataset.source}"]`).forEach(n => n.classList.add('active'));
                                }
                            });
                        }
                    });
                    
                    node.addEventListener('mouseleave', () => {
                        if (expandedNode) return;
                        bpContainer.classList.remove('has-hover', 'theme-eng', 'theme-growth');
                        nodes.forEach(n => n.classList.remove('active'));
                        lines.forEach(l => l.classList.remove('active'));
                    });
                });

                const runCounters = (panel) => {
                    panel.querySelectorAll('.bp-stat-counter').forEach(el => {
                        const target = +el.dataset.target, suffix = el.dataset.suffix || '';
                        const dur = 1400, t0 = performance.now();
                        const tick = now => {
                            const p = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
                            el.textContent = Math.round(ease * target) + suffix;
                            if (p < 1) requestAnimationFrame(tick);
                        };
                        requestAnimationFrame(tick);
                    });
                };

                const expandNode = (node) => {
                    expandedNode = node;
                    node.classList.add('expanded');
                    overlay.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    
                    // Reset and run animated counters
                    node.querySelectorAll('.bp-stat-counter').forEach(el => el.textContent = '0' + (el.dataset.suffix || ''));
                    setTimeout(() => runCounters(node), 300);
                };
                
                const closeNode = () => {
                    if (expandedNode) {
                        expandedNode.classList.remove('expanded');
                        expandedNode = null;
                    }
                    overlay.classList.remove('show');
                    document.body.style.overflow = '';
                    
                    // Clear hover states
                    bpContainer.classList.remove('has-hover', 'theme-eng', 'theme-growth');
                    nodes.forEach(n => n.classList.remove('active'));
                    lines.forEach(l => l.classList.remove('active'));
                };

                bpContainer.querySelectorAll('.bp-node.primary').forEach(node => {
                    node.addEventListener('click', (e) => {
                        if (e.target.closest('.bp-modal-close')) return;
                        if (!node.classList.contains('expanded')) {
                            expandNode(node);
                        }
                    });
                });

                if (overlay) overlay.addEventListener('click', closeNode);
                document.querySelectorAll('.bp-modal-close').forEach(btn => btn.addEventListener('click', closeNode));
            }
            /* ══ ANIMATED COUNTERS ══════════════════════════════════════ */
            const counterObs = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (!e.isIntersecting) return;
                    const el = e.target, target = +el.dataset.target, suffix = el.dataset.suffix || '';
                    const dur = 1400, t0 = performance.now();
                    const tick = now => {
                        const p = Math.min((now - t0) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
                        el.textContent = Math.round(ease * target) + suffix;
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                    counterObs.unobserve(el);
                });
            }, { threshold: 0.5 });
            document.querySelectorAll('.stat-number[data-target]').forEach(el => counterObs.observe(el));

            



            /* ══ MARQUEE TICKER — build items ══════════════════════════ */
            const items = ['React', 'Node.js', 'TypeScript', 'AWS', 'Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Next.js', 'Tailwind CSS', 'GitHub Actions', 'MongoDB', 'Redis', 'Figma', 'CI/CD'];
            const track = document.getElementById('marqueeTrack');
            const frag = document.createDocumentFragment();
            // double for seamless loop
            [...items, ...items].forEach(t => {
                const span = document.createElement('span');
                span.className = 'marquee-item';
                span.innerHTML = `<span class="marquee-dot" aria-hidden="true"></span>${t}`;
                frag.appendChild(span);
            });
            track.appendChild(frag);



            /* ══ CONTACT FORM ══════════════════════════════════════════ */
            const form = document.getElementById('contactForm');
            const successMsg = document.getElementById('form-success');
            form.addEventListener('submit', e => {
                e.preventDefault();
                const btn = form.querySelector('button[type=submit]');
                btn.textContent = 'Sending…'; btn.disabled = true;
                setTimeout(() => { form.reset(); btn.style.display = 'none'; successMsg.style.display = 'block'; }, 1200);
            });

            /* ══ HERO CARD HEIGHT MATCHING FOR RESPONSIVE ═══════════════ */
            const matchHeroCardsHeight = () => {
                const textCard = document.querySelector('.hero-text-card-bg');
                const visualImage = document.querySelector('.ref-card-wrapper > img');
                if (!textCard || !visualImage) return;

                if (window.innerWidth <= 900) {
                    visualImage.style.height = 'auto';
                    const textCardHeight = textCard.offsetHeight;
                    visualImage.style.height = `${textCardHeight}px`;
                } else {
                    visualImage.style.height = '';
                }
            };

            window.addEventListener('load', matchHeroCardsHeight);
            window.addEventListener('resize', matchHeroCardsHeight);
            if (document.fonts) {
                document.fonts.ready.then(matchHeroCardsHeight);
            }

        })();
