

function playPause(video) {
    var myVideo = document.getElementById("vid" + video);
    if (myVideo.paused)
        myVideo.play(video);
    else
        myVideo.pause(video);
}

function fast(video) {
    var myVideo = document.getElementById("vid" + video);
    var vel = document.getElementById("vel"+ video);
    myVideo.load(video);
    vel.value = myVideo.defaultPlaybackRate;
    if (myVideo.defaultPlaybackRate < 16) {

        myVideo.defaultPlaybackRate = myVideo.defaultPlaybackRate + 1;
    }
    vel.value = myVideo.defaultPlaybackRate;
    loadAndPlay(video);
}
function slow(video) {
    var myVideo = document.getElementById("vid" + video);
    var vel = document.getElementById("vel"+ video);
    myVideo.load(video);
    vel.value = myVideo.defaultPlaybackRate;
    if (myVideo.defaultPlaybackRate > 0) {
        myVideo.defaultPlaybackRate = myVideo.defaultPlaybackRate - 1;

    }

    vel.value = myVideo.defaultPlaybackRate;
    loadAndPlay(video);
}
function loadAndPlay(video) {
    var myVideo = document.getElementById("vid" + video);
    myVideo.load();
    myVideo.play();
}

function loop(video) {
    var myVideo = document.getElementById("vid" + video);
    if (myVideo.loop){
        myVideo.loop = false;
        $('#loop'+ video).html('ligar loop')
    }else{
        myVideo.loop = true;
        myVideo.play();

        $('#loop'+ video).html('desligar loop')
    }

}

function makeBig(video) {
    var myVideo = document.getElementById("vid" + video);
    myVideo.width = 560;
}

function makeSmall(video) {
    var myVideo = document.getElementById("vid" + video);
    myVideo.width = 320;
}

function makeNormal(video) {
    var myVideo = document.getElementById("vid" + video);
    myVideo.width = 420;
} 