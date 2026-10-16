document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Reveal Animation Setup
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 2. Navigation Header Always Visible at Top
    const header = document.querySelector('header');
    if (header) {
        header.style.transform = 'translateY(0)';
    }

    // 3. Section & Vertical Navigation References
    const vScrollFill = document.getElementById('vertical-scroll-fill');
    const vNavItems = document.querySelectorAll('.v-nav-item');
    const sections = document.querySelectorAll('section[id]');
    const sectionList = Array.from(sections);
    const autoToggleBtn = document.getElementById('auto-scroll-toggle');

    let currentSectionIndex = 0;
    let progressAnimFrame = null;
    let isAutoJumpActive = true;
    let startTime = null;
    let isProgrammaticScrolling = false;
    let programmaticScrollTimeout = null;
    const intervalDuration = 10000; // 10 seconds per section

    // Helper: Apply dot radial fills for manual or static states
    const syncDotsToSection = (activeIndex, approachingIndex = -1, approachingFill = 0) => {
        vNavItems.forEach((item, idx) => {
            item.classList.toggle('active', idx === activeIndex);
            const dot = item.querySelector('.v-dot');
            if (!dot) return;

            if (idx <= activeIndex) {
                dot.style.setProperty('--dot-fill', '100%');
                dot.style.borderColor = 'var(--accent-gold)';
            } else if (idx === approachingIndex) {
                dot.style.setProperty('--dot-fill', `${approachingFill}%`);
                dot.style.borderColor = approachingFill >= 85 ? 'var(--accent-gold)' : 'var(--border-color)';
            } else {
                dot.style.setProperty('--dot-fill', '0%');
                dot.style.borderColor = 'var(--border-color)';
            }
        });
    };

    // Helper: Smoothly scroll to a specific section index (exact 100dvh alignment)
    const scrollToSectionIndex = (index) => {
        if (sectionList.length === 0) return;
        currentSectionIndex = ((index % sectionList.length) + sectionList.length) % sectionList.length;
        const targetSection = sectionList[currentSectionIndex];

        if (targetSection) {
            isProgrammaticScrolling = true;
            if (programmaticScrollTimeout) clearTimeout(programmaticScrollTimeout);

            syncDotsToSection(currentSectionIndex);

            window.scrollTo({
                top: targetSection.offsetTop,
                behavior: 'smooth'
            });

            programmaticScrollTimeout = setTimeout(() => {
                isProgrammaticScrolling = false;
            }, 1100);
        }
    };

    // 4. Vertical Scroll Listener (Updates active section & manual scroll progress)
    const updateVerticalScroll = () => {
        if (sectionList.length === 0) return;

        const viewportCenter = window.scrollY + (window.innerHeight / 2);
        let closestIndex = 0;
        let minDistance = Infinity;

        sectionList.forEach((section, index) => {
            const sectionCenter = section.offsetTop + (section.offsetHeight / 2);
            const distance = Math.abs(viewportCenter - sectionCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        if (!isAutoJumpActive) {
            currentSectionIndex = closestIndex;
            const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
            const scrollPercent = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
            if (vScrollFill) {
                vScrollFill.style.height = `${scrollPercent}%`;
            }
            syncDotsToSection(closestIndex);
        } else if (!isProgrammaticScrolling) {
            vNavItems.forEach((item, idx) => {
                item.classList.toggle('active', idx === currentSectionIndex);
            });
        }
    };

    window.addEventListener('scroll', updateVerticalScroll, { passive: true });

    // 5. 10-Second Auto Presentation Mode with Approaching Dot Radial Gold Fill
    const animateVerticalProgress = (timestamp) => {
        if (!isAutoJumpActive || sectionList.length <= 1) return;
        if (!startTime) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const totalSegments = sectionList.length - 1; // 6 segments between 7 dots
        const segmentProgress = Math.min(1, elapsed / intervalDuration);
        const currentSegment = currentSectionIndex % sectionList.length;

        // Calculate line height between current dot and next dot
        let totalProgressPercent = 0;
        if (currentSegment < totalSegments) {
            totalProgressPercent = Math.min(100, ((currentSegment + segmentProgress) / totalSegments) * 100);
        } else {
            // On final section (07 / Connect), keep line at 100% while Dot 01 prepares to cycle
            totalProgressPercent = 100;
        }

        if (vScrollFill) {
            vScrollFill.style.height = `${totalProgressPercent}%`;
        }

        const nextIndex = (currentSegment + 1) % sectionList.length;
        const fillPercent = Math.round(segmentProgress * 100);

        syncDotsToSection(currentSegment, nextIndex, fillPercent);

        if (elapsed >= intervalDuration) {
            startTime = timestamp;
            if (nextIndex === 0 && vScrollFill) {
                vScrollFill.style.height = '0%';
            }
            scrollToSectionIndex(nextIndex);
        }

        progressAnimFrame = requestAnimationFrame(animateVerticalProgress);
    };

    const startAutoJumpMode = () => {
        stopAutoJumpMode();
        isAutoJumpActive = true;
        startTime = null;
        if (autoToggleBtn) {
            autoToggleBtn.textContent = 'AUTO: ON';
            autoToggleBtn.style.borderColor = 'var(--accent-gold)';
            autoToggleBtn.style.color = 'var(--accent-gold)';
        }
        progressAnimFrame = requestAnimationFrame(animateVerticalProgress);
    };

    const stopAutoJumpMode = () => {
        isAutoJumpActive = false;
        if (progressAnimFrame) {
            cancelAnimationFrame(progressAnimFrame);
            progressAnimFrame = null;
        }
        if (autoToggleBtn) {
            autoToggleBtn.textContent = 'AUTO: OFF';
            autoToggleBtn.style.borderColor = 'var(--border-color)';
            autoToggleBtn.style.color = 'var(--text-secondary)';
        }
        updateVerticalScroll();
    };

    if (autoToggleBtn) {
        autoToggleBtn.addEventListener('click', () => {
            if (isAutoJumpActive) {
                stopAutoJumpMode();
            } else {
                startAutoJumpMode();
            }
        });
    }

    // Stop auto presentation on manual user scroll/touch/keydown until turned back ON by user
    const handleManualScroll = () => {
        if (!isProgrammaticScrolling && isAutoJumpActive) {
            stopAutoJumpMode();
        }
    };

    window.addEventListener('wheel', handleManualScroll, { passive: true });
    window.addEventListener('touchstart', handleManualScroll, { passive: true });
    window.addEventListener('keydown', (e) => {
        if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
            // Ignore spacebar if typing in an input
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            handleManualScroll();
        }
    }, { passive: true });

    // Smooth anchor navigation for header logo and vertical nav dots
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#' || targetId === '#cv' || targetId === '#connect') return;

            const targetIndex = sectionList.findIndex(sec => `#${sec.id}` === targetId);
            if (targetIndex !== -1) {
                e.preventDefault();
                startTime = null;
                scrollToSectionIndex(targetIndex);
            }
        });
    });

    // 6. Security Verification Challenge for Connect Button
    const connectBtn = document.getElementById('connect-btn');
    const connectModal = document.getElementById('connect-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const challengeForm = document.getElementById('connect-challenge-form');
    const challengeAnswer = document.getElementById('challenge-answer');
    const modalError = document.getElementById('modal-error');

    const validAnswers = ['san diego', 'sandiego', 'san diego, ca', 'san diego, california', 'sd'];

    const closeConnectModal = () => {
        if (connectModal) connectModal.classList.remove('active');
    };

    if (connectBtn && connectModal) {
        connectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoJumpMode();
            connectModal.classList.add('active');
            if (modalError) modalError.style.display = 'none';
            if (challengeAnswer) {
                challengeAnswer.value = '';
                setTimeout(() => challengeAnswer.focus(), 100);
            }
        });

        if (closeModalBtn) closeModalBtn.addEventListener('click', closeConnectModal);

        connectModal.addEventListener('click', (e) => {
            if (e.target === connectModal) closeConnectModal();
        });

        if (challengeForm) {
            challengeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const userAnswer = challengeAnswer.value.trim().toLowerCase();

                if (validAnswers.includes(userAnswer)) {
                    if (modalError) modalError.style.display = 'none';
                    closeConnectModal();
                    window.location.href = 'mailto:davidshaharah@gmail.com';
                } else {
                    if (modalError) modalError.style.display = 'block';
                    challengeAnswer.value = '';
                    challengeAnswer.focus();
                }
            });
        }
    }

    // 7. Download CV Modal & Print Handler
    const downloadCvBtn = document.getElementById('download-cv-btn');
    const cvModal = document.getElementById('cv-modal');
    const closeCvModalBtn = document.getElementById('close-cv-modal');
    const printCvBtn = document.getElementById('print-cv-btn');

    const closeCvModal = () => {
        if (cvModal) cvModal.classList.remove('active');
    };

    if (downloadCvBtn && cvModal) {
        downloadCvBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoJumpMode();
            cvModal.classList.add('active');
        });

        if (closeCvModalBtn) closeCvModalBtn.addEventListener('click', closeCvModal);

        cvModal.addEventListener('click', (e) => {
            if (e.target === cvModal) closeCvModal();
        });

        if (printCvBtn) {
            printCvBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    // Escape key closes any open modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeConnectModal();
            closeCvModal();
        }
    });

    // 8. Custom Gold Follower Cursor (Desktop)
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor && window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
            customCursor.style.opacity = '1';
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            customCursor.style.opacity = '0';
        });

        const interactiveTargets = document.querySelectorAll('a, button, input, .skill-badge, .credential-card');
        interactiveTargets.forEach(el => {
            el.addEventListener('mouseenter', () => customCursor.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => customCursor.classList.remove('cursor-hover'));
        });
    }

    // 9. Operational Impact & ROI Calculator Sliders (with Dynamic Gold Track Fill)
    const empSlider = document.getElementById('emp-slider');
    const invSlider = document.getElementById('inv-slider');
    const empVal = document.getElementById('emp-val');
    const invVal = document.getElementById('inv-val');
    const metricHours = document.getElementById('metric-hours');
    const metricSpeed = document.getElementById('metric-speed');
    const metricAnnualHours = document.getElementById('metric-annual-hours');
    const metricCycleReduction = document.getElementById('metric-cycle-reduction');
    const resetRoiBtn = document.getElementById('reset-roi-btn');

    const updateSliderTrackFill = (slider) => {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const val = parseFloat(slider.value) || 0;
        const percent = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--slider-fill', `${percent.toFixed(1)}%`);
    };

    if (empSlider && invSlider) {
        const updateROI = () => {
            const emp = parseInt(empSlider.value, 10);
            const inv = parseInt(invSlider.value, 10);

            updateSliderTrackFill(empSlider);
            updateSliderTrackFill(invSlider);

            if (empVal) empVal.textContent = emp;
            if (invVal) invVal.textContent = inv;

            const hoursSaved = Math.round(emp * 0.25 + inv * 0.08);
            const annualHours = hoursSaved * 12;
            const speedIndex = Math.min(99.9, (98.5 + (inv / 300)).toFixed(1));
            const cycleReduction = Math.min(55, Math.round(24 + (emp / 25) + (inv / 40)));

            if (metricHours) metricHours.textContent = `${hoursSaved} hrs`;
            if (metricSpeed) metricSpeed.textContent = `${speedIndex}%`;
            if (metricAnnualHours) metricAnnualHours.textContent = `${annualHours.toLocaleString()} hrs / yr`;
            if (metricCycleReduction) metricCycleReduction.textContent = `-${cycleReduction}% Faster Close`;
        };

        ['input', 'change'].forEach(evt => {
            empSlider.addEventListener(evt, updateROI);
            invSlider.addEventListener(evt, updateROI);
        });

        if (resetRoiBtn) {
            resetRoiBtn.addEventListener('click', () => {
                empSlider.value = 150;
                invSlider.value = 200;
                updateROI();
            });
        }

        updateROI();
    }

    // 10. Testimonials Carousel (Auto-Rotating 5s with Progress Line & Counter)
    const testCards = document.querySelectorAll('.testimonial-card');
    const prevTestBtn = document.getElementById('prev-test');
    const nextTestBtn = document.getElementById('next-test');
    const progressFill = document.getElementById('test-progress-fill');
    const testCounter = document.getElementById('testimonial-counter');
    const testContainer = document.querySelector('.testimonials-container');
    let currentTestIndex = 0;
    let autoRotateInterval = null;

    if (testCards.length > 0 && prevTestBtn && nextTestBtn) {
        const resetProgressBar = () => {
            if (!progressFill) return;
            progressFill.style.transition = 'none';
            progressFill.style.width = '0%';
            void progressFill.offsetWidth;
            progressFill.style.transition = 'width 5s linear';
            progressFill.style.width = '100%';
        };

        const showTestimonial = (index) => {
            testCards.forEach((card, i) => {
                card.classList.toggle('active', i === index);
            });
            if (testCounter) {
                const currentStr = String(index + 1).padStart(2, '0');
                const totalStr = String(testCards.length).padStart(2, '0');
                testCounter.textContent = `${currentStr} / ${totalStr}`;
            }
            resetProgressBar();
        };

        const nextSlide = () => {
            currentTestIndex = (currentTestIndex + 1) % testCards.length;
            showTestimonial(currentTestIndex);
        };

        const prevSlide = () => {
            currentTestIndex = (currentTestIndex - 1 + testCards.length) % testCards.length;
            showTestimonial(currentTestIndex);
        };

        const stopAutoRotate = () => {
            if (autoRotateInterval) {
                clearInterval(autoRotateInterval);
                autoRotateInterval = null;
            }
        };

        const startAutoRotate = () => {
            stopAutoRotate();
            resetProgressBar();
            autoRotateInterval = setInterval(nextSlide, 5000);
        };

        prevTestBtn.addEventListener('click', () => {
            prevSlide();
            startAutoRotate();
        });

        nextTestBtn.addEventListener('click', () => {
            nextSlide();
            startAutoRotate();
        });

        if (testContainer) {
            testContainer.addEventListener('mouseenter', () => {
                stopAutoRotate();
                if (progressFill) {
                    const computedWidth = window.getComputedStyle(progressFill).width;
                    progressFill.style.transition = 'none';
                    progressFill.style.width = computedWidth;
                }
            });
            testContainer.addEventListener('mouseleave', () => {
                startAutoRotate();
            });
        }

        startAutoRotate();
    }

    // Start 10-Second Auto Jump & Vertical Progress on load
    startAutoJumpMode();
});
