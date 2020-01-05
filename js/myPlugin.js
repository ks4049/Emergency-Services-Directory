//custom jquery plugin
(function($) {
  // jQuery plugin definition
  $.fn.getRecentViews = function(recentSearches){
    // traverse all nodes in the jquery collection      
    this.each(function() {
      // generate table with type and name
      let content=`<table class="table">`;
      if(Object.keys(recentSearches).length==0){
        content = `<tbody><tr><th scope="row">You haven't searched for any organizations.</th></tr>`;          
      }else{
        content+=`<thead><tr><th scope="col">Organization Type</th><th scope="col">Organization Name</th></tr></thead><tbody>`;
        for(let key in recentSearches){
          content+=`<tr><td>${recentSearches[key]["Type"]}</td>
          <td><a href="#" onclick="showDetails(${key}, '${recentSearches[key]["Name"].replace(/'/g, "\\'")}', '${recentSearches[key]["Type"]}')" data-toggle="modal" data-target="#exampleModal">${recentSearches[key]["Name"].toUpperCase()}</a></td></tr>`;
        }
      }
      content+=`</tbody></table>`;
      $(this).html(content);        
    });      
    return this; 
  };
})(jQuery);