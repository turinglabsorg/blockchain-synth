import _ from 'lodash';
var AudioSynth = require('audiosynth');
const axios = require('axios')

var AudioContext = window.AudioContext || window.webkitAudioContext;

var context = new AudioContext();
var synth = new AudioSynth(context);
var txns = []
var hex
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

async function playTransaction(index){
    if(isplaying === false){
        var tx = await axios.get('https://api.blockcypher.com/v1/btc/main/txs/' + txns[index] + '?includeHex=true&limit=1')
        var toplay = tx.data.hex
        playingindex = index
        isplaying = true
        document.getElementById("txplaying").innerHTML = 'Playing TX #' + playingindex;
        document.getElementById("rawtx").innerHTML = toplay;

        synth.setOscWave(0); 
        synth.setDelayFeedback(0.5); 
        synth.setDelayTimeTempo(110, 0.25);
        
        for(var i=0; i <= toplay.length; i+=2){
            var note = parseInt(toplay.substr(i, 2), 16)
            var byte = toplay.substr(i, 2)
            var time = i * 100
            if( i < toplay.length){
                playSound(note, byte, time);
            } else {
                playNext()
            }
        }
    }
}

function playNext(){
    isplaying = false
    var playnext = playingindex++
    if(txns[playnext] !== undefined){
        playTransaction(playNext)
    }else{
        playTransaction(0)
    }
}

async function parselastblock(){
    var blockchain = await axios.get('https://api.blockcypher.com/v1/btc/main')
    var lastblock = blockchain.data
    var block = await axios.get('https://api.blockcypher.com/v1/btc/main/blocks/' + lastblock.hash)
    var blockdata = block.data
    await sleep(2000)
    for(var i = 0; i < blockdata.txids.length; i++){
        txns.push(blockdata.txids[i])
    }
    playTransaction(0)
}

parselastblock()