import _ from 'lodash';
var AudioSynth = require('audiosynth');
const axios = require('axios')

var AudioContext = window.AudioContext || window.webkitAudioContext;

var context = new AudioContext();
var synth = new AudioSynth(context);
var hex = []
var isplaying = false
var timeout = []
var playingindex = 0

function sleep(ms) {
   return new Promise(resolve => setTimeout(resolve, ms));
}

function playSound(note, byte, time){
    timeout[time] = setTimeout(function(){
        synth.playNote(note, 1.0, 1.0, 0);
        document.getElementById("nowplaying").innerHTML = byte;
    },time)
}

function playTransaction(index){
    if(isplaying === false){
        playingindex = index
        isplaying = true
        document.getElementById("txplaying").innerHTML = 'Playing ' + index + ' TX';
        var toplay = hex[index]
        document.getElementById("rawtx").innerHTML = toplay;

        synth.setOscWave(0); 
        synth.setDelayFeedback(0.5); 
        synth.setDelayTimeTempo(110, 0.25);
        
        for(var i=0; i < toplay.length; i+=2){
            var note = parseInt(toplay.substr(i, 2), 16)
            console.log(note)
            var byte = toplay.substr(i, 2)
            var time = i * 100
            playSound(note, byte, time);
        }
    }
}

function playNext(){
    timeout.forEach(function(value, index){
        clearTimeout(timeout[index])
    })
    isplaying = false
    var playnext = playingindex++
    if(raw[playnext] !== undefined){
        playTransaction(playNext)
    }else{
        playTransaction(0)
    }
}

async function parselastblock(){
    var blockchain = await axios.get('https://api.blockcypher.com/v1/btc/main')
    var lastblock = blockchain.data
    await sleep(2000)
    var block = await axios.get('https://api.blockcypher.com/v1/btc/main/blocks/' + lastblock.hash)
    var blockdata = block.data
    await sleep(2000)
    for(var i = 0; i < blockdata.txids.length; i++){
        var tx = await axios.get('https://api.blockcypher.com/v1/btc/main/txs/' + blockdata.txids[i] + '?includeHex=true&limit=1')
        var txhex = tx.data.hex
        hex.push(txhex)
        await sleep(4000)
        document.getElementById("nextbtn").style.display = block 
        playTransaction(i)
    }
}

parselastblock()
document.getElementById("nextbtn").addEventListener("click", playNext);