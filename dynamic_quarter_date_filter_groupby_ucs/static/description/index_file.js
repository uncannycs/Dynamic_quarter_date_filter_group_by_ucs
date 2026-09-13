document.addEventListener("DOMContentLoaded", function () {
    // ----------------------------------------------------
    // 1. TABS SYSTEM
    // ----------------------------------------------------
    const tabLinks = document.querySelectorAll('.nav .nav-link, [data-bs-toggle="tab"], [data-toggle="tab"]');
    tabLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href') || this.getAttribute('data-bs-target') || this.getAttribute('data-target');
            if (!targetId) return;
            
            const parentNav = this.closest('.nav');
            if (parentNav) {
                parentNav.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                    navLink.setAttribute('aria-selected', 'false');
                });
            }
            
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            const tabPane = document.querySelector(targetId);
            if (tabPane) {
                const parentContent = tabPane.closest('.tab-content');
                if (parentContent) {
                    parentContent.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('show', 'active');
                    });
                }
                
                tabPane.classList.add('active');
                setTimeout(() => {
                    tabPane.classList.add('show');
                }, 10);
            }
        });
    });

    // ----------------------------------------------------
    // 2. CAROUSEL SYSTEM
    // ----------------------------------------------------
    const carousel = document.getElementById('demo');
    if (carousel) {
        const items = carousel.querySelectorAll('.carousel-item');
        const indicators = carousel.querySelectorAll('.carousel-indicators button, [data-bs-slide-to], [data-slide-to]');
        const prevBtn = carousel.querySelector('.carousel-control-prev');
        const nextBtn = carousel.querySelector('.carousel-control-next');
        let currentIndex = 0;
        let cycleInterval;

        function showSlide(index) {
            if (items.length === 0) return;
            
            if (index < 0) {
                currentIndex = items.length - 1;
            } else if (index >= items.length) {
                currentIndex = 0;
            } else {
                currentIndex = index;
            }

            items.forEach((item, idx) => {
                if (idx === currentIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            indicators.forEach((indicator, idx) => {
                if (idx === currentIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        }

        function startAutoplay() {
            stopAutoplay();
            cycleInterval = setInterval(() => {
                showSlide(currentIndex + 1);
            }, 5000);
        }

        function stopAutoplay() {
            if (cycleInterval) {
                clearInterval(cycleInterval);
            }
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showSlide(currentIndex - 1);
                startAutoplay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showSlide(currentIndex + 1);
                startAutoplay();
            });
        }

        indicators.forEach((indicator, idx) => {
            indicator.addEventListener('click', (e) => {
                e.preventDefault();
                showSlide(idx);
                startAutoplay();
            });
        });

        startAutoplay();
        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
    }

    // ----------------------------------------------------
    // 3. FAQ ACCORDION SYSTEM
    // ----------------------------------------------------
    const collapseToggles = document.querySelectorAll('[data-bs-toggle="collapse"], [data-toggle="collapse"]');
    collapseToggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetSelector = this.getAttribute('data-bs-target') || this.getAttribute('data-target') || this.getAttribute('href');
            if (!targetSelector) return;
            
            const targetPanel = document.querySelector(targetSelector);
            if (!targetPanel) return;

            const isCollapsed = targetPanel.classList.contains('show');
            const parentSelector = targetPanel.getAttribute('data-bs-parent') || targetPanel.getAttribute('data-parent');
            
            if (parentSelector) {
                const parent = document.querySelector(parentSelector);
                if (parent) {
                    parent.querySelectorAll('.collapse, .accordion-collapse').forEach(panel => {
                        if (panel !== targetPanel) {
                            panel.classList.remove('show');
                            const otherToggle = parent.querySelector(`[data-bs-target="#${panel.id}"], [data-target="#${panel.id}"], [href="#${panel.id}"]`);
                            if (otherToggle) {
                                otherToggle.classList.add('collapsed');
                                otherToggle.setAttribute('aria-expanded', 'false');
                            }
                        }
                    });
                }
            }

            if (isCollapsed) {
                targetPanel.classList.remove('show');
                this.classList.add('collapsed');
                this.setAttribute('aria-expanded', 'false');
            } else {
                targetPanel.classList.add('show');
                this.classList.remove('collapsed');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
});
