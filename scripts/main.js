document.addEventListener('DOMContentLoaded', function () {
  // Particle animation
  const particlesCanvas = document.getElementById('particles');
  if (particlesCanvas) {
    const ctx = particlesCanvas.getContext('2d');
    const preferReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles = [];
    const mouse = { x: null, y: null };

    function resize() {
      particlesCanvas.width = particlesCanvas.offsetWidth;
      particlesCanvas.height = particlesCanvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    if (!preferReduced) {
      const count = Math.min(70, Math.floor(window.innerWidth / 22));

      function spawn() {
        particles = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * particlesCanvas.width,
            y: Math.random() * particlesCanvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 2 + 0.5,
          });
        }
      }
      spawn();
      window.addEventListener('resize', spawn);

      window.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      });

      function draw() {
        ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
        particles.forEach(function (p) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > particlesCanvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > particlesCanvas.height) p.vy *= -1;
          var dist = function (d) {
            return Math.sqrt(Math.pow(mouse.x - d.x, 2) + Math.pow(mouse.y - d.y, 2));
          };
          if (mouse.x !== null && dist(p) < 130) {
            p.x += (mouse.x - p.x) * 0.01;
            p.y += (mouse.y - p.y) * 0.01;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
          ctx.fill();
        });

        for (var i = 0; i < particles.length; i++) {
          for (var j = i + 1; j < particles.length; j++) {
            var a = particles[i], b = particles[j];
            var dx = a.x - b.x, dy = a.y - b.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            if (d < 110) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = 'rgba(96, 165, 250, ' + (0.25 * (1 - d / 110)) + ')';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    }
  }

  // Skill bar animation
  var skillObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar').forEach(function (bar) {
          bar.style.width = bar.getAttribute('data-width') || bar.style.width;
        });
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-bar').forEach(function (bar) {
    bar.setAttribute('data-width', bar.style.width);
    bar.style.width = '0';
  });

  var habilidades = document.querySelector('#habilidades');
  if (habilidades) skillObserver.observe(habilidades);

  // Dynamic age
  function calcularIdade(dataNasc) {
    var hoje = new Date();
    var nasci = new Date(dataNasc);
    var idade = hoje.getFullYear() - nasci.getFullYear();
    var mes = hoje.getMonth() - nasci.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasci.getDate())) idade--;
    return idade;
  }

  var heroAge = document.getElementById('hero-age');
  var sobreAge = document.getElementById('sobre-age');
  if (heroAge) heroAge.textContent = calcularIdade('1989-02-11');
  if (sobreAge) sobreAge.textContent = calcularIdade('1989-02-11');

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  var menuBtn = document.getElementById('menuBtn');
  var closeMenuBtn = document.getElementById('closeMenuBtn');
  var mobileMenu = document.getElementById('mobileMenu');

  function openMenu() { mobileMenu.classList.remove('hidden'); }
  function closeMenu() { mobileMenu.classList.add('hidden'); }

  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // Copy email
  var copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText('edufms@gmail.com');
        var msg = document.getElementById('copyMsg');
        msg.classList.remove('hidden');
        setTimeout(function () { msg.classList.add('hidden'); }, 2000);
      } catch (_) {
        alert('Nao foi possivel copiar. Copie manualmente: edufms@gmail.com');
      }
    });
  }

  // Back to top
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('show', window.scrollY > 400);
    });
  }

  // Fade-in cards
  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card').forEach(function (el) {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
  });

  // Contact form
  var contactForm = document.getElementById('contactForm');
  var submitBtn = document.getElementById('submitBtn');
  var submitText = document.getElementById('submitText');
  var spinner = document.getElementById('spinner');
  var formStatus = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitText.textContent = 'Enviando';
      spinner.style.display = 'inline-block';
      formStatus.classList.add('hidden');

      try {
        var data = new FormData(contactForm);
        var response = await fetch(contactForm.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          formStatus.textContent = 'Mensagem enviada com sucesso!';
          formStatus.className = 'text-sm mt-4 px-4 py-2 rounded-md bg-green-600/30 text-green-300 border border-green-500/50';
          contactForm.reset();
        } else {
          formStatus.textContent = 'Erro ao enviar. Tente novamente.';
          formStatus.className = 'text-sm mt-4 px-4 py-2 rounded-md bg-red-600/30 text-red-300 border border-red-500/50';
        }
      } catch (_) {
        formStatus.textContent = 'Erro de conexao. Tente novamente.';
        formStatus.className = 'text-sm mt-4 px-4 py-2 rounded-md bg-red-600/30 text-red-300 border border-red-500/50';
      }
      formStatus.classList.remove('hidden');
      submitBtn.disabled = false;
      submitText.textContent = 'Enviar Mensagem';
      spinner.style.display = 'none';
    });
  }
});
