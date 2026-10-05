'use strict';
let exerciseOverrides={},circuitModel=[],editingExercise=null,player=null,clockInterval=null;
try{const value=JSON.parse(localStorage.getItem('ritmo-exercises-v1')||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))exerciseOverrides=value;}catch{}
const circuitIdentity=()=>`${stage}-${day%2===1?'boxe-'+day:sessionCode()}-${home?'casa':'referencia'}-${stage===1&&week<=2?'entrada':'regular'}`;
function getDose(text){
 const short=text.split(/\s+(?:—|-)\s+|\s*\(/)[0].replace(/^\d+\s*[-:]\s*/,'').trim();
 const match=text.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:REPS|repetições|por lado|vezes|SEG(?:UNDOS)?|s\b|min\b)/i);
 let unit='manual',value=0;
 if(match){unit=/SEG|\bs\b|min/i.test(match[0])?'seconds':'reps';value=Number(match[1]);if(/min/i.test(match[0]))value*=60;}
 if((/REPS|repetições/i.test(text)&&/SEG|\d\s*s\b/i.test(text))||/esforços|\+|\bOU\b|\[ou\]/i.test(text)){unit='manual';value=0;}
 return {name:short||text,unit,value,note:text};
}
function buildCircuitModel(){
 return currentTrainingBlocks.map((block,bi)=>{
 const warm=/Aquecimento/i.test(block.title),skill=/Habilidade/i.test(block.title),round=/Rounds/i.test(block.title),force=/Força|Manutenção/i.test(block.title),boxing=day%2===1;
 const repetitions=warm&&!boxing&&/3 CIRCUITOS/i.test(block.title)?3:skill?Number(block.title.match(/(\d+)\s*VEZES/i)?.[1]||3):force?(stage===1&&week<=2?2:3):1;
 const mode=force&&stage<=3&&!boxing?'circuit':warm&&repetitions>1?'circuit':'sets';
 return {title:block.title,mode,exercises:block.items.filter(text=>!/Habilidade pendente/i.test(text)).map((text,ei)=>{
 const dose=getDose(text),key=`${circuitIdentity()}-${bi}-${ei}`;
 if(!boxing&&warm&&repetitions===1){dose.unit='seconds';dose.value=300;}
 if(boxing&&round){dose.unit='seconds';dose.value=stage===1?60:stage<=3?90:120;dose.name=text;}
 if(boxing&&!round){dose.unit='seconds';dose.value=/Deslocamentos/i.test(block.title)?300:/Finalização/i.test(block.title)?180:300;}
 const defaultRest=boxing?round?60:0:skill?90:mode==='circuit'?45:120;
 const base={key,original:text,...dose,rest:defaultRest,sets:Array.from({length:repetitions},()=>dose.value)};
 const saved=exerciseOverrides[key];
 return saved&&Array.isArray(saved.sets)&&saved.sets.length&&saved.sets.length<=12?{...base,...saved,key}:base;
 })};
 });
}
function renderCircuit(){
 const old=$('circuit-panel');if(old)old.remove();
 if(day===6)return;
 circuitModel=buildCircuitModel();
 const panel=document.createElement('section');panel.id='circuit-panel';panel.className='circuit-panel';
 panel.innerHTML=`<div class="circuit-heading"><div><p class="eyebrow">EXECUÇÃO GUIADA</p><h3>Seu circuito de treino</h3></div><button id="start-training" class="primary">Iniciar treino</button></div><p class="muted circuit-intro">Edite as voltas, repetições ou tempos antes de começar. Nos circuitos, passe por todos os exercícios e repita a volta. Nas etapas 4–6, complete as séries de cada exercício.</p>${circuitModel.map((block,bi)=>`<section class="circuit-block"><h4>${escapeHTML(block.title.replace(/ - 3-4 CIRCUITOS/i,''))}</h4><p class="block-mode">${block.mode==='circuit'?'Exercícios alternados por volta':'Séries por exercício'}${block.exercises.length?'':' · Nenhum movimento disponível nesta versão'}</p>${block.exercises.map((ex,ei)=>`<button class="exercise-card" data-edit="${bi}:${ei}"><span class="exercise-tile">${String(ei+1).padStart(2,'0')}</span><span class="exercise-card-text"><strong>${escapeHTML(ex.name)}</strong><span>${ex.sets.length} ${block.mode==='circuit'?'voltas':'séries'} · ${ex.unit==='manual'?'execução livre':ex.sets.join(' / ')+(ex.unit==='seconds'?' s':' reps')} · ${ex.rest}s descanso</span></span><span class="edit-label">Editar</span></button>`).join('')}</section>`).join('')}<p class="small-note">As metas editadas e notas ficam neste navegador. As fichas de referência continuam disponíveis acima. Use a nota para escolher uma alternativa “ou” antes de iniciar. Carga em kg não se aplica aos exercícios desta rotina.</p>`;
 let reference=$('workout').querySelector('.reference-workout');
 if(!reference){reference=document.createElement('details');reference.className='reference-workout';reference.innerHTML='<summary>Consultar ficha completa e orientações</summary><div>'+$('workout').innerHTML+'</div>';$('workout').replaceChildren(reference);}
 $('workout').prepend(panel);
 panel.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>openExerciseEditor(...button.dataset.edit.split(':').map(Number))));
 $('start-training').addEventListener('click',startTraining);
}
const originalRenderSession=renderSession;
renderSession=function(){originalRenderSession();renderCircuit();};
function editorSet(value,index){return `<div class="set-row"><span class="set-number">${index+1}</span><label>Meta<input class="set-value" type="number" min="0" max="3600" value="${value}" required></label><button type="button" class="quiet remove-set" aria-label="Remover série ${index+1}">Remover</button></div>`;}
function openExerciseEditor(bi,ei){
 editingExercise={bi,ei};const ex=circuitModel[bi].exercises[ei];
 $('edit-name').value=ex.name;$('edit-unit').value=ex.unit;$('edit-rest').value=ex.rest;$('edit-note').value=ex.note;
 $('edit-sets').innerHTML=ex.sets.map(editorSet).join('');$('editor-error').textContent='';bindSetControls();$('exercise-editor').showModal();
}
function bindSetControls(){const rows=[...$('edit-sets').querySelectorAll('.set-row')];rows.forEach((row,i)=>{row.querySelector('.set-number').textContent=i+1;row.querySelector('.remove-set').onclick=()=>{if(rows.length<=1){$('editor-error').textContent='Mantenha pelo menos uma série.';return;}row.remove();bindSetControls();};});}
$('add-set').addEventListener('click',()=>{const values=[...$('edit-sets').querySelectorAll('.set-value')];if(values.length>=12){$('editor-error').textContent='Limite de 12 séries por exercício.';return;}$('edit-sets').insertAdjacentHTML('beforeend',editorSet(Number(values.at(-1)?.value||0),values.length));bindSetControls();});
$('exercise-editor').addEventListener('toggle',bindSetControls);
$('close-editor').addEventListener('click',()=>$('exercise-editor').close());
$('exercise-form').addEventListener('submit',event=>{
 event.preventDefault();const ex=circuitModel[editingExercise.bi].exercises[editingExercise.ei],sets=[...$('edit-sets').querySelectorAll('.set-value')].map(input=>Number(input.value)),rest=Number($('edit-rest').value),unit=$('edit-unit').value,name=$('edit-name').value.trim();
 if(!name||!sets.length||sets.some(v=>!Number.isInteger(v)||v<0||v>3600)||(unit!=='manual'&&sets.some(v=>v===0))||!Number.isInteger(rest)||rest<0||rest>600){$('editor-error').textContent='Confira as metas e o descanso. Metas de repetição ou tempo devem ser maiores que zero.';return;}
 exerciseOverrides[ex.key]={name,sets,rest,unit,note:$('edit-note').value.trim()};
 try{localStorage.setItem('ritmo-exercises-v1',JSON.stringify(exerciseOverrides));}catch{storageAvailable=false;}
 $('exercise-editor').close();renderCircuit();
});
function createTrainingQueue(model){
 const queue=[];
 for(const block of model){if(block.mode==='circuit'){
  const turns=Math.max(0,...block.exercises.map(ex=>ex.sets.length));
  for(let turn=0;turn<turns;turn++){const eligible=block.exercises.filter(ex=>turn<ex.sets.length);eligible.forEach((ex,index)=>queue.push({title:block.title,ex,set:turn,value:ex.sets[turn],label:`Volta ${turn+1} de ${turns}`,rest:index===eligible.length-1?90:ex.rest}));}
 }else for(const ex of block.exercises)ex.sets.forEach((value,set)=>queue.push({title:block.title,ex,set,value,label:`Série ${set+1} de ${ex.sets.length}`,rest:ex.rest}));}
 return queue;
}
function startTraining(){
 const queue=createTrainingQueue(circuitModel);if(!queue.length)return;
 player={queue,index:0,phase:'exercise',paused:false,deadline:0,remaining:0,key:completionKey(),finished:false};
 $('training-player').showModal();showPlayerStep();
 clearInterval(clockInterval);clockInterval=setInterval(updateClock,250);
}
function setClock(seconds){player.remaining=seconds;player.deadline=Date.now()+seconds*1000;player.paused=false;}
function formatClock(seconds){const value=Math.max(0,Math.ceil(seconds));return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
function showPlayerStep(){
 const task=player.queue[player.index];$('player-progress').max=player.queue.length;$('player-progress').value=player.index;
 $('player-section').textContent=task.title;$('player-position').textContent=`${task.label} · Passo ${player.index+1} de ${player.queue.length}`;
 $('player-title').textContent=player.phase==='rest'?'Descanse.':task.ex.name;
 $('player-note').textContent=player.phase==='rest'?'Recupere o controle antes de continuar.':task.ex.note;
 $('player-dose').textContent=player.phase==='rest'?`Próximo: ${player.queue[player.index+1]?.ex.name||'Finalizar treino'}`:task.ex.unit==='reps'?`${task.value} repetições`:task.ex.unit==='seconds'?`${task.value} segundos`:'Execução livre · siga a nota';
 const seconds=player.phase==='rest'?task.rest:task.ex.unit==='seconds'?task.value:0;setClock(seconds);
 $('player-clock').textContent=seconds?formatClock(seconds):'No seu ritmo';$('player-pause').hidden=!seconds;$('player-pause').textContent='Pausar relógio';
 $('player-next').textContent=player.phase==='rest'?'Pular descanso':'Concluir exercício';$('player-status').textContent='';
}
function updateClock(){if(!player||player.finished||player.paused||!player.remaining)return;const seconds=Math.max(0,(player.deadline-Date.now())/1000);$('player-clock').textContent=formatClock(seconds);if(seconds===0){player.remaining=0;if(player.phase==='rest')advancePlayer();else{$('player-status').textContent='Tempo encerrado. Confirme a execução para continuar.';$('player-pause').hidden=true;}}}
function advancePlayer(){
 if(!player||player.finished)return;
 const task=player.queue[player.index];
 if(player.phase==='exercise'&&task.rest>0&&player.index<player.queue.length-1){player.phase='rest';showPlayerStep();return;}
 player.index++;if(player.index>=player.queue.length){finishTraining();return;}
 player.phase='exercise';showPlayerStep();
}
function finishTraining(){
 clearInterval(clockInterval);player.finished=true;completed[player.key]=true;saveProgress();render();
 $('player-section').textContent='SESSÃO CONCLUÍDA';$('player-title').textContent='Treino finalizado!';$('player-progress').value=player.queue.length;$('player-position').textContent=`${player.queue.length} passos concluídos`;$('player-dose').textContent='Conclusão registrada nesta semana.';$('player-note').textContent='';$('player-clock').textContent='✓';$('player-pause').hidden=true;$('player-next').textContent='Voltar à rotina';$('player-status').textContent='';
}
$('player-next').addEventListener('click',()=>{if(player?.finished)$('training-player').close();else advancePlayer();});
$('player-pause').addEventListener('click',()=>{if(!player||player.finished)return;if(player.paused){player.deadline=Date.now()+player.remaining*1000;player.paused=false;$('player-pause').textContent='Pausar relógio';}else{player.remaining=Math.max(0,(player.deadline-Date.now())/1000);player.paused=true;$('player-pause').textContent='Retomar relógio';}});
$('exit-training').addEventListener('click',()=>$('training-player').close());
$('training-player').addEventListener('close',()=>{clearInterval(clockInterval);player=null;});
$('training-player').addEventListener('cancel',()=>{clearInterval(clockInterval);player=null;});
renderCircuit();
