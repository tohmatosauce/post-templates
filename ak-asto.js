function ak_asto(parent_){
 parent_.setAttribute("data--listener", "true");
 /* since a ton of this relies on accurate client rect dimensions, we need to load in the darkmode faster */
 if(localStorage.getItem('darkMode') === 'true') {
  parent_.classList.add("darkmode");
 }
 const gridder = (e) => {
  const sparse_longest = (arrays) => {
   const lengths = arrays.map(arr => arr.length);
   const max = Math.max(...lengths);
   return max;
  } 
  const fill_sparse = (grid, dif, fill) => {
   const pattern = (_grid = grid) => {
    const _index = _grid.filter(arr => arr.indexOf("operator") > -1)[0].indexOf("operator");
    const str = [...Array(_grid.length)].map((_, i) => _grid[i][_index]).join("-"), 
          rng = str.replaceAll(/range|special|extender/g,"0"),
          op = rng.replaceAll(/operator/g, "1"),
          empties = op.replaceAll(/(?<=(?:0|1).*?)empty(?=.*?(?:0|1))/g,"0");
    const result = empties.split("-").filter(x => x !== "empty");
    return result;
   }
   const matching = [
    ["1"], //1x balance (right)
    ["1","0"], //1x balance (left)
    ["0","1","0"], //1x balance (right)
    ["1","0","0"], //2x w/ left priority
    ["0","0","1"], //2x w/ right priority
    ["0","1","0","0"], //1x w/ left priority
    ["0","0","1","0"], //1x w/ right priority
    ["1","0","0","0"], //1x w/ left priority
    ["0","0","0","1"] //1x w/ right priority
   ];
   const pattern_index = matching.map(x => x.join()).indexOf( pattern(grid).join()),
         scale2x = pattern_index===3 || pattern_index===4,
         right_priority = pattern_index%2 === 0,
         _new_grid = grid;
   for(let i=0, _dif=dif; _dif > 0; _dif--, i++){
    if( (right_priority && (scale2x || i%2===0)) || (!right_priority && !scale2x && i%2===1)) { 
     _new_grid.push(Array(fill).fill("empty")) 
    } else {
     _new_grid.unshift(Array(fill).fill("empty")) 
    }
   }
   return _new_grid;
  }
  
  // we want both row & col so we can get the longest lengths on the col and row axises
  const grid_sparse_layout_x = e.getAttribute("ak-grid").split("'").map(row => row.trim()).filter(row => row !== '').map(row => row.split(" ")), 
        sparse_row_longest = sparse_longest(grid_sparse_layout_x),
        grid_sparse_layout_y = [...Array(sparse_row_longest)].map((_,i) => grid_sparse_layout_x.map(row => row[i])),
        sparse_col_longest = sparse_longest(grid_sparse_layout_y);
  
  // difference variables will be used to calculate how to fill in the sparse grid (if needed)
  const grid_length = 5,
        grid_x_difference = grid_length - sparse_col_longest,
        grid_y_difference = grid_length - sparse_row_longest;
  
  /* catching error mistakes lol */
  if(grid_sparse_layout_x.flat().filter(row => row.indexOf("operator") > -1).length > 1) {
   console.error("[Arknights Template]: Grid can only contain one tile designated as operator."); return false;
  } else if(grid_sparse_layout_x.flat().filter(row => row.indexOf("operator") > -1).length < 1) {
   console.error("[Arknights Template]: Grid must contain one tile designated as operator."); return false;
  }
  if((grid_x_difference + grid_y_difference) < 0) {
   console.error("[Arknights Template]: Grid is too big! Max grid size is 5x5"); return false;
  } else if((grid_x_difference + grid_y_difference) >= (grid_length-1)*2) {
   console.error("[Arknights Template]: Grid cannot be empty grid"); return false;
  }
  
  const grid_y = fill_sparse(grid_sparse_layout_y, grid_y_difference, grid_length - grid_x_difference);
  const grid_x = fill_sparse( grid_y[0].map((_,i) => grid_y.map(row => row[i])), grid_x_difference, grid_length );
  
  return grid_x.flat().map(x => x===undefined ? "empty" : x)
 }
 parent_.querySelectorAll(".asto-grid[ak-grid]").forEach(e => e.innerHTML += gridder(e).map(x => "<tile class='"+x+"'></tile>", "").join(""));
 
 const attr = {
  code: parent_.getAttribute("ak-code-name"),
  class: parent_.getAttribute("ak-class-icon").toLowerCase(),
  branch: parent_.getAttribute("ak-subclass-icon").toLowerCase(),
  alt: parent_.getAttribute("ak-alt-name") ?? parent_.getAttribute("ak-code-name")
 }
 const ak_subclass_meaning = new Map([
  ["primal-fighter","primal"], ["physician","medic"], ["chain-healer","chain"]
 ])
 Object.entries(attr).forEach(([k,v]) => {
  const html = parent_.querySelectorAll(".hb-" + k),
        icon = parent_.querySelectorAll(".hb-icon-" + k);
  html.forEach(x => x.innerHTML += ak_subclass_meaning.get(v) ?? v)
  icon.forEach(x => x.classList.add("ak-"+v) )
 })
 
 const file_height = (file) => {
  const thisHeight = file.offsetHeight, 
      siblingsX = parent_.querySelectorAll(".asto-file-field").length,
      parentHeight = parent_.querySelector(".asto-archives").offsetHeight,
      gap = 10,
      height = parent_.querySelector(".asto-archives").clientHeight - (thisHeight*siblingsX + (gap*(siblingsX-1)));
  return height;
 }
 
 const btns = parent_.querySelectorAll(".asto_btn"),
       slides = parent_.querySelectorAll(".asto_slide");
 btns.forEach(btn => btn.addEventListener("click",function(){
  const id = btn.id;
  parent_.querySelectorAll(".active").forEach(deactivate => deactivate.classList.remove("active"));
  btn.classList.add("active");
  parent_.querySelector(".asto_slide#"+id).classList.add("active");
  switch(id){
   case("file"):
    const first_file = parent_.querySelectorAll(".asto-file-field")[0];
    first_file.closest(".asto-archives").setAttribute("style", "--height:"+file_height(first_file)+"px")
    first_file.classList.add("active");
   break;
  }
 }))
 
 parent_.querySelectorAll(".asto-file-field").forEach(file => file.querySelector(".field").addEventListener("click", function(evt){
  const sibling = parent_.querySelector(".asto-file-field.active");
  const height = file_height(file);
  if(sibling) {
   sibling.querySelector(".value").scrollTop = 0;
   sibling.classList.remove("active");
   if(sibling.isSameNode(file)) return true;
  }
  file.closest(".asto-archives").setAttribute("style", "--height:"+height+"px")
  file.classList.add("active");
 }));
 
 /* this is a nightmare what am i doing */
 const is_collapsed_skills = parent_.getBoundingClientRect().width <= 840;
 const skills = parent_.querySelectorAll(".asto-skillstia"),
       skills_parent = parent_.querySelector(".asto-skills"),
       skills_values = parent_.querySelectorAll(".asto-skillstia .value");
 const skills_parent_height = is_collapsed_skills ? parent_.querySelector(".asto_slide#skills").clientHeight - parent_.querySelector(".asto-traits").offsetHeight - 10 : skills_parent.clientHeight;
 const skills_values_sum = Array.from(parent_.querySelectorAll(".asto-skills .value")).reduce((acc,cur)=>acc+cur.getBoundingClientRect().height,0);
 const skills_height_sum = Array.from(skills).reduce((acc,cur) => acc+cur.getBoundingClientRect().height,0)
 const skills_reserved_height = skills_height_sum - skills_values_sum + (30*skills.length - 1);
 const skills_no_available_space = skills_parent_height < (skills_values_sum + skills_reserved_height);
 if(skills_no_available_space) {
  const _balanced_height = (skills_parent_height - skills_reserved_height) / skills.length;
  const _vals_under = Array.from(skills_values).filter(x => x.getBoundingClientRect().height < _balanced_height);
  const _vals_over = Array.from(skills_values).filter(x => x.getBoundingClientRect().height > _balanced_height);
  const _vals_excess = _vals_under.reduce((acc,cur)=>acc+(_balanced_height - cur.getBoundingClientRect().height),0);
  _vals_over.forEach(x => x.closest(".asto-skillstia").setAttribute("style","--max-y:"+Math.floor(_balanced_height+(_vals_excess/_vals_over.length))+"px"))
 } else if(is_collapsed_skills) {
  parent_.querySelector(".asto_slide#skills").setAttribute("style",'grid-template:"skill" auto "trait" 1fr / 100%;')
 }
 
 parent_.classList.remove("darkmode"); // this is so stupud but necessary
}

document.querySelectorAll(".ak_astoria").forEach(e => {
 if(e.getAttribute('data--listener') !== 'true') {addEventListener("load", ak_asto(e))}
})
