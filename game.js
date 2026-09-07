(()=>{
  const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
  const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),nextEl=document.getElementById('nextPiece');
  const overlay=document.getElementById('overlay'),finalEl=document.getElementById('finalScore'),guide=document.getElementById('guide');
  const imagePaths=[
    './res/raw-assets/ad/ad16ccdc-975e-4393-ae7b-8ac79c3795f2.png',
    './res/raw-assets/0c/0cbb3dbb-2a85-42a5-be21-9839611e5af7.png',
    './res/raw-assets/d0/d0c676e4-0956-4a03-90af-fee028cfabe4.png',
    './res/raw-assets/74/74237057-2880-4e1f-8a78-6d8ef00a1f5f.png',
    './res/raw-assets/13/132ded82-3e39-4e2e-bc34-fc934870f84c.png',
    './res/raw-assets/03/03c33f55-5932-4ff7-896b-814ba3a8edb8.png',
    './res/raw-assets/66/665a0ec9-6c43-4858-974c-025514f2a0e7.png',
    './res/raw-assets/84/84bc9d40-83d0-480c-b46a-3ef59e603e14.png',
    './res/raw-assets/5f/5fa0264d-acbf-4a7b-8923-c106ec3b9215.png',
    './res/raw-assets/56/564ba620-6a55-4cbe-a5a6-6fa3edd80151.png'
  ];
  const imgs=imagePaths.map(src=>{const im=new Image();im.src=src;return im});
  const radii=[19,23,28,34,41,49,58,68,79,92],points=[1,3,6,10,15,21,28,36,45,60];
  let balls=[],score=0,best=+(localStorage.mergeChibiBest||0),nextType=0,aimX=0,last=0,ended=false,canDrop=true,muted=false,overSince=0,dpr=1,W=0,H=0;
  bestEl.textContent=best;
  function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);aimX=aimX||W/2}
  addEventListener('resize',resize);resize();
  function rndType(){const p=Math.random();return p<.48?0:p<.79?1:p<.95?2:3}
  function setNext(){nextType=rndType();nextEl.src=imgs[nextType].src}
  function beep(freq=420,d=.06){if(muted)return;try{const ac=beep.ac||(beep.ac=new(window.AudioContext||window.webkitAudioContext)());const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.05,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch{}}
  function reset(){balls=[];score=0;ended=false;canDrop=true;overSince=0;scoreEl.textContent='0';overlay.classList.add('hidden');guide.classList.remove('hide');setNext()}
  function drop(){if(!canDrop||ended)return;guide.classList.add('hide');const r=radii[nextType];balls.push({x:Math.max(r,Math.min(W-r,aimX)),y:42,vx:0,vy:0,r,t:nextType,age:0,dead:false});beep(330);setNext();canDrop=false;setTimeout(()=>canDrop=true,430)}
  function inputX(e){const rect=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;aimX=Math.max(18,Math.min(W-18,p.clientX-rect.left))}
  canvas.addEventListener('pointermove',e=>{inputX(e)});canvas.addEventListener('pointerdown',e=>{inputX(e);canvas.setPointerCapture?.(e.pointerId)});canvas.addEventListener('pointerup',e=>{inputX(e);drop()});
  function merge(a,b){if(a.dead||b.dead||a.t!==b.t||a.t>=9||a.age<.12||b.age<.12)return false;a.dead=b.dead=true;const t=a.t+1,r=radii[t];balls.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:-1.8,r,t,age:0,dead:false});score+=points[t];scoreEl.textContent=score;beep(450+t*55,.09);return true}
  function step(dt){const sub=3,sdt=dt/sub;for(let z=0;z<sub;z++){
    for(const b of balls){if(b.dead)continue;b.age+=sdt;b.vy+=820*sdt;b.x+=b.vx*sdt;b.y+=b.vy*sdt;b.vx*=.997;if(b.x-b.r<0){b.x=b.r;b.vx=Math.abs(b.vx)*.48}if(b.x+b.r>W){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.48}if(b.y+b.r>H-8){b.y=H-8-b.r;b.vy=-Math.abs(b.vy)*.22;b.vx*=.92}}
    outer:for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j];if(a.dead||b.dead)continue;let dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy),min=a.r+b.r;if(dist>=min)continue;if(merge(a,b))continue outer;if(dist<.01){dx=.01;dist=.01}const nx=dx/dist,ny=dy/dist,over=min-dist;a.x-=nx*over/2;a.y-=ny*over/2;b.x+=nx*over/2;b.y+=ny*over/2;const rvx=b.vx-a.vx,rvy=b.vy-a.vy,vel=rvx*nx+rvy*ny;if(vel<0){const imp=-vel*.62;a.vx-=imp*nx;a.vy-=imp*ny;b.vx+=imp*nx;b.vy+=imp*ny}}
    balls=balls.filter(b=>!b.dead)
  }
  const danger=H*.19;const risky=balls.some(b=>b.age>1.5&&b.y-b.r<danger&&Math.abs(b.vy)<55);if(risky){if(!overSince)overSince=performance.now();if(performance.now()-overSince>2600)gameOver()}else overSince=0}
  function gameOver(){ended=true;finalEl.textContent=score;if(score>best){best=score;localStorage.mergeChibiBest=score;bestEl.textContent=score}overlay.classList.remove('hidden');beep(180,.18)}
  function draw(){ctx.clearRect(0,0,W,H);ctx.save();ctx.strokeStyle='#eeb4c5';ctx.lineWidth=1;for(let y=H*.35;y<H;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.restore();
    for(const b of balls){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.max(-.22,Math.min(.22,b.vx/850)));ctx.beginPath();ctx.arc(0,0,b.r,0,Math.PI*2);ctx.fillStyle='#ffffffcc';ctx.fill();ctx.strokeStyle=['#ffcf55','#ff9d76','#ff7198','#db87e9','#8e99ee','#5dc9e8','#4ed3a1','#a4d84f','#ffb947','#f06473'][b.t];ctx.lineWidth=Math.max(2,b.r*.07);ctx.stroke();const im=imgs[b.t];if(im.complete)ctx.drawImage(im,-b.r*.88,-b.r*.88,b.r*1.76,b.r*1.76);ctx.restore()}
    if(!ended&&canDrop){const r=radii[nextType];ctx.globalAlpha=.78;ctx.setLineDash([5,7]);ctx.strokeStyle='#e84975';ctx.beginPath();ctx.moveTo(aimX,0);ctx.lineTo(aimX,40);ctx.stroke();ctx.setLineDash([]);if(imgs[nextType].complete)ctx.drawImage(imgs[nextType],aimX-r,8,r*2,r*2);ctx.globalAlpha=1}}
  function loop(t){const dt=Math.min(.025,(t-last)/1000||.016);last=t;if(!ended)step(dt);draw();requestAnimationFrame(loop)}
  document.getElementById('restartBtn').onclick=reset;document.getElementById('resetBtn').onclick=reset;document.getElementById('soundBtn').onclick=e=>{muted=!muted;e.currentTarget.classList.toggle('muted',muted);e.currentTarget.textContent=muted?'×':'♪';e.currentTarget.setAttribute('aria-label',muted?'打开声音':'关闭声音')};
  setNext();requestAnimationFrame(loop);
})();
