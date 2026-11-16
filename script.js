// Import Firebase v10 modular SDK libraries from official CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase project credentials configuration (Replace with your actual keys from Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase App instance
const app = initializeApp(firebaseConfig);
// Get reference to the Firestore Database instance
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  // --- CUSTOM CURSOR ---
  const cursor = document.getElementById('cursor');
  const trail = document.getElementById('cursorTrail');
  let mx = 0, my = 0, tx = 0, ty = 0;
  let hasMoved = false;

  if (cursor && trail) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; 
      my = e.clientY;
      cursor.style.left = mx - 6 + 'px';
      cursor.style.top = my - 6 + 'px';
      
      // Show cursor on first movement
      if (!hasMoved) {
        cursor.style.opacity = '1';
        trail.style.opacity = '0.5';
        hasMoved = true;
      }
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      trail.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      if (hasMoved) {
        cursor.style.opacity = '1';
        trail.style.opacity = '0.5';
      }
    });

    function animTrail() {
      tx += (mx - tx) * 0.12;
      ty += (my - ty) * 0.12;
      trail.style.left = tx - 18 + 'px';
      trail.style.top = ty - 18 + 'px';
      requestAnimationFrame(animTrail);
    }
    animTrail();

    // Scale up custom cursor elements on hover of interactive targets
    const interactiveTargets = document.querySelectorAll('a, button, .skill-tag, .cert-card, .project-card, .contact-link, .nav-toggle');
    interactiveTargets.forEach(el => {
      el.addEventListener('mouseenter', () => { 
        cursor.style.transform = 'scale(2)'; 
        trail.style.transform = 'scale(1.5)'; 
        trail.style.borderColor = 'var(--cyan)';
      });
      el.addEventListener('mouseleave', () => { 
        cursor.style.transform = 'scale(1)'; 
        trail.style.transform = 'scale(1)'; 
        trail.style.borderColor = 'var(--cyan)';
      });
    });
  }

  // --- MOBILE NAVIGATION BURGER MENU ---
  const navToggle = document.getElementById('navToggle');
  const navLinksList = document.getElementById('navLinks');
  
  if (navToggle && navLinksList) {
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('active');
      navLinksList.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const links = navLinksList.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinksList.classList.remove('active');
      });
    });

    // Close menu when clicking outside of the navbar
    document.addEventListener('click', (e) => {
      if (!navLinksList.contains(e.target) && !navToggle.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinksList.classList.remove('active');
      }
    });
  }

  // --- SCROLL REVEAL (INTERSECTION OBSERVER) ---
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { 
        if (e.isIntersecting) {
          e.target.classList.add('visible'); 
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(r => observer.observe(r));
  }

  // --- SKILL BARS FILL ANIMATION (INTERSECTION OBSERVER) ---
  const skillCategories = document.querySelectorAll('.skill-category');
  if (skillCategories.length > 0) {
    const barObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width + '%';
          });
        }
      });
    }, { threshold: 0.3 });
    skillCategories.forEach(c => barObserver.observe(c));
  }

  // --- NAV ACTIVE STATE ON SCROLL ---
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  if (sections.length > 0 && navLinks.length > 0) {
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 200) {
          current = s.getAttribute('id');
        }
      });
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--cyan)' : '';
      });
    });
  }

  // --- FORM VALIDATION & FIRESTORE SUBMISSION ---
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const btn = contactForm.querySelector('.form-submit');
      const nameEl = document.getElementById('contact-name');
      const emailEl = document.getElementById('contact-email');
      const subjectEl = document.getElementById('contact-subject');
      const messageEl = document.getElementById('contact-message');

      let isValid = true;
      const inputs = [nameEl, emailEl, subjectEl, messageEl];

      // Remove any leftover validation error highlights
      inputs.forEach(input => {
        input.classList.remove('validation-error');
      });

      // Check if any fields are empty
      inputs.forEach(input => {
        if (!input.value.trim()) {
          input.classList.add('validation-error');
          isValid = false;
        }
      });

      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailEl.value.trim() && !emailPattern.test(emailEl.value.trim())) {
        emailEl.classList.add('validation-error');
        isValid = false;
      }

      if (!isValid) {
        const originalText = btn.textContent;
        btn.textContent = '❌ Please fill all fields correctly';
        btn.style.background = 'var(--pink)';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = 'var(--cyan)';
          btn.style.color = 'var(--bg)';
        }, 3000);
        return;
      }

      // Disable button to prevent accidental double-submits
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = '⏳ Sending Message...';

      try {
        // Save data directly to the "contacts" collection in Firestore
        await addDoc(collection(db, "contacts"), {
          name: nameEl.value.trim(),
          email: emailEl.value.trim(),
          subject: subjectEl.value.trim(),
          message: messageEl.value.trim(),
          timestamp: serverTimestamp() // Saves exact server-time database entry
        });

        // Update submit button to showcase a success state
        btn.textContent = '✓ Message Sent!';
        btn.style.background = '#00f5e4';
        btn.style.color = 'var(--bg)';

        // Clear input fields on success
        inputs.forEach(input => {
          input.value = '';
        });
      } catch (error) {
        console.error("Error writing contact document: ", error);
        btn.textContent = '❌ Database Error';
        btn.style.background = 'var(--pink)';
        btn.style.color = '#fff';
      } finally {
        // Re-enable and reset the submit button status after 3 seconds
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Send Message →';
          btn.style.background = 'var(--cyan)';
          btn.style.color = 'var(--bg)';
        }, 3000);
      }
    });
  }
});
