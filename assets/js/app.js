'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stageNames=['Base de corpo inteiro','Superiores e inferiores','Controle e habilidades','Puxar, pernas e empurrar','Bloco de transição','Força e movimentos'];
const stageTypes=['FULL BODY','UPPER / LOWER','UPPER / LOWER','PULL / LEG / PUSH','PULL / LEG / PUSH','PULL / LEG / PUSH'];
const calendars=[
 [['1A','1A','1C'],['1B','1B','1C'],['1A','1A','1C'],['1B','1B','1C']],
 [['2A','2C','2B'],['2D','2A','2C'],['2B','2D','2A'],['2C','2B','2D']],
 [['3A','3C','3B'],['3D','3A','3C'],['3B','3D','3A'],['3C','3B','3D']],
 ...[4,5,6].map(s=>[[`${s}A`,`${s}E`,`${s}C`],[`${s}B`,`${s}F`,`${s}D`],[`${s}A`,`${s}E`,`${s}C`],[`${s}B`,`${s}F`,`${s}D`]])
];
const dayNames=['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
let stage=1,week=1,day=0,home=true,completed={},storageAvailable=true;
let currentTrainingBlocks=[];
try{const saved=JSON.parse(localStorage.getItem('ritmo-progress-v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))completed=saved;}catch{storageAvailable=false;}
function sessionCode(){return calendars[stage-1][week===5?2:week-1][Math.floor(day/2)];}
function completionKey(d=day){return `${stage}-${week}-${d}`;}
function saveProgress(){try{localStorage.setItem('ritmo-progress-v1',JSON.stringify(completed));}catch{storageAvailable=false;}}
function selectStage(value){stage=value;render();}
function selectDay(value){day=value;render();}
function render(){
 $('months').innerHTML=stageNames.map((name,i)=>`<button class="month ${stage===i+1?'active':''}" data-stage="${i+1}" aria-pressed="${stage===i+1}"><span>MÊS ${i+1}</span><strong>Etapa ${i+1}</strong>${i===3||i===4?'<small>Provisória</small>':''}</button>`).join('');
 $('stage-title').textContent=stageNames[stage-1];$('stage-type').textContent=stageTypes[stage-1];$('stage-number').textContent=String(stage).padStart(2,'0');
 $('stage-note').textContent=stage===1?'Comece com 2 circuitos nas primeiras duas semanas.':stage===4||stage===5?'Fichas provisórias até receber os materiais corretos.':'Uma etapa por mês. Avance mantendo o controle dos movimentos.';
 $('week').value=week;
 $('days').innerHTML=dayNames.map((name,i)=>{const boxing=i%2===1,rest=i===6,code=rest?'Recuperação':boxing?['Técnica','Condicionamento','Revisão técnica'][Math.floor(i/2)]:calendars[stage-1][week===5?2:week-1][Math.floor(i/2)];return `<button data-day="${i}" class="day ${boxing?'boxing':''} ${rest?'rest':''} ${i===day?'selected':''}" aria-pressed="${i===day}"><span class="day-initial">${['S','T','Q','Q','S','S','D'][i]}</span><span class="day-label"><strong>${name}</strong><span>${rest?'Descanso':boxing?'Boxe':'Calistenia'} · ${code}</span></span>${completed[completionKey(i)]&&!rest?'<span class="day-check" aria-label="Concluído">✓</span>':''}</button>`;}).join('');
 const count=Array.from({length:6},(_,i)=>completed[completionKey(i)]?1:0).reduce((a,b)=>a+b,0);
 $('progress-count').textContent=`${count} / 6`;$('progress').value=count;$('storage-note').textContent=storageAvailable?'O progresso fica salvo neste navegador.':'O armazenamento está indisponível. O progresso vale apenas nesta sessão.';
 renderSession();
}
function renderSession(){
 currentTrainingBlocks=[];
 const boxing=day%2===1,rest=day===6;
 $('session-day').textContent=`${dayNames[day]} · Mês ${stage} · ${week===5?'Dias adicionais':`Semana ${week}`}`;
 $('session-badge').textContent=rest?'RECUPERAÇÃO':boxing?'BOXE':'CALISTENIA';$('session-badge').className=`badge ${boxing?'boxing':''} ${rest?'rest':''}`;
 $('view-controls').hidden=boxing||rest;
 $('provisional').hidden=true;
 $('complete').hidden=rest;
 $('completion-status').textContent=completed[completionKey()]&&!rest?'Concluído nesta semana.':'';
 $('complete').textContent=completed[completionKey()]?'Desmarcar conclusão':'Marcar treino concluído';$('complete').className=`primary ${completed[completionKey()]?'done':''}`;
 if(rest){$('session-title').textContent='Hora de recuperar.';$('session-meta').textContent='Sem treino obrigatório';$('workout').innerHTML='<div class="rest-content"><strong>Faça uma pausa.</strong><p class="muted">Domingo é descanso. Retome a sequência na segunda-feira, sem compensar sessões com treino dobrado.</p></div>';return;}
 if(boxing){renderBoxing();return;}
 const code=sessionCode(),entry=TRAINING_DATA.workouts[code];
 $('session-title').textContent=`Treino ${code} · ${stage===1?'Corpo inteiro':stage<4?(code.endsWith('A')||code.endsWith('B')?'Superiores':'Inferiores'):{A:'Puxar',B:'Puxar',C:'Empurrar',D:'Empurrar',E:'Pernas',F:'Pernas'}[code.slice(-1)]}`;
 const volume=stage===1&&week<=2?'2 circuitos para começar':stage<=3?'3–4 circuitos':'3–4 séries por exercício';
 $('session-meta').innerHTML=`<span>40–65 min previstos</span><span>${volume}</span><span>Esforço moderado</span>`;
 if(stage===4||stage===5){$('provisional').hidden=false;$('provisional').textContent=entry.original?'Etapa 4 incompleta. Esta ficha é original; os outros treinos incluem substitutos provisórios.':'Ficha proposta para preencher uma lacuna. Será substituída quando você enviar o material correto.';}
 $('home-view').setAttribute('aria-pressed',String(home));$('original-view').setAttribute('aria-pressed',String(!home));
 let blocks=parseWorkout(entry.text,entry.original),intro='Faça o aquecimento, depois a habilidade e, por fim, a força. Escolha uma única alternativa em cada bloco “ou”.';
 if(home&&stage>=4){intro='Versão doméstica de manutenção. Não conclui os requisitos suspensos das etapas originais. Barra, argolas e paralelas ainda são necessárias para a progressão completa.';
  if(['A','B'].includes(code.slice(-1))) blocks=[{title:'Aquecimento · 5–8 min',items:['Movimentação leve e mobilidade de ombros e quadril.']},{title:'Manutenção · 3 séries',items:['Remada isométrica com toalha nos pés — 3 esforços de 10–15 s por série. Descanse 20–30 s entre esforços e 90 s entre séries.','Bird dog — 8 por lado','Prancha lateral — 20–30 s por lado','Elevação de pernas no solo — 8–12 repetições']}];
  else {const replacement=(code.endsWith('E')||code.endsWith('F')?'5'+code.slice(-1):'4'+code.slice(-1));blocks=parseWorkout(TRAINING_DATA.workouts[replacement].text,false);}
 }
 currentTrainingBlocks=blocks.map(block=>({...block,items:block.items.flatMap((text,index)=>{const adapted=home?adaptExercise(text,stage>=4):null;if(adapted?.pull&&block.items.slice(0,index).some(previous=>adaptExercise(previous,stage>=4)?.pull))return [];return [adapted?adapted.text:text];})}));
 $('workout').innerHTML=`<div class="instruction">${escapeHTML(intro)}${home?' As substituições aparecem abaixo; não use portas ou apoios improvisados para se suspender.':''}</div>`+blocks.map((block,i)=>`<section class="workout-section"><h3><span class="block-number">${String(i+1).padStart(2,'0')}</span>${escapeHTML(block.title)}</h3>${block.items.map((text,index)=>{
 let adapted=home?adaptExercise(text,stage>=4):null;
 if(adapted&&adapted.pull&&block.items.slice(0,index).some(previous=>adaptExercise(previous,stage>=4)?.pull))return '';
 return `<div class="exercise"><span class="exercise-index">${String(index+1).padStart(2,'0')}</span><div><p>${escapeHTML(adapted?adapted.text:text)}</p>${adapted?`<p class="adapted-from">Referência: ${escapeHTML(text)}</p><p class="home-pill">ADAPTAÇÃO EM CASA</p>`:''}</div></div>`;
 }).join('')}</section>`).join('')+`<div class="instruction" style="margin-top:24px">${stage<=3?'Circuitos: 30–60 s entre exercícios e 90–120 s entre voltas.':'Séries: 90–180 s de descanso.'} Nas habilidades, espere recuperar o controle. Na última semana do mês, reduza o volume de segunda e quarta e reserve a última sexta para a avaliação.</div>`;
}
function parseWorkout(raw,original){
 if(!original){const cut=raw.indexOf('força:');if(cut<0)return[{title:'Treino proposto',items:[raw]}];return[{title:'Aquecimento · 5–8 min',items:['Movimentação leve, mobilidade e uma série fácil dos primeiros exercícios.']},{title:'Habilidade',items:[raw.slice(0,cut).replace(/^habilidade:\s*/i,'').replace(/;\s*$/,'')]},{title:'Força · séries por exercício',items:raw.slice(cut+6).split(';').map(s=>s.trim()).filter(Boolean)}];}
 const regex=/(AQUECIMENTO|MOVIMENTO|TREINO)\s*\[[^\]]+\][^\n]*/g;
 const matches=[...raw.matchAll(regex)];return matches.map((m,i)=>{
  const body=raw.slice(m.index+m[0].length,matches[i+1]?.index??raw.length).trim();
  let items=body.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean),merged=[];
  for(let j=0;j<items.length;j++){if(items[j]==='[ou]'||items[j]==='+'){if(j+1<items.length&&merged.length)merged[merged.length-1]+=`\n${items[j]==='[ou]'?'OU':'+'}\n${items[++j]}`;}else merged.push(items[j]);}
  return{title:m[0].replace(/^AQUECIMENTO/,'Aquecimento').replace(/^MOVIMENTO/,'Habilidade').replace(/^TREINO/,'Força'),items:merged};
 });
}
function adaptExercise(text,advanced){
 if(/Remada isométrica com toalha/i.test(text))return null;
 if(/skin the cat|back lever|front lever|oitava|shoulder flag/i.test(text))return{text:'Habilidade pendente: praticar somente com equipamento adequado e orientação. Não faça uma suspensão improvisada.'};
 if(/dragon flag|Descida negativa (One Leg|Full|com uma perna)/i.test(text))return{text:'Elevação de pernas no solo + leve elevação do quadril — 5–8 repetições controladas.'};
 if(/Muscle Up/i.test(text))return{text:'Mobilidade de ombros e retração escapular em pé — 8–12 repetições fáceis.'};
 if(/Barra|Remada neutra|rosca|Suspensão ativa|Posterior de ombros|Retração Argolas/i.test(text))return{pull:true,text:'Remada isométrica com toalha nos pés — 3 esforços de 10–15 s. Sentado, joelhos levemente flexionados, puxe a toalha enquanto as pernas resistem. Esforço moderado, sem trancos e sem prender a toalha em portas. Um bloco por volta, sem duplicar os exercícios de puxar.'};
 if(/Tríceps banco|Triceps Banco|Mergulho/i.test(text))return{text:'Flexão com mãos próximas — 5–8 repetições. Use joelhos apoiados se necessário.'};
 if(/L[- ]?sit|L-SIT|Knee raise|K2E|Leg Raise Suspenso|Elevação de joelhos/i.test(text))return{text:/Elevação de joelhos|Knee raise|K2E|Leg Raise Suspenso/i.test(text)?'Elevação de joelhos/pernas no solo — 6–10 repetições, flexionando os joelhos se necessário.':'Elevação de um pé de cada vez, sentado no chão — 5–8 por lado; para isometria, 5–8 s por lado.'};
 if(/pistol|Subida no banco|Box Jump/i.test(text))return{text:'Afundo com apoio leve na parede — 6–10 repetições por lado, se não houver banco ou apoio adequado.'};
 if(advanced&&/handstand|Escalada Parede/i.test(text))return{text:'Habilidade pendente. Antes de tentar a inversão, aprenda a entrada e a saída com orientação.'};
 if(/Flexão inclinada|Flexão Inclinada/i.test(text)&&!/explosiva/i.test(text))return{text:'Flexão inclinada na parede ou bancada fixa e firme — 8–10 repetições. Ajuste a altura conforme seu controle.'};
 return null;
}
function renderBoxing(){
 const review=day===5,technical=day===1;
 const titles=['Técnica e precisão','Técnica com condicionamento','Revisão da semana'];
 $('session-title').textContent=titles[Math.floor(day/2)];
 const rounds=review?4:technical?[4,5,6,6,6,6][stage-1]:[4,5,6,6,7,8][stage-1];
 const seconds=stage===1?60:stage<=3?90:120;
 $('session-meta').innerHTML=`<span>${review?'20–35':technical?'25–40':'30–45'} min previstos</span><span>${rounds} × ${seconds===60?'1 min':seconds===90?'90 s':'2 min'}</span><span>60 s de descanso</span>`;
 const themes=['Base, guarda e passos sem cruzar os pés.','Jab e retorno à guarda.','Jab–direto, com precisão.','Defesa ensinada pelo treinador e resposta controlada.','Combinação curta com saída lateral.','Sombra livre, integrando os temas anteriores.'];
 const entries=Array.from({length:rounds},(_,i)=>`Round ${i+1} · ${review?'Revisar: ':''}${technical||review?themes[i%themes.length]:i%2===0?'Combinações curtas e controladas.':'Deslocamentos e defesa, mantendo a guarda.'}`);
 $('workout').innerHTML=`<div class="instruction">${review?'Sábado leve: revise os temas da semana, sem acrescentar condicionamento intenso.':technical?'Terça leve: priorize precisão e controle.':'Quinta moderada: 5–6/10 de esforço, preservando a calistenia de sexta.'} Sua aula de boxe substitui esta sessão; não some as duas. Saco ou manopla substituem rounds de sombra quando houver orientação. Sparring não faz parte deste plano.</div>`+renderBlocks([{title:'Aquecimento · 5–8 min',items:['Caminhada rápida, passos leves e mobilidade de ombros e quadril. Corda opcional.']},{title:'Deslocamentos · 5 min',items:['Avance, recue e saia lateralmente, sem cruzar os pés.']},{title:`Rounds · ${rounds} × ${seconds} s`,items:entries},{title:'Finalização · 3–5 min',items:['Caminhada e movimentos leves. Na última semana do mês, quinta e sábado ficam em 15–20 min confortáveis.']}]);
}
function renderBlocks(blocks){currentTrainingBlocks=blocks;return blocks.map((b,i)=>`<section class="workout-section"><h3><span class="block-number">${String(i+1).padStart(2,'0')}</span>${escapeHTML(b.title)}</h3>${b.items.map((t,j)=>`<div class="exercise"><span class="exercise-index">${String(j+1).padStart(2,'0')}</span><p>${escapeHTML(t)}</p></div>`).join('')}</section>`).join('');}
function openAssessment(){
 const criteria=[['Flexão militar: 3 repetições','Barra supinada isométrica: 5 s','Cadeirinha: 20 s'],['Flexão diamante: 3','Barra supinada: 3','Knee L-sit: 10 s','Barra pronada: 1 · mergulho: 2 · flexão militar: 5'],['Flexão com palma à frente: 5','Skin the cat: 3','Dragon flag one leg: 5 s','Barra pronada: 2 · mergulho: 4 · flexão militar: 8'],['Frogstand: 8 s','Vela: 8 s','L-sit: 8 s','Barra pronada: 3 · mergulho: 6 · flexão militar: 12'],['Handstand parede: 20 s','Tucked front lever: 10 s','Full dragon flag: 5 s','Barra pronada: 5 · mergulho: 8 · flexão militar: 16'],['Flexão superman: 3','Oitava: 3 / tucked back lever: 10 s — confirmar com o curso se são alternativas ou ambos','Shoulder flag one leg: 5 s','Barra pronada: 8 · mergulho: 12 · flexão militar: 20']];
 $('assessment-title').textContent=`Avaliação · Etapa ${stage}`;$('assessment-content').innerHTML=`<p>Na última sexta-feira do mês, substitua o treino pela avaliação. Aqueça e descanse 2–3 minutos entre esforços.</p><ul class="assessment-list">${criteria[stage-1].map(c=>`<li>${escapeHTML(c)}</li>`).join('')}</ul><div class="instruction">São referências do curso, sem garantia de resultado em um mês. Teste apenas movimentos aprendidos; habilidades sem equipamento ou preparo ficam “não avaliadas”. As etapas 4 e 5 serão revisadas quando os materiais corretos chegarem.</div>`;$('assessment-dialog').showModal();
}
function renderGuide(){
 const parts=TRAINING_DATA.guide.split(/^## /m).filter(Boolean);
 $('guide-content').innerHTML='<p>O plano segue uma etapa por mês, com três dias de calistenia e três de boxe. Consulte as orientações e o conteúdo completo abaixo.</p>'+parts.map(part=>{const line=part.indexOf('\n'),title=part.slice(0,line).replace(/^# /,''),body=part.slice(line+1);return `<details><summary>${escapeHTML(title)}</summary><pre>${escapeHTML(body)}</pre></details>`;}).join('');
}
$('months').addEventListener('click',e=>{const button=e.target.closest('[data-stage]');if(button)selectStage(Number(button.dataset.stage));});
$('days').addEventListener('click',e=>{const button=e.target.closest('[data-day]');if(button)selectDay(Number(button.dataset.day));});
$('week').addEventListener('change',e=>{week=Number(e.target.value);render();});
$('home-view').addEventListener('click',()=>{home=true;renderSession();});$('original-view').addEventListener('click',()=>{home=false;renderSession();});
$('complete').addEventListener('click',()=>{if(day===6)return;const key=completionKey();if(completed[key])delete completed[key];else completed[key]=true;saveProgress();render();});
$('guide-button').addEventListener('click',()=>{$('guide-dialog').showModal();});$('assessment-button').addEventListener('click',openAssessment);
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
renderGuide();render();
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const tools=[{name:'view_training_session',description:'Abre a ficha do mês, semana e dia escolhidos sem marcar conclusão.',inputSchema:{type:'object',properties:{month:{type:'integer',minimum:1,maximum:6},week:{type:'integer',minimum:1,maximum:5},day:{type:'integer',minimum:0,maximum:6}},required:['month','week','day'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.month)||input.month<1||input.month>6||!Number.isInteger(input.week)||input.week<1||input.week>5||!Number.isInteger(input.day)||input.day<0||input.day>6)throw new Error('Mês, semana ou dia inválido.');stage=input.month;week=input.week;day=input.day;render();return{month:stage,week,day:dayNames[day],title:$('session-title').textContent};}}];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
