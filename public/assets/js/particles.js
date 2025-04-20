export function initParticles() {
  // Check if tsParticles is loaded
  if (typeof tsParticles === 'undefined') {
    console.error('tsParticles not loaded. Cannot initialize particles.');
    return;
  }

  tsParticles.load("particles-js", {
    particles: {
      number: { value: 30 },
      color: { value: ["#3B82F6", "#8B5CF6", "#EC4899"] },
      shape: { type: "circle" },
      opacity: {
        value: 0.3,
        random: true,
        anim: {
          enable: true,
          speed: 0.5,
          opacity_min: 0.1,
          sync: false
        }
      },
      size: {
        value: 3,
        random: true,
        anim: {
          enable: true,
          speed: 2,
          size_min: 0.1,
          sync: false
        }
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: "none",
        random: true,
        straight: false,
        outModes: "out",
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200
        }
      },
      links: {
        enable: true,
        distance: 150,
        color: "#8B5CF6",
        opacity: 0.12,
        width: 1,
        triangles: {
          enable: true,
          opacity: 0.05
        }
      }
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: ["grab", "bubble"]
        },
        onClick: {
          enable: true,
          mode: "push"
        }
      },
      modes: {
        grab: {
          distance: 200,
          links: { opacity: 0.25 }
        },
        bubble: {
          distance: 200,
          size: 6,
          duration: 2,
          opacity: 0.6
        },
        push: { particles_nb: 3 }
      }
    }
  });
} 