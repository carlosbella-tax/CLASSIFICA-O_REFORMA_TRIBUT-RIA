/* V137 — Uploads NCM/NBS e identificação do usuário no cabeçalho. */
(function(){
  const empresa=document.getElementById('empresa');
  if(!empresa)return;
  const bloco=document.createElement('div');bloco.className='v137-uploads';
  bloco.innerHTML='<span class="v137-upload-title">Validação em lote</span><label class="v137-upload">UPLOAD NCM<input id="v137-upload-ncm" type="file" accept=".xlsx,.csv" hidden></label><label class="v137-upload">UPLOAD NBS<input id="v137-upload-nbs" type="file" accept=".xlsx,.csv" hidden></label><span class="v137-upload-status" id="v137-upload-status">Suporta cargas acima de 10.000 itens.</span>';
  empresa.insertAdjacentElement('afterend',bloco);
  const marca=document.querySelector('.v123-header .brand')||document.querySelector('.brand');
  if(marca){const usuario=document.createElement('div');usuario.id='v137-usuario';usuario.className='v137-usuario';usuario.textContent='Usuário: aguardando autenticação';marca.insertAdjacentElement('afterend',usuario)}
  const exibirUsuario=({nome,email}={})=>{const el=document.getElementById('v137-usuario');if(el)el.textContent='Usuário: '+(nome||email||'Autenticado')};
  window.addEventListener('classificador:usuario-autenticado',e=>exibirUsuario(e.detail));
  const carregar=(id,tipo)=>{document.getElementById(id).onchange=async e=>{const file=e.target.files[0],status=document.getElementById('v137-upload-status');e.target.value='';if(!file)return;try{status.textContent='Validando '+tipo+' localmente...';await window.classificadorImportarPlanilha(file,tipo);status.textContent=file.name+': '+tipo+' carregado e validado. Consulte Importar NCM / NBS para os resultados e a exportação.'}catch(err){status.textContent=err.message||'Não foi possível validar o arquivo.'}}};
  carregar('v137-upload-ncm','NCM');carregar('v137-upload-nbs','NBS');
  const style=document.createElement('style');style.textContent='.v137-usuario{position:absolute;left:31px;top:61px;color:#bbb6aa;font-size:12px;white-space:nowrap}.v137-uploads{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:8px}.v137-upload-title{font-size:11px;font-weight:800;color:#bbb6aa;text-transform:uppercase;letter-spacing:.04em}.v137-upload{cursor:pointer;padding:7px 9px;border:1px solid #4a4e58;border-radius:7px;background:#292c34;color:#f0eee8;font-size:11px;font-weight:800}.v137-upload:hover{border-color:#ff761c;color:#fff}.v137-upload-status{flex-basis:100%;font-size:11px;color:#bbb6aa}@media(max-width:1000px){.v137-usuario{top:47px}.v137-uploads{margin-bottom:10px}}';document.head.appendChild(style);
})();
