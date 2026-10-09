(()=>{
'use strict';
const originalSpin=document.getElementById('spin');
const area=document.getElementById('reels');
if(!originalSpin||!area||document.getElementById('okachan-four-prizes'))return;

const css=document.createElement('style');
css.id='okachan-four-prizes';
css.textContent=[
'.window{height:clamp(246px,77vw,318px)!important}',
'.window .tile{height:calc(clamp(246px,77vw,318px) / 3)!important;border-bottom:1px solid #dfbe9070}',
'.window .tile img{width:94%!important;max-width:132px!important;max-height:95%;object-fit:contain}',
'.window .tile .other-icon{font-size:clamp(39px,12vw,61px);line-height:1;filter:drop-shadow(0 3px 1px #56372236)}',
'.window .tile .blue-pending{filter:hue-rotate(185deg) saturate(1.4)!important}',
'.window.stopped .track{filter:none!important}',
'@keyframes oka-reel-roll{to{transform:translateY(-50%)}}',
'.oka-tap{position:absolute;inset:0;width:100%;height:100%;z-index:11;background:transparent;border:0;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
'.oka-tap:disabled{pointer-events:none;cursor:default}',
'.oka-tap:not(:disabled)::after{content:"ここをタップ";position:absolute;left:50%;bottom:6px;transform:translateX(-50%);padding:5px 6px;border:1px solid #fff0bd;border-radius:12px;background:#95142bdf;box-shadow:0 1px 7px #330b18;color:#fff;white-space:nowrap;font-size:10px;font-weight:900}',
'.oka-stop-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 2px 0}',
'.oka-stop-row button{height:50px;border-radius:13px;border:2px solid #ffe5a9;background:linear-gradient(#ff9861,#e32936 45%,#951329);color:#fff6c4;font-size:16px;font-weight:1000;box-shadow:0 4px 0 #773610;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
'.oka-stop-row button:disabled{opacity:.46;filter:grayscale(.55);cursor:default}',
'.oka-stop-row button.current{box-shadow:0 0 14px #ffe9a9,0 4px 0 #773610;animation:oka-btn-glow .9s ease-in-out infinite alternate}',
'.oka-stop-row button.finished:disabled{opacity:1;filter:none;background:linear-gradient(#528b5a,#28603a)}',
'@keyframes oka-btn-glow{to{box-shadow:0 0 5px #e5a154,0 4px 0 #773610}}',
'.oka-winlines{position:absolute;inset:0;width:100%;height:100%;z-index:9;pointer-events:none;opacity:0;transition:opacity .25s}',
'.oka-winlines.visible{opacity:1}',
'.oka-winlines line,.oka-winlines polyline{stroke:#ffe985;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #af0b2a)}',
'.oka-winlines .diagonal{display:none;stroke:#7ee8ff}',
'.oka-winlines.double .diagonal{display:block}',
'.oka-odds-title{font-size:13px;color:#ffebbe;font-weight:900;margin:9px 0 5px}',
'.oka-tip{color:#ffdfab;font-size:11px;margin:9px 0 0;line-height:1.7}',
'@media(max-width:360px){.oka-stop-row{gap:5px}.oka-stop-row button{font-size:14px;height:46px}.oka-tap:not(:disabled)::after{font-size:9px;padding:4px 3px}}',
'@media(prefers-reduced-motion:reduce){.oka-stop-row button.current{animation:none}}'
].join('');
document.head.append(css);

// The original demo's auto-stop button is cloned to remove its old handler.
const spin=originalSpin.cloneNode(true);
originalSpin.replaceWith(spin);
const tracks=[0,1,2].map(i=>document.getElementById('reel'+i));
const windows=Array.from(area.querySelectorAll('.window'));
const redSrc=tracks[0]?.querySelector('img')?.src||'';
let blueSrc=null;
const result=document.getElementById('result');
const screen=document.getElementById('screen');
const counter=document.getElementById('counter');
const confetti=document.getElementById('confetti');
const sound=document.getElementById('sound');
const hint=document.querySelector('.hint');
const details=document.querySelector('.detail-body');
const taps=[],stops=[];
const labels=['左','中央','右'];
const mixed=['red','bell','blue','cherry','flower','red','melon','blue','flower','cherry','bell','melon'];
const icons={bell:'🔔',cherry:'🍒',flower:'🌸',melon:'🍉',diamond:'💎'};
let stage=-1,rounds=0,color=null,isDouble=false,audio=null;

function unbiased(bound){
  if(window.crypto&&crypto.getRandomValues){
    const buf=new Uint32Array(1);
    const max=4294967296-(4294967296%bound);
    do{crypto.getRandomValues(buf)}while(buf[0]>=max);
    return buf[0]%bound;
  }
  return Math.floor(Math.random()*bound);
}
function blueAsset(){
  if(!redSrc)return;
  const image=new Image();
  image.onload=()=>{
    try{
      const canvas=document.createElement('canvas');
      canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(image,0,0);
      const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
      const data=frame.data;
      // Change saturated RED in the number to blue; keep golden frame and boy.
      for(let k=0;k<data.length;k+=4){
        if(data[k+3]<25)continue;
        const r=data[k],g=data[k+1],b=data[k+2];
        if(r>75 && r>g*1.38 && r>b*1.38 && g<b*1.23 && g<118){
          data[k]=Math.round(r*.19);
          data[k+1]=Math.min(255,Math.round(r*.43+g*.35));
          data[k+2]=Math.min(255,Math.round(r*.88+b*.12));
        }
      }
      ctx.putImageData(frame,0,0);
      blueSrc=canvas.toDataURL('image/webp',.88);
      document.querySelectorAll('img.blue-pending').forEach(el=>{el.src=blueSrc;el.classList.remove('blue-pending')});
    }catch(e){blueSrc=null}
  };
  image.src=redSrc;
}
function tile(type){
  const d=document.createElement('div');d.className='tile';
  if(type==='red'||type==='blue'){
    const img=document.createElement('img');
    img.src=type==='blue'&&blueSrc?blueSrc:redSrc;
    img.alt=type==='blue'?'おかちゃんの青7':'おかちゃんの赤7';
    img.draggable=false;
    if(type==='blue'&&!blueSrc)img.className='blue-pending';
    d.append(img);
  }else{
    const el=document.createElement('span');
    el.className='other-icon';
    el.textContent=icons[type]||'🌸';
    el.setAttribute('aria-hidden','true');
    d.append(el);
  }
  return d;
}
function fill(i,items){
  const t=tracks[i];
  t.style.animation='none';
  t.style.transition='none';
  t.style.transform='translate3d(0,0,0)';
  t.replaceChildren(...items.map(tile));
  windows[i].classList.add('stopped');
}
function rotate(i){
  const t=tracks[i];
  t.style.animation='none';
  t.style.transition='none';
  t.style.transform='translate3d(0,0,0)';
  t.replaceChildren(...mixed.concat(mixed).map(tile));
  windows[i].classList.remove('stopped');
  void t.offsetHeight;
  t.style.animation='oka-reel-roll '+(.66+i*.13)+'s linear infinite';
}
function playTone(freq,duration=.10){
  if(sound?.getAttribute('aria-pressed')!=='true')return;
  try{
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    audio=audio||new Context();
    if(audio.state==='suspended')audio.resume();
    const oscillator=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
    oscillator.type='sine';oscillator.frequency.value=freq;
    gain.gain.setValueAtTime(.04,t);
    gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    oscillator.connect(gain);gain.connect(audio.destination);
    oscillator.start(t);oscillator.stop(t+duration+.01);
  }catch(e){}
}
for(let i=0;i<3;i++){
  const tap=document.createElement('button');
  tap.type='button';tap.className='oka-tap';tap.disabled=true;
  tap.setAttribute('aria-label',labels[i]+'リールを止める');
  windows[i].append(tap);taps.push(tap);
}
const row=document.createElement('div');
row.className='oka-stop-row';row.setAttribute('role','group');
row.setAttribute('aria-label','左、中央、右の順番でリールを止める');
for(let i=0;i<3;i++){
  const b=document.createElement('button');b.type='button';
  b.textContent=(i+1)+' STOP';b.disabled=true;
  row.append(b);stops.push(b);
}
area.insertAdjacentElement('afterend',row);
const svgNS='http://www.w3.org/2000/svg';
const lines=document.createElementNS(svgNS,'svg');
lines.setAttribute('viewBox','0 0 300 300');
lines.setAttribute('preserveAspectRatio','none');
lines.classList.add('oka-winlines');
const horizontal=document.createElementNS(svgNS,'line');
horizontal.setAttribute('x1','5');horizontal.setAttribute('y1','150');
horizontal.setAttribute('x2','295');horizontal.setAttribute('y2','150');
lines.append(horizontal);
const diagonal=document.createElementNS(svgNS,'polyline');
diagonal.setAttribute('points','5,50 150,150 295,250');
diagonal.setAttribute('class','diagonal');
lines.append(diagonal);area.append(lines);
function enable(i){
  for(let j=0;j<3;j++){
    taps[j].disabled=j!==i;
    stops[j].disabled=j!==i;
    stops[j].classList.toggle('current',j===i);
  }
}
function setDone(i){
  taps[i].disabled=true;stops[i].disabled=true;
  stops[i].classList.remove('current');
  stops[i].classList.add('finished');
  stops[i].textContent=(i+1)+' ✓';
}
function confettiBurst(count){
  confetti.replaceChildren();
  const palette=['#ffe09d','#fff5d1','#e995ed','#74ddff','#ffc48c'];
  for(let j=0;j<count;j++){
    const e=document.createElement('i');
    e.style.setProperty('--x',unbiased(100)+'%');
    e.style.setProperty('--shift',(unbiased(180)-90)+'px');
    e.style.setProperty('--t',(1+unbiased(16)/10)+'s');
    e.style.setProperty('--delay',unbiased(6)/10+'s');
    e.style.setProperty('--color',palette[j%palette.length]);
    confetti.append(e);
  }
  setTimeout(()=>confetti.replaceChildren(),3400);
}
function finish(){
  stage=-1;
  area.classList.remove('spinning');
  spin.disabled=false;spin.innerHTML='もう一度まわす <span aria-hidden="true">↻</span>';
  rounds++;counter.textContent=rounds+'回遊びました・何度でも無料です';
  lines.classList.toggle('double',isDouble);
  lines.classList.add('visible');
  const isBlue=color==='blue';
  const label=(isBlue?'青7':'赤7')+(isDouble?' W BIG':' BIG');
  const rank=isBlue?(isDouble?'最高ランク・4等級':'第2ランク'):(isDouble?'第3ランク':'第1ランク');
  screen.className='screen'+(isDouble&&isBlue?' jackpot':' win');
  result.innerHTML='<strong>'+(isBlue&&isDouble?'🏆 ':isDouble?'🎉 ':'✨ ')+label+
    (isBlue&&isDouble?' 🏆':'！')+'</strong><br>'+rank+
    (isBlue&&isDouble?'・確率 1/365':'・おめでとう！');
  playTone(isDouble?930:680,.26);
  if(isDouble)confettiBurst(isBlue?54:28);
}
function stop(i){
  if(stage!==i)return;
  if(i===0){
    // Red total: (168+36)/365=204/365. Blue total: (160+1)/365=161/365.
    color=unbiased(365)<204?'red':'blue';
    fill(0,[color,color,'bell']);
    setDone(0);stage=1;enable(1);
    result.textContent=(color==='red'?'赤7':'青7')+'確定！ 次は真ん中をタップ！';
    playTone(color==='red'?520:690);
  }else if(i===1){
    fill(1,['cherry',color,'flower']);
    setDone(1);stage=2;enable(2);
    result.textContent=(color==='red'?'赤7':'青7')+' BIG以上確定！右でシングルかW！';
    playTone(760);
  }else{
    // Conditional odds retain four EXACT per-spin rates:
    // red single 168/365; blue single 160/365; red W 36/365; blue W 1/365.
    isDouble=color==='red'?unbiased(204)<36:unbiased(161)===0;
    fill(2,['melon',color,isDouble?color:'diamond']);
    setDone(2);finish();
  }
}
taps.forEach((b,i)=>b.addEventListener('click',()=>stop(i)));
stops.forEach((b,i)=>b.addEventListener('click',()=>stop(i)));
spin.addEventListener('click',()=>{
  if(stage>=0)return;
  stage=0;color=null;isDouble=false;
  confetti.replaceChildren();lines.classList.remove('visible','double');
  screen.className='screen';result.textContent='左リールをタップ！赤7か青7が決まるよ';
  spin.disabled=true;spin.textContent='3つのリールを順番にSTOP！';
  area.classList.add('spinning');
  stops.forEach((b,i)=>{b.classList.remove('finished','current');b.textContent=(i+1)+' STOP'});
  tracks.forEach((_,i)=>rotate(i));enable(0);
  playTone(460);
});
area.setAttribute('aria-label','赤7・青7の3段表示、左から順番に手動停止するスロット');
if(hint)hint.innerHTML='🌸 左 → 中央 → 右をタップ！ <b>必ずBIG以上</b> 🌸';
if(details)details.innerHTML=
  '<p>STARTを押して、<b>左 → 中央 → 右</b>の順でリールかSTOPボタンを合計3回タップ。'+
  '左で7の色を抽選、中央は同じ色で確定、右でシングルかWを抽選します。どの結果もBIG以上です。</p>'+
  '<p class="oka-odds-title">出現確率（1回ごと・全365通り）</p>'+
  '<div class="odds"><span>① 赤7シングル BIG</span><b>168/365（46.03%）</b></div>'+
  '<div class="odds"><span>② 青7シングル BIG</span><b>160/365（43.84%）</b></div>'+
  '<div class="odds"><span>③ 赤7ダブル W BIG</span><b>36/365（9.86%）</b></div>'+
  '<div class="odds"><span>④ 青7ダブル W BIG</span><b>1/365（約0.27%）</b></div>'+
  '<p class="oka-tip">左リールの色は赤7：約55.9%、青7：約44.1%。'+
  'Wは中央の横ラインと、左上から右下への斜めラインが同時に揃うこと。'+
  '抽選は毎回独立で、プレイ回数による確率の変動はありません。景品や換金はありません。</p>';
fill(0,['red','red','bell']);
fill(1,['cherry','red','flower']);
fill(2,['melon','red','diamond']);
result.textContent='STARTで回転！左 → 中央 → 右の3回タップでBIG確定！';
blueAsset();
})();