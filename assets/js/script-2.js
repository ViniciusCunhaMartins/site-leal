// fazer uma função que pegar todos os botoões ao receber um click ele apaga os videos default e envia para o ajax qual é o id, ao mudar o src dos videos ele desabilita o id atual e ativa o anterior se existir
var dominio = ['Sul-Sudeste-Nordeste', 'Sudeste', 'Espírito Santo ', 'Região Metropolitana da Grande Vitória'];
$(document).ready(function(){
  
  $("#wind").click(function(){
    $('#actual').html('Velocidade do vento');
    $("#videos").html(' ');
    $.ajax({url: "/assets/json/files.json", success: function(result){
      $.each(JSON.parse(result), function(i, field){
          for(k in field) {
            var j = k;
            j++;
            $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
            '" src="' + field[k].wind + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
          }
        }); 
      }});
    });

      $("#humidity").click(function(){
        $('#actual').html('Umidade específica');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].humidity + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });
     
      $("#temperature").click(function(){
        $('#actual').html('Temperatura do ar<br>e Pressão atmosférica');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].temperature + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });

      $("#radiation").click(function(){
        $('#actual').html('Radiação solar');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].radiation + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });

      $("#rain").click(function(){
        $('#actual').html('Preciptação');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].rain + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });

      $("#peolico50").click(function(){
        $('#actual').html('Potencial eólico 50 metros');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].peolico50 + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });

      $("#peolico100").click(function(){
        $('#actual').html('Potencial eólico 100 metros');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].peolico100 + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });
      
      $("#peolico150").click(function(){
        $('#actual').html('Potencial eólico 150 metros');
        $("#videos").html(' ');
        $.ajax({url: "assets/json/files.json", success: function(result){
          $.each(JSON.parse(result), function(i, field){
            for(k in field) {
              var j = k;
              j++;
              $("#videos").append('<div class="col-md-3 col-sm-6 text-center"><h6 class="text-lightdark mb-3">DOMÍNIO ' + j + ' - ' + dominio[j-1] + '</h6><video id="vid" autoplay loop="true" controls width="320" height="264"><source id="video' + k + 
              '" src="' + field[k].peolico150 + '" />To view this video please enable JavaScript, and consider upgrading to a web browser that <a href="html5-video-support.html" target="_blank">supports HTML5 video</a></video></div>'); 
            }
          }); 
        }});
      });


});