import Boids from 'boids';

export default function createFlies({ count, canvas, moreBoidData }) {
  const boids = Boids({
    boids: count,
    speedLimit: 3,
    // accelerationLimit: 5,
    attractors: [],
    // cohesionDistance: 200,
    // separationForce: 0.8
  });

  let first = true;
  function diffuse() {
    for (let i = 0; i < boids.boids.length; i++) {
      boids.boids[i][0] = Math.random() * canvas.width;
      boids.boids[i][1] = Math.random() * canvas.height;
    }
  }

  function update(draw) {
    boids.tick();
    if (first) {
      diffuse();
      first = false;
    }
    const boidData = boids.boids;

    for (let i = 0, l = boidData.length; i < l; i += 1) {
      const [x, y, vx, vy, ax, ay] = boidData[i];

      if (x < 0 || x > canvas.width) {
        boidData[i][2] = -vx;
        boidData[i][4] = -ax;
      }

      if (y < 0 || y > canvas.height) {
        boidData[i][3] = -vy;
        boidData[i][5] = -ay;
      }

      draw(x, y, moreBoidData[i] || null);
    }
  }

  return {
    update
  };
}
