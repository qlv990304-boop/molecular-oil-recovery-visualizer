import React, { useEffect, useRef } from 'react';
import { SimulationConfig } from '../types';

interface VisualPanelProps {
  config: SimulationConfig | null;
  isLoading: boolean;
  label?: string;
  description?: string;
}

// --- Rock / Terrain Generation ---
class RockWall {
  points: {x: number, y: number}[] = [];
  position: 'top' | 'bottom';
  heightMap: number[] = [];

  constructor(width: number, height: number, position: 'top' | 'bottom', config: SimulationConfig) {
    this.position = position;
    const segmentWidth = 10;
    const segments = Math.ceil(width / segmentWidth) + 2;
    
    // Default base height - Narrow channels
    let maxRockHeight = height * 0.3; 

    // Custom Geometry based on mechanism
    if (config.mechanism === 'tension') {
      // Very narrow bottleneck
      maxRockHeight = height * 0.44; 
    } else if (config.mechanism === 'wettability') {
      // Flat surface but narrow channel
      maxRockHeight = height * 0.32; 
    } else if (config.mechanism === 'emulsification') {
      // Narrow channel
      maxRockHeight = height * 0.28;
    }

    this.points = [];
    if (position === 'top') {
      this.points.push({x: 0, y: 0});
    } else {
      this.points.push({x: 0, y: height});
    }

    for (let i = 0; i < segments; i++) {
      const x = i * segmentWidth;
      let y = maxRockHeight;

      // Add noise
      if (config.mechanism !== 'wettability') {
         y += Math.sin(i * 0.3) * 5 + Math.random() * 5;
      } else {
         y += Math.sin(i * 0.1) * 2;
      }
      
      // TENSION MECHANISM: Throats
      if (config.mechanism === 'tension') {
        const centerDist = Math.abs(width/2 - x);
        const throatWidth = 50;
        if (centerDist < throatWidth) {
           y = height * 0.44; 
        } else if (centerDist < throatWidth + 100) {
           y = height * 0.2; 
        } else {
           y = height * 0.1; 
        }
      }

      if (position === 'bottom') {
        y = height - y;
      }
      
      this.points.push({x, y});
      for(let k=0; k<segmentWidth; k++) {
        this.heightMap[Math.floor(x + k)] = y;
      }
    }

    if (position === 'top') {
      this.points.push({x: width, y: 0});
    } else {
      this.points.push({x: width, y: height});
    }
  }

  draw(ctx: CanvasRenderingContext2D, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.stroke();
  }

  checkCollision(x: number, y: number, radius: number): boolean {
    const checkX = Math.floor(x);
    if (checkX < 0 || checkX >= this.heightMap.length) return false;
    const wallY = this.heightMap[checkX];
    if (wallY === undefined) return false;
    
    if (this.position === 'top') {
      return (y - radius) < wallY;
    } else {
      return (y + radius) > wallY;
    }
  }

  getY(x: number): number {
    const checkX = Math.floor(x);
    if (checkX < 0 || checkX >= this.heightMap.length) return this.position === 'top' ? 0 : 9999;
    return this.heightMap[checkX];
  }
}

