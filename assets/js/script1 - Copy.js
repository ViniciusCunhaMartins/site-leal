// fazer uma função que pegar todos os botoões ao receber um click ele apaga os videos default e envia para o ajax qual é o id, ao mudar o src dos videos ele desabilita o id atual e ativa o anterior se existir
var dominio = ['Sul-Sudeste-Nordeste', 'Sudeste', 'Espírito Santo ', 'Região Metropolitana da Grande Vitória'];
$(document).ready(function () {

  function setVidNormal(vid) {
    $(vid).attr("width", 420)
  }

  $("#peolico50").click(function () {
    $('#actual').html('Potencial eólico - 50 metros');
    $.ajax({
      url: "assets/json/files1.json", success: function (result) {
        var videos = result;
        for (let i = 0, j = 1; i < videos.videos.length; i++) {
          $("#vid" + j).attr("src", videos.videos[i].peolico50)
          setVidNormal("#vid" + j)
          j++
        }
      }
    });
  });

  $("#peolico100").click(function () {
    $('#actual').html('Potencial eólico - 100 metros');
    $.ajax({
      url: "assets/json/files1.json", success: function (result) {
        var videos = result;
        for (let i = 0, j = 1; i < videos.videos.length; i++) {
          $("#vid" + j).attr("src", videos.videos[i].peolico100)
          setVidNormal("#vid" + j)
          j++
        }
      }
    });
  });

  $("#peolico150").click(function () {
    $('#actual').html('Potencial eólico - 150 metros');
    $.ajax({
      url: "assets/json/files1.json", success: function (result) {
        var videos = result;
        for (let i = 0, j = 1; i < videos.videos.length; i++) {
          $("#vid" + j).attr("src", videos.videos[i].peolico150)
          setVidNormal("#vid" + j)
          j++
        }
      }
    });
  });
});
