(()=>{
'use strict';
const orig=document.getElementById('spin'),area=document.getElementById('reels');
if(!orig||!area||document.getElementById('manual-slot-style'))return;
const css=document.createElement('style');css.id='manual-slot-style';
css.textContent=[
'@keyframes okachan-roll{to{transform:translate3d(0,var(--move),0)}}',
'.reel-tap{position:absolute;inset:0;width:100%;height:100%;z-index:7;border:0;background:transparent;touch-action:manipulation;cursor:pointer}',
'.reel-tap:disabled{pointer-events:none}',
'.reel-tap:not(:disabled)::after{content:"タップでSTOP";position:absolute;left:50%;bottom:5px;transform:translateX(-50%);background:#83132acc;border:1px solid #ffe6a5;border-radius:20px;padding:4px 7px;color:#fff;white-space:nowrap;font-size:10px;font-weight:900}',
'.manual-stops{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}',
'.manual-stops button{height:48px;border:2px solid #ffe2a3;border-radius:13px;background:linear-gradient(#fe8851,#cb1831 65%,#760d24);color:#fff6cd;font-size:17px;font-weight:900;box-shadow:0 4px 0 #71360c;touch-action:manipulation}',
'.manual-stops button:disabled{opacity:.45;filter:grayscale(.5)}',
'.manual-stops button.done:disabled{opacity:1;filter:none;background:linear-gradient(#559459,#225a36)}',
'@media(max-width:345px){.manual-stops{gap:4px}.manual-stops button{font-size:14px}}'
].join('');
document.head.append(css);
const spin=orig.cloneNode(true);orig.replaceWith(spin);
const tracks=[0,1,2].map(i=>document.getElementById('reel'+i));
const windows=Array.from(area.querySelectorAll('.window'));
const seven=tracks[0].querySelector('img')?.src||'';
const result=document.getElementById('result'),counter=document.getElementById('counter'),screen=document.getElementById('screen'),confetti=document.getElementById('confetti');
const colors={1:'#dd483d',2:'#3987b9',3:'#9e53b1',4:'#43a27f',5:'#da8330',6:'#547cba'};
const taps=[],buttons=[];let playing=false,turns=0,stopped=[],numbers=[];
for(let i=0;i<3;i++){
 const tap=document.createElement('button');tap.type='button';tap.className='reel-tap';tap.disabled=true;
 tap.setAttribute('aria-label',['左','中央','右'][i]+'のリールを止める');windows[i].append(tap);taps.push(tap);
}
const row=document.createElement('div');row.className='manual-stops';row.setAttribute('role','group');row.setAttribute('aria-label','リールのストップ');
for(let i=0;i<3;i++){
 const b=document.createElement('button');b.type='button';b.disabled=true;b.id='stop'+i;b.textContent=(i+1)+' STOP';row.append(b);buttons.push(b);
}
area.insertAdjacentElement('afterend',row);
result.textContent='回したら各リールをタップして止めよう！';
const hint=document.querySelector('.hint');if(hint)hint.innerHTML='🌸 回す → 3つを自分でSTOP！ <b>777は特別大当たり</b> 🌸';
const help=document.querySelector('.detail-body p');if(help)help.innerHTML='「スロットを回す」の後、回転中のリールか下のSTOPボタンを押して、好きな順番で3つ止めてください。同じ数字が3つなら当たり、777は特別大当たりです。';
function random7(){
 if(window.crypto&&crypto.getRandomValues){const a=new Uint32Array(1),max=2**32-(2**32%7);do{crypto.getRandomValues(a)}while(a[0]>=max);return a[0]%7+1}
 return Math.floor(Math.random()*7)+1;
}
function tile(n){
 const e=document.createElement('div');e.className='tile';e.setAttribute('aria-label',String(n));
 if(n===7){const img=document.createElement('img');img.src=seven;img.alt='おかちゃん付きの7';img.draggable=false;e.append(img)}
 else{const d=document.createElement('span');d.className='num';d.textContent=n;d.style.setProperty('--letter',colors[n]);e.append(d);const f=document.createElement('span');f.className='petal';f.setAttribute('aria-hidden','true');f.textContent='✿';e.append(f)}
 return e;
}
function finish(){
 playing=false;area.classList.remove('spinning');spin.disabled=false;spin.textContent='もう一度まわす ↻';
 counter.textContent=(++turns)+'回遊びました・何度でも無料で挑戦できます';
 const jackpot=numbers.every(n=>n===7),win=numbers.every(n=>n===numbers[0]);
 screen.className='screen'+(jackpot?' jackpot':win?' win':'');
 if(jackpot){result.innerHTML='<strong>🎉 超大当たり！777 🎉</strong><br>おかちゃんと最高のラッキー！'}
 else if(win){result.innerHTML='<strong>✨ 大当たり！ ✨</strong><br>3つそろった！おめでとう！'}
 else{result.textContent='また挑戦してね！ 次はそろうかも 🌸'}
 if(win){
  confetti.replaceChildren();
  for(let j=0;j<34;j++){const e=document.createElement('i');e.style.setProperty('--x',Math.random()*100+'%');e.style.setProperty('--shift',(Math.random()*170-85)+'px');e.style.setProperty('--t',(1.1+Math.random()*1.35)+'s');e.style.setProperty('--delay',Math.random()*.4+'s');e.style.setProperty('--color',['#ffe09d','#fff2bd','#ff8c6b','#f3add4'][j%4]);confetti.append(e)}
  setTimeout(()=>confetti.replaceChildren(),3100);
 }
}
function stop(i){
 if(!playing||stopped[i])return;
 stopped[i]=true;numbers[i]=random7();
 tracks[i].style.animation='none';tracks[i].replaceChildren(tile(numbers[i]));tracks[i].style.transform='translate3d(0,0,0)';
 taps[i].disabled=true;buttons[i].disabled=true;buttons[i].className='done';buttons[i].textContent=(i+1)+' ✓';
 const remaining=stopped.filter(x=>!x).length;
 if(!remaining)finish();else result.textContent='あと'+remaining+'つ！ 次のリールをタップ ✨';
}
taps.forEach((x,i)=>x.addEventListener('click',()=>stop(i)));
buttons.forEach((x,i)=>x.addEventListener('click',()=>stop(i)));
spin.addEventListener('click',()=>{
 if(playing)return;
 playing=true;stopped=[false,false,false];numbers=[null,null,null];
 spin.disabled=true;spin.textContent='リールをタップしてSTOP！';
 screen.className='screen';result.textContent='好きな順番で3つを止めよう！ 🎰';
 confetti.replaceChildren();area.classList.add('spinning');
 tracks.forEach((t,i)=>{
  taps[i].disabled=false;buttons[i].disabled=false;buttons[i].className='';buttons[i].textContent=(i+1)+' STOP';
  t.style.animation='none';t.style.transition='none';t.style.transform='';
  t.replaceChildren(...[7,1,2,3,4,5,6,7].map(tile));
  t.style.setProperty('--move','-'+(7*windows[i].clientHeight)+'px');
  void t.offsetHeight;t.style.animation='okachan-roll '+(690+i*95)+'ms linear infinite';
 });
});
})();