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
            document.addEventListener('click', (e) => {
                if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
                    hamburger.classList.remove('open');
                    hamburger.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('open');
                    document.body.style.overflow = '';
                }
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
                const overlay = document.getElementById('bp-modal-overlay');
                let expandedNode = null;
                let isAnimating = { eng: false, growth: false, workflow: false };
                let hasLoaded = false;

                const renderBlueprintConnections = () => {
                    const bpSvg = document.getElementById('bp-svg');
                    const bpLinesGroup = document.getElementById('bp-lines');
                    const bpTriggersGroup = document.getElementById('bp-triggers');
                    const bpParticlesGroup = document.getElementById('bp-particles');
                    
                    if (!bpLinesGroup || !bpSvg) return;
                    
                    bpLinesGroup.innerHTML = '';
                    bpTriggersGroup.innerHTML = '';
                    bpParticlesGroup.innerHTML = '';
                    
                    const containerRect = bpContainer.getBoundingClientRect();
                    const SPEED = 130; // pixels per second
                    const primaryTravelTimes = {};
                    const nodeData = [];
                    let maxEndTime = 0;

                    // Pass 1: Calculate coordinates, travel times, and find max cycle time
                    nodes.forEach(node => {
                        const parentId = node.dataset.parent;
                        if (!parentId) return;
                        
                        const parentNode = bpContainer.querySelector(`.bp-node[data-node="${parentId}"]`);
                        if (!parentNode) return;
                        
                        const pRect = parentNode.getBoundingClientRect();
                        const nRect = node.getBoundingClientRect();
                        
                        const x1 = pRect.left + (pRect.width / 2) - containerRect.left;
                        const y1 = pRect.top + (pRect.height / 2) - containerRect.top;
                        const x2 = nRect.left + (nRect.width / 2) - containerRect.left;
                        const y2 = nRect.top + (nRect.height / 2) - containerRect.top;
                        
                        const nodeId = node.dataset.node;
                        const isPrimary = node.classList.contains('primary');
                        const branchName = isPrimary ? nodeId : parentId;
                        
                        const length = Math.hypot(x2 - x1, y2 - y1);
                        const travelTime = length / SPEED;
                        
                        if (isPrimary) {
                            primaryTravelTimes[nodeId] = travelTime;
                            node.dataset.trigDur = travelTime;
                        }
                        
                        // We must estimate endTime for this node. If it's a leaf, we need parent's travel time.
                        // Since primary nodes appear first in DOM, primaryTravelTimes[parentId] will be ready.
                        const startTime = isPrimary ? 0 : (primaryTravelTimes[parentId] || 0);
                        const endTime = startTime + travelTime;
                        
                        if (endTime > maxEndTime) maxEndTime = endTime;
                        
                        nodeData.push({ node, parentId, x1, y1, x2, y2, nodeId, isPrimary, branchName, length, travelTime, startTime, endTime });
                    });
                    
                    // Add a 1.0s buffer to the longest path for a perfect organic looping pause
                    const CYCLE_TIME = Math.max(5.0, maxEndTime + 1.0);
                    
                    // Set SVG viewBox explicitly to prevent any browser intrinsic scaling
                    bpSvg.setAttribute('viewBox', `0 0 ${containerRect.width} ${containerRect.height}`);
                    
                    // Pass 2: Generate SVG elements with mathematically safe cycle times
                    nodeData.forEach(data => {
                        const { node, parentId, x1, y1, x2, y2, nodeId, isPrimary, branchName, length, travelTime, startTime, endTime } = data;
                        
                        // Create Line
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const lineClass = isPrimary ? 'core-line' : `${branchName}-line`;
                        const lineId = isPrimary ? `p-h-${nodeId.charAt(0)}` : `p-${branchName.charAt(0)}-${nodeId.charAt(0)}`;
                        
                        // Preserve existing state on re-render to prevent hover glitches
                        const existingLine = document.getElementById(lineId);
                        const finalClasses = existingLine ? existingLine.getAttribute('class') : `bp-line ${lineClass} ${hasLoaded ? 'line-visible' : ''}`;
                        
                        line.setAttribute('class', finalClasses.trim());
                        line.setAttribute('id', lineId);
                        line.setAttribute('d', `M${x1},${y1} L${x2},${y2}`);
                        line.setAttribute('data-source', parentId);
                        line.setAttribute('data-target', nodeId);
                        
                        // Apply precise dash offset for animation
                        line.style.strokeDasharray = length;
                        line.style.strokeDashoffset = length;
                        
                        bpLinesGroup.appendChild(line);
                        
                        // If it's a primary node, create trigger particle
                        if (isPrimary) {
                            const trig = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            trig.setAttribute('class', `bp-trigger ${branchName}-hub`);
                            trig.setAttribute('id', `trig-${branchName}`);
                            trig.setAttribute('r', '6');
                            trig.setAttribute('opacity', '0');
                            
                            const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
                            anim.setAttribute('id', `anim-trig-${branchName}`);
                            anim.setAttribute('dur', `${travelTime}s`);
                            anim.setAttribute('begin', 'indefinite');
                            anim.setAttribute('path', `M${x1},${y1} L${x2},${y2}`);
                            anim.setAttribute('fill', 'freeze');
                            
                            trig.appendChild(anim);
                            bpTriggersGroup.appendChild(trig);
                        }
                        
                        // Create Continuous Particles (Synchronized cascading wave)
                        const pClass = isPrimary ? `${branchName}-hub` : `${branchName}-particle`;
                        const pRadius = isPrimary ? '4' : '3';
                        
                        const fs = startTime / CYCLE_TIME;
                        const fe = endTime / CYCLE_TIME;
                        
                        [0, CYCLE_TIME / 2].forEach(offset => {
                            const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            particle.setAttribute('class', `bp-particle ${pClass}`);
                            particle.setAttribute('r', pRadius);
                            
                            const motion = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
                            motion.setAttribute('dur', `${CYCLE_TIME}s`);
                            motion.setAttribute('begin', `${offset}s`);
                            motion.setAttribute('repeatCount', 'indefinite');
                            motion.setAttribute('path', `M${x1},${y1} L${x2},${y2}`);
                            motion.setAttribute('calcMode', 'linear');
                            
                            let motionKeyTimes, motionKeyPoints, opacityKeyTimes, opacityValues;
                            // Clamp fractions tightly just to be safe against floating point math
                            const safeFe = Math.min(fe, 1);
                            const safeFs = Math.min(fs, 1);
                            
                            if (safeFs === 0) {
                                motionKeyTimes = `0; ${safeFe}; 1`;
                                motionKeyPoints = `0; 1; 1`;
                                opacityKeyTimes = `0; ${Math.max(0, safeFe - 0.001)}; ${safeFe}; 1`;
                                opacityValues = `1; 1; 0; 0`;
                            } else {
                                motionKeyTimes = `0; ${safeFs}; ${safeFe}; 1`;
                                motionKeyPoints = `0; 0; 1; 1`;
                                opacityKeyTimes = `0; ${Math.max(0, safeFs - 0.001)}; ${safeFs}; ${Math.max(0, safeFe - 0.001)}; ${safeFe}; 1`;
                                opacityValues = `0; 0; 1; 1; 0; 0`;
                            }
                            
                            motion.setAttribute('keyTimes', motionKeyTimes);
                            motion.setAttribute('keyPoints', motionKeyPoints);
                            
                            const opacityAnim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
                            opacityAnim.setAttribute('attributeName', 'opacity');
                            opacityAnim.setAttribute('dur', `${CYCLE_TIME}s`);
                            opacityAnim.setAttribute('begin', `${offset}s`);
                            opacityAnim.setAttribute('repeatCount', 'indefinite');
                            opacityAnim.setAttribute('keyTimes', opacityKeyTimes);
                            opacityAnim.setAttribute('values', opacityValues);
                            
                            particle.appendChild(motion);
                            particle.appendChild(opacityAnim);
                            bpParticlesGroup.appendChild(particle);
                        });
                    });
                };
                
                // Render on init and window resize
                renderBlueprintConnections();
                window.addEventListener('resize', () => {
                    requestAnimationFrame(renderBlueprintConnections);
                });

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

                        const trigDurMs = parseFloat(primaryNode.dataset.trigDur) * 1000;

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
                        }, trigDurMs); // Dynamic timing based on precise math calculation
                    }, 50);
                };

                const startInitialSequence = () => {
                    if (hasLoaded) return;
                    
                    // Re-render lines just in case fonts or initial layout caused shifts
                    renderBlueprintConnections();
                    
                    hasLoaded = true;
                    
                    const hub = bpContainer.querySelector('.hub');
                    if (hub) hub.classList.add('node-visible');

                    // Trigger all branches simultaneously. Because they use a constant speed calculation,
                    // they will organically hit their nodes and trigger their leaves at exactly the right times!
                    setTimeout(() => {
                        triggerBranch('eng');
                        triggerBranch('growth');
                        triggerBranch('work');
                    }, 250);
                    
                    setTimeout(() => {
                        bpContainer.classList.add('streams-active');
                    }, 2500);
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
                            bpContainer.querySelectorAll('.bp-line').forEach(line => {
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
                        bpContainer.querySelectorAll('.bp-line').forEach(l => l.classList.remove('active'));
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
                    bpContainer.querySelectorAll('.bp-line').forEach(l => l.classList.remove('active'));
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
            const errorMsg = document.getElementById('form-error');

            if (form) {
                // Replace with your EmailJS public key
                if (typeof emailjs !== 'undefined') {
                    emailjs.init("YOUR_PUBLIC_KEY");
                }

                form.addEventListener('submit', e => {
                    e.preventDefault();
                    
                    const name = form.querySelector('#fname').value.trim();
                    const email = form.querySelector('#femail').value.trim();
                    const message = form.querySelector('#fmessage').value.trim();
                    
                    if (!name || !email || !message) {
                        alert('Please fill out all fields.');
                        return;
                    }
                    
                    const btn = form.querySelector('button[type=submit]');
                    const originalBtnText = btn.textContent;
                    btn.textContent = 'Sending…'; 
                    btn.disabled = true;
                    if (successMsg) successMsg.style.display = 'none';
                    if (errorMsg) errorMsg.style.display = 'none';
                    
                    if (typeof emailjs === 'undefined') {
                        console.error('EmailJS SDK not loaded.');
                        btn.textContent = originalBtnText;
                        btn.disabled = false;
                        if (errorMsg) errorMsg.style.display = 'block';
                        return;
                    }

                    // Replace with your EmailJS service ID, template ID
                    emailjs.sendForm('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', form)
                        .then(() => {
                            form.reset();
                            btn.style.display = 'none';
                            if (successMsg) successMsg.style.display = 'block';
                        })
                        .catch((error) => {
                            console.error('EmailJS Error:', error);
                            btn.textContent = originalBtnText;
                            btn.disabled = false;
                            if (errorMsg) errorMsg.style.display = 'block';
                        });
                });
            }

            /* ══ HERO CARD HEIGHT MATCHING FOR RESPONSIVE ═══════════════ */
            const matchHeroCardsHeight = () => {
                const textCard = document.querySelector('.hero-text-card-bg');
                const visualImage = document.querySelector('.ref-card-wrapper img');
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
