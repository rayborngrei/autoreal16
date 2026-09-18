/* ============================================
   АВТОРЕАЛ16 — JavaScript
   Premium Automotive Redesign
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  
  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  const header = document.getElementById('header');
  
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  
  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  const burger = document.querySelector('.burger');
  const mobileNav = document.getElementById('mobileNav');
  
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', !isOpen);
      mobileNav.classList.toggle('open');
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });
    
    // Close on link click
    mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    
    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
  
  // ============================================
  // CAR FILTER BY MAKE
  // ============================================
  const chips = document.querySelectorAll('[data-make-filter]');
  const cars = document.querySelectorAll('[data-card]');
  const carsEmpty = document.querySelector('[data-cars-empty]');
  
  if (chips.length && cars.length) {
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Update active state
        chips.forEach(c => c.classList.remove('chip--active'));
        chip.classList.add('chip--active');
        
        const make = chip.getAttribute('data-make-filter');
        let visibleCount = 0;
        
        cars.forEach(car => {
          const carMake = car.getAttribute('data-make');
          
          if (!make || carMake === make) {
            car.style.display = 'block';
            car.style.opacity = '0';
            setTimeout(() => {
              car.style.opacity = '1';
              car.style.transition = 'opacity 0.3s ease';
            }, 50);
            visibleCount++;
          } else {
            car.style.display = 'none';
          }
        });
        
        // Show empty state if needed
        if (carsEmpty) {
          carsEmpty.hidden = visibleCount > 0;
        }
      });
    });
  }
  
  // ============================================
  // CREDIT CALCULATOR
  // ============================================
  const calcInputs = document.querySelectorAll('[data-calc-input]');
  const calcRanges = document.querySelectorAll('[data-calc-range]');
  const paymentDisplay = document.querySelector('[data-payment]');
  
  if (calcInputs.length && calcRanges.length && paymentDisplay) {
    const RATE = 0.129; // 12.9% annual
    
    const formatMoney = (num) => {
      return num.toLocaleString('ru-RU') + ' ₽';
    };
    
    const calculatePayment = () => {
      const price = parseInt(document.querySelector('[data-calc-range="price"]').value) || 2500000;
      const initial = parseInt(document.querySelector('[data-calc-range="initial"]').value) || 500000;
      const termYears = parseInt(document.querySelector('[data-calc-range="term"]').value) || 5;
      
      const loanAmount = price - initial;
      const monthlyRate = RATE / 12;
      const termMonths = termYears * 12;
      
      // Annuity formula
      const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                      (Math.pow(1 + monthlyRate, termMonths) - 1);
      
      // Update display inputs
      document.querySelector('[data-calc-input="price"]').value = formatMoney(price);
      document.querySelector('[data-calc-input="initial"]').value = formatMoney(initial);
      document.querySelector('[data-calc-input="term"]').value = termYears + ' лет';
      
      // Update payment display
      paymentDisplay.textContent = formatMoney(Math.round(payment));
    };
    
    // Sync range and input
    calcRanges.forEach(range => {
      range.addEventListener('input', () => {
        calculatePayment();
      });
    });
    
    // Initial calculation
    calculatePayment();
  }
  
  // ============================================
  // FAVORITE BUTTONS
  // ============================================
  const favoriteButtons = document.querySelectorAll('.car-card__favorite');
  
  favoriteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const isPressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', !isPressed);
      
      // Visual feedback
      btn.classList.toggle('active');
    });
  });
  
  // ============================================
  // FORM HANDLING
  // ============================================
  const forms = document.querySelectorAll('[data-form]');
  
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const errorEl = form.querySelector('.form-error');
      const successEl = form.querySelector('.form-success');
      
      // Hide previous messages
      if (errorEl) errorEl.style.display = 'none';
      if (successEl) successEl.style.display = 'none';
      
      // Loading state
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6"/></svg> Отправка...';
      
      // Simulate API call (replace with real backend)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      
      if (successEl) {
        successEl.style.display = 'flex';
        form.reset();
        
        // Hide success after 5 seconds
        setTimeout(() => {
          successEl.style.display = 'none';
        }, 5000);
      }
    });
  });
  
  // Phone input formatting
  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  
  phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      
      if (value.startsWith('7')) {
        value = value.slice(1);
      }
      
      if (value.length > 0) {
        value = '+7 (' + value.slice(0, 3);
      }
      
      if (value.length > 6) {
        value = value.slice(0, 6) + ') ' + value.slice(6, 9);
      }
      
      if (value.length > 10) {
        value = value.slice(0, 10) + '-' + value.slice(10, 12);
      }
      
      if (value.length > 12) {
        value = value.slice(0, 12) + '-' + value.slice(12, 14);
      }
      
      e.target.value = value;
    });
  });
  
  // ============================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // ============================================
  // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  // ============================================
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const fadeElements = document.querySelectorAll('.car-card, .why-item, .review-card, .faq-item');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-up');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    fadeElements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }
  
  // ============================================
  // LIGHTBOX FOR CAR IMAGES (Future Enhancement)
  // ============================================
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-image');
  const lightboxClose = document.querySelector('.lightbox-close');
  
  if (lightbox && lightboxImg && lightboxClose) {
    const openLightbox = (src, alt) => {
      lightboxImg.src = src;
      lightboxImg.alt = alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    };
    
    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
    
    // Add click handlers to car images (when real images are added)
    document.querySelectorAll('.car-card__image').forEach(imgContainer => {
      imgContainer.addEventListener('click', () => {
        // In production, this would use the actual image src
        // openLightbox(imgSrc, imgAlt);
      });
    });
  }
  
  // ============================================
  // SEARCH FORM SUBMIT (Prevent Default for Demo)
  // ============================================
  const searchForm = document.querySelector('[data-search-form]');
  
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // In production, this would redirect to catalog with filters
      const formData = new FormData(searchForm);
      const params = new URLSearchParams(formData);
      
      // Scroll to cars section
      document.querySelector('#stock')?.scrollIntoView({ behavior: 'smooth' });
      
      console.log('Search params:', Object.fromEntries(formData));
    });
  }
  
  // ============================================
  // CHIP SCROLL ON MOBILE
  // ============================================
  const chipsContainer = document.querySelector('.chips');
  
  if (chipsContainer) {
    let isDown = false;
    let startX;
    let scrollLeft;
    
    chipsContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - chipsContainer.offsetLeft;
      scrollLeft = chipsContainer.scrollLeft;
      chipsContainer.style.cursor = 'grabbing';
    });
    
    chipsContainer.addEventListener('mouseleave', () => {
      isDown = false;
      chipsContainer.style.cursor = 'grab';
    });
    
    chipsContainer.addEventListener('mouseup', () => {
      isDown = false;
      chipsContainer.style.cursor = 'grab';
    });
    
    chipsContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - chipsContainer.offsetLeft;
      const walk = (x - startX) * 2;
      chipsContainer.scrollLeft = scrollLeft - walk;
    });
  }
  
});

// ============================================
// UTILITY: Debounce Function
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// UTILITY: Throttle Function
// ============================================
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