// --- Particle System ---
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'oil' | 'surfactant' | 'tiny-oil';
  
  // State
  isStuck: boolean = false; 
  health: number = 100; // For emulsification durability
  deformationX: number = 1; 
  deformationY: number = 1;
  wallFilm: boolean = false; 
  hitFlash: number = 0; 
  isDead: boolean = false; // To remove particles
  
  // Tension Mechanism State
  attachedTo: Particle | null = null;
  angleOnOil: number = 0;
  
  constructor(w: number, h: number, type: 'oil' | 'surfactant' | 'tiny-oil', config: SimulationConfig, topWall: RockWall, bottomWall: RockWall) {
    this.type = type;
    this.x = Math.random() * (w * 0.3); 
    
    if (type === 'oil') {
      // OVERRIDE COLOR for better visibility (Amber/Gold)
      this.color = '#F59E0B'; 
      this.radius = 15 + Math.random() * 5;

      if (config.mechanism === 'wettability') {
        this.x = 50 + Math.random() * (w - 100); 
        const wallY = bottomWall.getY(this.x);
        this.y = wallY - this.radius + 2; 
        this.isStuck = true;
        this.vx = 0;
        this.vy = 0;
      } else if (config.mechanism === 'tension') {
        this.radius = 30 + Math.random() * 5;
        this.y = h / 2;
        this.vx = config.flowSpeed * 0.3;
        this.vy = 0;
      } else {
        // Emulsification: MASSIVE drops
        this.radius = 48; // Significantly larger
        this.health = 50; // High health to survive initial attacks
        this.y = h/2 + (Math.random()-0.5) * 40; 
        this.vx = config.flowSpeed * 0.1; // SLOWER moving
        this.vy = 0;
      }

    } else if (type === 'surfactant') {
      this.radius = 2.5;
      this.color = config.surfactantColor;
      this.x = Math.random() * w; 
      this.y = Math.random() * h;
      this.vx = config.flowSpeed * (0.8 + Math.random() * 0.4);
      this.vy = (Math.random() - 0.5) * config.turbulence * 10;
      
      // WETTABILITY: Start TIGHTLY in CENTER, avoid walls initially
      if (config.mechanism === 'wettability') {
         // Center channel distribution (tight strip in middle)
         this.y = (h * 0.5) + (Math.random() - 0.5) * (h * 0.1);
         // Increase vertical velocity slightly so they eventually hit walls, but start clean
         this.vy = (Math.random() - 0.5) * 4.0; 
      }
      
      if (config.mechanism === 'tension') {
         this.x = Math.random() * (w * 0.5);
      }
    } else {
      // Tiny oil / Emulsified droplets (DEFAULT SMALL SIZE)
      this.radius = 3 + Math.random() * 3; // Much smaller default (3-6px)
      this.color = '#F59E0B'; // Match the lighter oil color
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
    }
  }

  update(w: number, h: number, config: SimulationConfig, particles: Particle[], topWall: RockWall, bottomWall: RockWall) {
    if (this.isDead) return;
    if (this.hitFlash > 0) this.hitFlash--;
    if (this.wallFilm) return; 

    // TENSION: Surfactant seeking
    if (config.mechanism === 'tension' && this.type === 'surfactant') {
       if (this.attachedTo && (this.attachedTo.isDead || this.attachedTo.x > w + 50)) {
           this.attachedTo = null;
       }
       
       if (this.attachedTo) {
             const oil = this.attachedTo;
             const a = oil.radius * oil.deformationX + 2;
             const b = oil.radius * oil.deformationY + 2;
             this.x = oil.x + a * Math.cos(this.angleOnOil);
             this.y = oil.y + b * Math.sin(this.angleOnOil);
             this.angleOnOil += 0.05; 
             return; 
       } else {
          // Seek nearest oil
          let nearest: Particle | null = null;
          let minDist = 1000;
          particles.forEach(p => {
             if (p.type === 'oil' && !p.isDead) {
                const d = Math.sqrt((p.x - this.x)**2 + (p.y - this.y)**2);
                if (d < minDist) { minDist = d; nearest = p; }
             }
          });

          if (nearest && minDist < 300) {
             const oil = nearest as Particle;
             const dx = oil.x - this.x;
             const dy = oil.y - this.y;
             this.vx += dx * 0.005; 
             this.vy += dy * 0.005;
             this.vx *= 0.9;
             this.vy *= 0.9;
             
             if (minDist < oil.radius + 10) {
                this.attachedTo = oil;
                this.angleOnOil = Math.atan2(this.y - oil.y, this.x - oil.x);
             }
          }
       }
    }

    // Standard Movement
    if (!this.isStuck && !this.attachedTo) {
      this.x += this.vx;
      this.y += this.vy;
    }

    // Boundary Loop
    if (this.x > w + 50) {
      this.x = -150; // Reset further back to flow in smoothly
      this.deformationX = 1;
      this.deformationY = 1;
      this.attachedTo = null;
      this.hitFlash = 0;
      this.isDead = false;
      this.health = 50; // Reset Health
      
      if (this.type === 'oil') {
         if (config.mechanism === 'wettability') {
            this.x = 50 + Math.random() * (w - 100);
            this.y = bottomWall.getY(this.x) - this.radius + 2;
            this.isStuck = true;
            this.vx = 0;
         } else if (config.mechanism === 'tension') {
            this.radius = 30 + Math.random() * 5;
            this.y = h/2;
            this.vx = config.flowSpeed * 0.3;
         } else if (config.mechanism === 'emulsification') {
            this.radius = 48; // Reset size big
            this.health = 50; // Reset health
            this.y = h/2 + (Math.random()-0.5) * 40;
            this.vx = config.flowSpeed * 0.1; // Slow
         }
      } else if (this.type === 'surfactant') {
         this.y = Math.random() * h;
         this.x = -Math.random() * 50; // Scatter enter
         if (config.mechanism === 'wettability') {
            // Reset to center to repeat the "process"
            this.y = (h * 0.5) + (Math.random() - 0.5) * (h * 0.1);
            this.vy = (Math.random() - 0.5) * 4.0;
         }
      }
    }

    // Wall Collision
    if (!this.isStuck && !this.attachedTo) {
      if (topWall.checkCollision(this.x, this.y, this.radius)) {
         this.y += 2; 
         this.vy = Math.abs(this.vy) * 0.5;
         // Wettability: Probability to stick
         if (config.mechanism === 'wettability' && this.type === 'surfactant' && Math.random() > 0.15) {
            this.wallFilm = true;
            this.y = topWall.getY(this.x) + this.radius;
         }
      }
      if (bottomWall.checkCollision(this.x, this.y, this.radius)) {
         this.y -= 2;
         this.vy = -Math.abs(this.vy) * 0.5;
         if (config.mechanism === 'wettability' && this.type === 'surfactant' && Math.random() > 0.15) {
            this.wallFilm = true;
            this.y = bottomWall.getY(this.x) - this.radius;
         }
      }
    }

    // --- SPECIFIC MECHANISMS ---

    // 1. WETTABILITY
    if (config.mechanism === 'wettability') {
      if (this.type === 'oil' && this.isStuck) {
         let filmCount = 0;
         particles.forEach(p => {
            if (p.type === 'surfactant' && p.wallFilm) {
               const dist = Math.abs(p.x - this.x);
               if (dist < this.radius + 15) filmCount++;
            }
         });
         
         if (filmCount > 5) {
            this.x += (Math.random()-0.5) * 2.0;
            this.y += (Math.random()-0.5) * 0.5;
         }

         if (filmCount > 30) {
            this.isStuck = false;
            this.vx = config.flowSpeed * 0.3;
            this.vy = -0.5;
            this.y -= 2;
         }
      }
    }

    // 2. TENSION
    if (config.mechanism === 'tension' && this.type === 'oil') {
       const throatX = w/2;
       const distToThroat = throatX - this.x;
       
       if (distToThroat > 0 && distToThroat < 120) {
          this.vx = config.flowSpeed * 0.15;
       } else if (distToThroat <= 0 && distToThroat > -100) {
          this.vx = config.flowSpeed * 0.6;
       } else {
          this.vx = config.flowSpeed * 0.3;
       }
       
       if (Math.abs(distToThroat) < 100) {
          const normalizedDist = Math.abs(distToThroat) / 100;
          const squeezeIntensity = Math.cos(normalizedDist * Math.PI / 2);
          
          this.deformationX = 1 + squeezeIntensity * 2.5; 
          this.deformationY = 1 / (1 + squeezeIntensity * 1.5); 
       } else {
          this.deformationX = this.deformationX * 0.9 + 1 * 0.1;
          this.deformationY = this.deformationY * 0.9 + 1 * 0.1;
       }
    }

    // 3. EMULSIFICATION
    if (config.mechanism === 'emulsification' && this.type === 'oil') {
       particles.forEach(p => {
          if (p.type === 'surfactant' && !p.wallFilm) {
             const dx = p.x - this.x;
             const dy = p.y - this.y;
             const dist = Math.sqrt(dx*dx + dy*dy);
             
             if (dist < this.radius + p.radius) {
                // Bounce surfactant
                p.vx = -Math.abs(p.vx); 
                p.x -= 2; 
                
                // Attack Oil
                this.health -= 1; // Decrease health slowly
                this.hitFlash = 3; 
                
                // Visual shake
                this.x += (Math.random()-0.5) * 1.5;
                this.y += (Math.random()-0.5) * 1.5;

                // BREAK APART LOGIC
                if (this.health <= 0) { 
                   this.isDead = true; // Kill the big drop
                   
                   // Spawn 8-12 smaller droplets
                   for(let k=0; k<10; k++) {
                      const tiny = new Particle(w, h, 'tiny-oil', config, topWall, bottomWall);
                      tiny.x = this.x + (Math.random()-0.5) * this.radius;
                      tiny.y = this.y + (Math.random()-0.5) * this.radius;
                      // MAKE THEM VERY SMALL for contrast
                      tiny.radius = 3 + Math.random() * 3; 
                      // Move them away, but not too fast so we can see them
                      tiny.vx = config.flowSpeed * 0.8 + Math.random(); 
                      tiny.vy = (Math.random()-0.5)*4;
                      particles.push(tiny);
                   }
                }
             }
          }
       });
    }
    
    if (this.type === 'tiny-oil') {
       this.x += this.vx;
       this.y += this.vy;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead || this.x < -200) return; // Keep rendering even if slightly off screen left

    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'oil') {
      ctx.scale(this.deformationX, this.deformationY);
      
      if (this.isStuck) {
         ctx.beginPath();
         ctx.arc(0, 0, this.radius, Math.PI * 0.1, Math.PI * 0.9, true); 
         ctx.closePath();
      } else {
         ctx.beginPath();
         ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      }
      
      ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color; // Flash white
      ctx.fill();
      
      // Stronger Highlight for visibility
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(-this.radius*0.3, -this.radius*0.3, this.radius*0.35, 0, Math.PI*2);
      ctx.fill();

    } else if (this.type === 'surfactant') {
      ctx.fillStyle = this.color;
      
      if (this.wallFilm) {
         ctx.fillRect(-this.radius*2, -2, this.radius*4 + 2, 4);
      } else {
         ctx.beginPath();
         ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
         ctx.fill();
         ctx.strokeStyle = this.color;
         ctx.beginPath();
         ctx.moveTo(0,0);
         ctx.lineTo(-this.radius*3, 0);
         ctx.stroke();
      }
    } else if (this.type === 'tiny-oil') {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.8; // More visible
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      // Highlight on tiny oil too
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(-this.radius*0.3, -this.radius*0.3, this.radius*0.3, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export const VisualPanel: React.FC<VisualPanelProps> = ({ config, isLoading, label, description }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const particlesRef = useRef<Particle[]>([]);
  const topWallRef = useRef<RockWall | null>(null);
  const bottomWallRef = useRef<RockWall | null>(null);

  useEffect(() => {
    if (!config || isLoading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initScene = () => {
      topWallRef.current = new RockWall(canvas.width, canvas.height, 'top', config);
      bottomWallRef.current = new RockWall(canvas.width, canvas.height, 'bottom', config);

      particlesRef.current = [];
      
      // Oil Setup
      let oilCount = 0;
      if (config.mechanism === 'tension') oilCount = 2;
      else if (config.mechanism === 'emulsification') oilCount = 2; // 2 distinct large drops
      else oilCount = 6;

      for (let i = 0; i < oilCount; i++) {
        const p = new Particle(canvas.width, canvas.height, 'oil', config, topWallRef.current, bottomWallRef.current);
        if (config.mechanism === 'tension') p.x = i * -150 + 50; 
        if (config.mechanism === 'emulsification') p.x = -100 - (i * 200); // Start OFF SCREEN LEFT
        particlesRef.current.push(p);
      }
      
      // Surfactant Setup
      const surfCount = config.mechanism === 'wettability' ? 800 : (config.mechanism === 'tension' ? 120 : 150);
      for (let i = 0; i < surfCount; i++) {
        particlesRef.current.push(new Particle(canvas.width, canvas.height, 'surfactant', config, topWallRef.current, bottomWallRef.current));
      }
    };

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        initScene();
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      if (!ctx || !topWallRef.current || !bottomWallRef.current) return;

      // Clear
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = config.waterColor + "15";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Walls
      topWallRef.current.draw(ctx, config.rockColor);
      bottomWallRef.current.draw(ctx, config.rockColor);

      // Clean up Dead/Off-screen
      // Note: We check x > -250 because we spawn emulsification oil at -100 to -300
      particlesRef.current = particlesRef.current.filter(p => !p.isDead && p.x > -400);

      // Update & Draw
      particlesRef.current.forEach(p => {
        p.update(canvas.width, canvas.height, config, particlesRef.current, topWallRef.current!, bottomWallRef.current!);
        p.draw(ctx);
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [config, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-xl ring-1 ring-slate-800">
      {/* Header */}
      <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-bold text-white tracking-wide flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isLoading ? 'bg-slate-500' : 'bg-green-400 animate-pulse'}`}></span>
          {label || "Simulation"}
        </h3>
      </div>

      {/* Canvas Container */}
      <div className="relative flex-grow min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : config ? (
           <canvas ref={canvasRef} className="w-full h-full block" />
        ) : (
           <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-600 text-xs">
             Waiting for configuration...
           </div>
        )}
        
        {/* Caption Overlay */}
        {description && !isLoading && config && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-xs text-slate-300 border-t border-white/10">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};