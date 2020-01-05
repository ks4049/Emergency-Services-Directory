const myAPP = (function(){
  //API url for ESD
  const url="https://people.rit.edu/dmgics/754/23/proxy.php";
  let recentSearches = {},
      locByType = {},
      peopleBySite={};

  //init on load of body
  function init(){
      //Gets the organization types
      getOrgTypes();
      //Gets Organization states
      getOrgStates();

      //animation of elements
      $(".animation").hierarchicalDisplay();
      
      // on change of org state
      $("#state").on("change", function(){
      let stateValue = this.value;   
        $.ajax({
            type: "GET",
            cache: false,
            url: url,
            data: {path: "/Cities?state="+stateValue},
            dataType: "xml",
            success: function(data, status){          
              let selectOpts = `<div class="form-group">
                                <label for="city">City</label>
                                <select name="town" id="city" class="form-control form-control-sm">`;
              if($(data).find("error").length!== 0){                

              } else {
                  selectOpts += "<option value=''>--cities--</option>"

                  $("row", data).each(function(){
                    selectOpts+= "<option value='"
                      + $("city", this).text()                  
                      +"'>"
                      + $("city", this).text()
                      + "</option>"
                  });
                  selectOpts+=`</select></div>` 
                  if($("#city").length){
                    $("#state").parent().next().replaceWith(selectOpts);
                  } else{
                    $("#state").parent().after(selectOpts);
                  }
              }          
            }
        });
      });

      // on click of search button
      $("#btnSearch").on('click', function(){
        showResults();
      });

      //on collapsing of the buttons
      $('#group').on('show.bs.collapse', '.collapse', function(){
        $('#group').find('.collapse.in').collapse('hide');
        $(this).hierarchicalDisplay('hide');
      });

      // search views button is clicked (bootstrap collapsible)
      $("#recent-search").on('shown.bs.collapse', function(){    
        $("#tableOutput").hide();
        //get the recently viewed organizations using the custom jquery plugin
        $(this).getRecentViews(recentSearches);
        $(this).hierarchicalDisplay('show');
      });

      // search form is clicked
      $("#search-form").on('shown.bs.collapse', function(){    
        $("#tableOutput").show();
      });

      // on click of links on results table
      $("#tableOutput").on("click", "a", function(){        
        showDetails($(this).attr("id"), $(this).text().replace(/'/g, "\\'"), $(this).attr("class"));
      });

      // on click of tabs in modal
      $(".modalContent").on("click", "a", function(){        
        let fnName = `get${$(this).attr("href").slice(1)}Info(${$(this).attr('id')})`;        
        eval(fnName);
      });

      // on change event of location type
      $(".modalContent").on("change", "#locType", function(){
        let location = locByType[this.value];
        let table = `<p></p><div class="locMap row"><div class="locInfo col-xs-4">
                    <table class="table table-borderless">
                    <tbody>`;    
        for(let key in location){
          table+=`<tr><th scope="row">${key}</th><td>${checkIfNull(location[key])}</td></tr>`;      
        }    
        table+=`</tbody></table></div><div id="googleMap" class="map col-xs-8"></div></div>`;
        if($("#Locations .locMap").children().length==0 ){
          $(".modal-body #Locations").append(table);      
        } else {   
          $("#Locations .locMap").replaceWith(table);
        }
        let address = checkIfNull(location["Address"])+ ","+checkIfNull(location["City"])+ ","+checkIfNull(location["County"])+ ","+checkIfNull(location["State"])+ " "+checkIfNull(location["Zip"])+ ", USA";    
        initMap(address);
      });

      // on change event of site type
      $(".modalContent").on("change", "#siteId", function(){
        let site = peopleBySite[this.value];
        let table = `<p></p><div class="siteInfo">
                    <table class="table table-borderless">
                    <thead>
                      <tr>
                        <th>Site ${this.value}: ${site["Address"]}</th><th></th></tr>`;
            if(site["personCount"] > 0){        
              table+= `<tr><th>Name</th><th>Role</th></tr></thead><tbody>`        
              for(let i=0, len=site["persons"].length; i<len; i++){
                table+= `<tr><td>${site["persons"][i]["Name"]}</td><td>${site["persons"][i]["Role"]}</td></tr>`
              }
              table+=`</tbody></table></div>`;
            } else {
              table+=`</thead></table><p>Person information not available for this site.</p></div>`;
            }      
        if($("#People .siteInfo").children().length==0 ){      
          $(".modal-body #People").append(table);  
        } else {
          $("#People .siteInfo").replaceWith(table);
        }      
      });  
  }

  // getting org types 
  function getOrgTypes(){
    $.ajax({
        type: "GET", //HTTP method        
        async: true, //is asynchronous are not, default: true
        cache: false,
        url: url,
        data: {path: "/OrgTypes"},
        dataType: "xml", //content type of the response
        success: function(data, status){
          let opts="";

          if($(data).find("error").length!== 0){
            // do something to handle error

          } else {
              opts += "<option value=''>All organization types</option>"

              $("row", data).each(function(){
                opts+= "<option value='"
                  + $("type", this).text()              
                  +"'>"
                  + $("type", this).text()
                  + "</option>"
              });
              $("#orgType").html(opts);
          }
        },
    });
  }

  //getting the states
  function getOrgStates(){
    $.ajax({
        type: "GET", //HTTP method         
        cache: false,
        url: url,
        data: {path: "/States"},
        dataType: "xml", //content type of the response
        success: function(data, status){

          let opts="";

          if($(data).find("error").length!== 0){
            // do something to handle error

          } else {
              opts += "<option value=''>All States</option>"

              $("row", data).each(function(){
                opts+= "<option value='"
                  + $("State", this).text()                  
                  +"'>"
                  + $("State", this).text()
                  + "</option>"
              });
              $("#state").html(opts);
          }
        },

    });
  }

  //Details UI modal
  function showDetails(orgId, orgName, orgType){
    // keeping track of history of views    
    if(recentSearches[orgId]===undefined){
      recentSearches[orgId] = {};
      recentSearches[orgId]["Name"] = orgName;
      recentSearches[orgId]["Type"] = orgType;
    }
    let modal = ` <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h3 class="modal-title" id="exampleModalLabel">${orgName.toUpperCase()}</h3>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
            </div>            
          </div>
        </div>
      </div>`;
      $(".modalContent").html(modal);
      $.ajax({
        type: "GET",
        async: true,        
        url: url,
        data: {
            path: "/Application/Tabs?orgId="+orgId
        },
        dataType: "xml",
        success: function(data, status) {              
          if($(data).find("error").length!== 0){
            // handling error

          } else {            
              if($(".modal-body ul").length>0){
                $(".modal-body").tabs("destroy");
              }
              let tabs="<ul>";
              $("row", data).each(function(){
                  //let fnName = "get"+$("Tab", this).text()+"Info";
                  tabs+=`<li> <a href="#${$("Tab", this).text()}" id="${orgId}">
                        ${$("Tab", this).text()} </a></li>`
              });
              tabs+="</ul>";
              $("row", data).each(function(){                  
                  tabs+=`<div id=${$("Tab", this).text()}></div>`;
              });
              $(".modal-body").html(tabs);
              $(".modal-body").tabs(); //usage of jquery-ui tabs plugin
              $("#exampleModal").draggable();              
            // invoking the active tab
            $($(".ui-tabs-nav li[tabIndex^=0]")[0]).find("a").click();
          }
        }
      });
  }

  //showing table results
  function showResults() {
    $.ajax({      
      url: url,
      data: {
        path: "/Organizations?"+ $("#search-form").serialize()
      },
      dataType: "xml",
      success: function(data,status){        

        let ouptut = "";

        $("#tableOutput").html(""); 
        //should test for error
        let searchValues = $("#search-form").serializeArray();
        //if no search results
        //if($(data).find("row"))
        output = `<div class='results'><h3>Results:`;
        if($("row", data).length===0) {
            output+= "</h3><p>No data matches for: ";
            for(let i=0, len=searchValues.length; i<len; i++){
              let searchKey = searchValues[i]["name"].toUpperCase();
              let searchValue = searchValues[i]["value"];
              if(searchValue.length!==0 ){
                if(i!=0){
                  output += '> '  
                }
                output += searchKey+": "+searchValue;                
              }              
            }
            output+=`</p></div>`
            $("#tableOutput").html(output);
        } else {            
            let table = `<table id="results-table" class="tablesorter tablesorter-blue">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>City</th>
                          <th>State</th>
                          <th>County</th>
                          <th>Zip</th>
                        </tr>
                      </thead>`;
            let resultCount = 0;
            $("row", data).each(function(){
              //or ${$("type",this).text()}
              if($(this).find("Name").text()!="null"){
                resultCount++;
                table+= `<tr>
                          <td>${$(this).find("type").text()}</td> 
                          <td><a href="#" id=${$(this).find("OrganizationID").text()} class='${$(this).find("type").text()}' data-toggle="modal" data-target="#exampleModal">${$(this).find("Name").text().toUpperCase()}</a></td>
                          <td>${$(this).find("Email").text()}</td>
                          <td>${$(this).find("city").text()}</td>
                          <td>${$(this).find("State").text()}</td>  
                          <td>${$(this).find("CountyName").text()}</td>
                          <td>${$(this).find("zip").text()}</td>                            
                        </tr>`
              }
            });
            output += ` (${resultCount} found) </h3>`+table;
            output+="</table></div>";
            $("#tableOutput").html(output);

            // usage of table sorter jquery plugin
            $("#results-table").tablesorter({
              headers : {
                2: {sorter: false}
              }
            });
        }
      }
    })
  }

  //Routine to check null data
  function checkIfNull(text){
    if(text.length===0 || text==="null"){
      return "";
    }
    return text;
  }

  //GET general tab data
  function getGeneralInfo(orgId){
    // make ajax call to get the general info
    if($(".modal-body #General").children().length > 0){
      return;
    }
    let info = '';
    $.ajax({
      type: "GET",
      url: url,
      async: true,      
      dataType: "xml",
      data: {path: "/"+orgId+"/General"},
      success: function(data, status){        
        let orgName = checkIfNull($("name", data).text()).toUpperCase(),
          desc =  checkIfNull($("decsription", data).text()),
          email = checkIfNull($("email", data).text()),
          website = checkIfNull($("website", data).text()),
          numMem = checkIfNull($("nummembers", data).text())===""? "": parseInt($("nummembers", data).text()),
          numCalls = checkIfNull($("numcalls", data).text())===""? " ": parseInt($("numcalls", data).text()),
          servArea = checkIfNull($("servicearea", data).text());
          info+=`<h4>General Information </h4>
                 <table class="table table-borderless">
                  <tbody>
                  <tr>
                    <th scope="row">Name </th>
                    <td> ${orgName} </td>
                  </tr>                                              
                  <tr>
                    <th scope="row">Website</th>                    
                    <td>
                      <a href='${website}'>${website}</a>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Email</th>                    
                    <td>
                      <a href='mailto:${email}'>${email}</a>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Description</th>                    
                    <td>${desc}</td>
                  </tr>
                  <tr>
                    <th scope="row">Number of members</th>                    
                    <td>${numMem}</td>
                  </tr>
                  <tr>
                    <th scope="row">Number of calls last year</th>                    
                    <td>${numCalls}</td>
                  </tr>
                  </tbody>
                  </table>
                  `;
          $(".modal-body #General").html(info);
      }
    });    
  }

  //GET treatment tab data
  function getTreatmentInfo(orgId){
    if($(".modal-body #Treatment").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Treatments"},
      success: function(data, status){        
        let count = parseInt($("count", data).text());
        info+=`<h4>Treatments</h4>`
        if(count > 0){
          let infoData=[];
          infoData.push(["Type","Abbreviation"]);          
          $("treatment", data).each(function(){
            infoData.push([checkIfNull($("type", this).text()), checkIfNull($("abbreviation", this).text())]);
          });
          info+= createTable(infoData);        
        } else {
          info+=`<p>No treatments available.</p>
                 `;
        }        
        $(".modal-body #Treatment").html(info);
      }      
    });
  }

  //GET Training tab data
  function getTrainingInfo(orgId){
    if($(".modal-body #Training").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Training"},
      success: function(data, status){        
        let count = parseInt($("count", data).text());
        info+=`<h4>Services/Training</h4>`
        if(count > 0){
          let infoData=[];
          infoData.push(["Type","Abbreviation"]);          
          $("training", data).each(function(){
            infoData.push([checkIfNull($("type", this).text()), checkIfNull($("abbreviation", this).text())]);
          });          
          info+= createTable(infoData);
        } else {
          info+=`<p>No services available.</p>
                 `;
        }        
        $(".modal-body #Training").html(info);
      }      
    });
  }

  //GET Facilities tab data
  function getFacilitiesInfo(orgId) {
    if($(".modal-body #Facilities").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Facilities"},
      success: function(data, status){          
        let count = parseInt($("count", data).text());
        info+=`<h4>Facilities</h4>`
        if(count > 0){
          let infoData=[];
          infoData.push(["Name","Quantity","Description"]);          
          $("facility", data).each(function(){
            infoData.push([checkIfNull($("type", this).text()), checkIfNull($("quantity", this).text()), checkIfNull($("description", this).text())]);            
          });
          info+= createTable(infoData);       
        } else {
          info+=`<p>No facilities available.</p>`;
        }        
        $(".modal-body #Facilities").html(info);
      }      
    });
  }

  //GET Physicians tab data
  function getPhysiciansInfo(orgId) {
    if($(".modal-body #Physicians").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Physicians"},
      success: function(data, status){        
        let count = parseInt($("count", data).text());
        info+=`<h4>Physicians with Admitting Privilages</h4>`
        if(count > 0){
          let infoData=[];
          infoData.push(["Name","License","Contact"]);
          $("physician", data).each(function(){
            infoData.push([checkIfNull($("fName", this).text())+" "+checkIfNull($("mName", this).text())+" "+checkIfNull($("lName", this).text()), checkIfNull($("license", this).text()), checkIfNull($("phone", this).text())]);            
          });
          info+= createTable(infoData);                  
        } else {
          info+=`<p>No facilities available.</p>`;
        }        
        $(".modal-body #Physicians").html(info);
      }      
    });
  }

  //GET Equipment Tab data
  function getEquipmentInfo(orgId) {
    if($(".modal-body #Equipment").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Equipment"},
      success: function(data, status){   
        let count = parseInt($("count", data).text());
        info+=`<h4>Equipments</h4>`
        if(count > 0){
          let infoData=[];
          infoData.push(["Name","Quantity","Description"]);          
          $("equipment", data).each(function(){
            infoData.push([checkIfNull($("type", this).text()), checkIfNull($("quantity", this).text()), checkIfNull($("description", this).text())]);            
          });
          info+= createTable(infoData);                  
        } else {
          info+=`<p>No equipments available.</p>`;
        }        
        $(".modal-body #Equipment").html(info);
      }      
    });
  }

  //to create table information for the common tabs
  function createTable(data){
    let table=`<table class="table table-borderless">
                <thead>
                  <tr>`;
      //populate the table heading
      let heading = data[0];
      for(let i=0,len=heading.length; i<len; i++){
        table+=`<th scope="col">${heading[i]}</th>`;
      }     
      table+= `</tr></thead><tbody>`;
      for(let i=1, len=data.length; i<len; i++){
        table+=`<tr>`;
        for(let j=0, len_1=data[i].length; j<len_1; j++){
          table+=`<td>${data[i][j]}</td>`;
        }
        table+=`</tr>`
      }
      table+=`</tbody></table></div>`;
      return table;
  }

  //GET Locations tab data 
  function getLocationsInfo(orgId) {
    if($(".modal-body #Locations").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/Locations"},
      success: function(data, status){         
        let count = parseInt($("count", data).text());
        info+=`<h4>Location Information</h4>`
        if(count > 0){
          // create a dictionary with type as key and value as object with other information
          
          $("location", data).each(function(){
            let locInfo = {};          
            locInfo["Address"] = $("address1", this).text()+ " "+ $("address", this).text();
            locInfo["City"] = $("city", this).text();
            locInfo["State"] = $("state", this).text();
            locInfo["County"] = $("countyName", this).text();
            locInfo["Zip"] = $("zip", this).text();  
            locInfo["Phone"] = $("phone", this).text();
            locInfo["TTYPhone"] = $("ttyPhone", this).text();
            locInfo["Fax"] = $("fax", this).text();
            locInfo["Latitude"] = $("latitude", this).text();
            locInfo["Longitude"] = $("longitude", this).text();
            locByType[$("type",this).text()] = locInfo;
          });
          // after creating the dictionary, create the view for locations
          info += '<select name="loc-type" id="locType" class="form-control form-control-sm">';
          for (let key in locByType){
            info+= `<option value=${key}>Location: ${key} </option>`;            
          }
          info += `</select>`          
        } else {
          info+=`<p>Locations data not available.</p>`;
        }        
        $(".modal-body #Locations").html(info);
        $("#locType").trigger('change');        
      }      
    });
  }

  //Initialize google map using address
  function initMap(address) {
    let googleM;
    let geocoder;
    let infowindow = new google.maps.InfoWindow;        
    googleM = new google.maps.Map(document.getElementById("googleMap"), {
      zoom: 8,
      center: {lat: -34.397, lng: 150.644},
      // mapTypeId: google.maps.MapTypeId.HYBRID
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      }
    });       
    geocoder = new google.maps.Geocoder(),    
    geocoder.geocode({'address': address}, function(results, status) {
      if (status === 'OK') {                
        google.maps.event.trigger(googleM, "resize"); 
        googleM.setCenter(results[0].geometry.location);
        var marker = new google.maps.Marker({
          map: googleM,
          position: results[0].geometry.location
        });
        infowindow.setContent(results[0].formatted_address);
        infowindow.open(googleM, marker);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });    
  }
  
  //GET People tab data
  function getPeopleInfo(orgId){
    if($(".modal-body #People").children().length > 0){
      return;
    }
    let info='';
    $.ajax({
      type: "GET",
      async: true,
      url: url,
      dataType: "xml",
      data: {path: "/"+orgId+"/People"},
      success: function(data, status){        
        let count = parseInt($("siteCount", data).text());
        info+=`<h4>People</h4>`
        if(count > 0){          
          // create a dictionary with type as key and value as object with other information
          $("site", data).each(function(){
            let siteInfo = {}, k=0;
            siteInfo["Address"] = checkIfNull($(this).attr("address"));            
            siteInfo["Site Type"] = checkIfNull($(this).attr("siteType"));
            siteInfo["personCount"] = parseInt($("personCount", this).text());
            if(siteInfo["personCount"] > 0){
              siteInfo["persons"] = [];
              $("person", this).each(function(){
                let personInfo = {};
                personInfo["Name"] = checkIfNull($("fName", this).text())+ " "+ checkIfNull($("mName", this).text())+ " "+ checkIfNull($("lName", this).text());
                personInfo["Role"] = checkIfNull($("role", this).text());
                siteInfo["persons"][k++] = personInfo;
              });              
            }
            peopleBySite[$(this).attr("siteId")] = siteInfo;
          });
          // generate dropdown
          info += `<div class="form-group"><label for="siteId">Choose a site</label><select name="site-id" id="siteId" class="form-control form-control-sm">`;
          for (let key in peopleBySite){
            info+= `<option value=${key}>${peopleBySite[key]["Address"]}</option>`;
          }
          info += `</select>`          
        } else {
          info+=`<p>People information not available.</p>`;
        }        
        $(".modal-body #People").html(info);
        $("#siteId").trigger('change'); 
      }
    });
  }
  
  return {
    init: init //publicly exposed API
  }

})();