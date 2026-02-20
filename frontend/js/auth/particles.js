function initAuthParticles() {
  const canvas = document.getElementById('auth-particles');
  if (!canvas) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  let width = 0;
  let height = 0;
  let particles = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.65 + 0.3,
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${particle.o})`;
      context.fill();

      particle.x += particle.dx;
      particle.y += particle.dy;

      if (particle.x < 0 || particle.x > width) particle.dx *= -1;
      if (particle.y < 0 || particle.y > height) particle.dy *= -1;
    });

    requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

initAuthParticles();
