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
var nextblock = ''

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
    if(txns[parseInt(index)] !== undefined){
        var tx = await axios.get('https://api.blockcypher.com/v1/btc/main/txs/' + txns[index] + '?includeHex=true&limit=1')
        var toplay = tx.data.hex
        playingindex = index
        document.getElementById("txplaying").innerHTML = 'Playing TXID<br><a target="_blank" href="https://live.blockcypher.com/btc/tx/'+ txns[parseInt(index)] +'/">' + txns[parseInt(index)] + '</a>';
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
                setTimeout(function(){
                    console.log('PLAYING NEXT TX')
                    time += 500
                    playNext()
                },time)
            }
        }
    }else{
        console.log('NO TX FOUND!')
    }
}

function playNext(){
    isplaying = false
    var playnext = parseInt(playingindex) + 1
    console.log('NEXT IS #' + playnext)
    for(var k in timeout){
        clearTimeout(timeout[k])
    }
    if(txns[playnext] !== undefined){
        playTransaction(playnext)
    }else{
        parseblock(nextblock)
    }
}

function stopSounds(){
    for(var k in timeout){
        clearTimeout(timeout[k])
    }
}

async function parseblock(block){
    console.log('PARSING BLOCK ' + block)
    var block = await axios.get('https://api.blockcypher.com/v1/btc/main/blocks/' + block)
    nextblock = block.data.prev_block
    isplaying = false
    var blockdata = block.data
    await sleep(2000)
    for(var i = 0; i < blockdata.txids.length; i++){
        txns.push(blockdata.txids[i])
    }
    playTransaction(0)
}

async function parselastblock(){
    var blockchain = await axios.get('https://api.blockcypher.com/v1/btc/main')
    var lastblock = blockchain.data
    parseblock(lastblock.hash)
}

parselastblock()

document.getElementById('stop').onclick = function(){
    stopSounds()
}

document.getElementById('next').onclick = function(){
    playNext()
}

document.body.onkeyup = function(e){
    if(e.keyCode == 32){
        playNext()
    }
}