/* Minimal module index renderer (static data only) */
(function(){
  function render(){
    var el = document.getElementById('module-index-data');
    if(!el) return;
    var list = [];
    try{ list = JSON.parse(el.textContent || '[]'); }catch(e){ list = []; }
    var grid = document.getElementById('module-grid');
    if(!grid) return;
    grid.innerHTML = (list||[]).map(function(it){
      var href = it.href || '#';
      var title = it.title || '未命名';
      var desc = it.desc || '';
      var status = it.status || '';
      var badge = status ? ('<span class="pill" style="margin-top:6px;">'+status+'</span>') : '';
      return '<a class="card" href="'+href+'">'
           +   '<div class="card-title">'+title+'</div>'
           +   '<div class="card-desc">'+desc+'</div>'
           +   badge
           + '</a>';
    }).join('');
  }
  document.addEventListener('DOMContentLoaded', render);
})();