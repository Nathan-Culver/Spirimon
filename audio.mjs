// Original synthesized compositions; no recordings or third-party music.
export const MAP_MELODY=[62,69,74,76,74,69,67,69,62,65,69,74,72,69,67,65];
export const BATTLE_MELODY=[62,62,69,74,72,69,67,69,65,65,72,77,76,72,69,67];
export const VOCAL_MELODY=[62,65,69,67,65,62,60,62,67,69,74,72,69,67,65,62];
export function eventTime(event){const n=event?.timeStamp;return Number.isFinite(n)?n>1e12?n-performance.timeOrigin:n:performance.now();}
export class GameAudio{
 constructor(){this.ctx=null;this.enabled=true;this.scene='map';this.step=0;this.next=0;this.trialBus=null;}
 async unlock(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.35:0;this.master.connect(this.ctx.destination);this.timer=setInterval(()=>this.schedule(),100);}if(this.ctx.state==='suspended')await this.ctx.resume();return this.ctx;}
 setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?.35:0,this.ctx.currentTime,.08);}
 setScene(scene){if(this.scene===scene)return;this.scene=scene;this.step=0;if(this.ctx)this.next=this.ctx.currentTime+.08;}
 tone(note,time,duration=.4,volume=.12,voice=false,bus=null){const c=this.ctx;if(!c)return;const frequency=440*2**((note-69)/12),gain=c.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);gain.connect(bus||this.master);
 if(voice){const source=c.createOscillator();source.type='sawtooth';source.frequency.value=frequency;for(const [hz,q,v]of [[760,7,.45],[1220,9,.2],[2600,12,.1]]){const f=c.createBiquadFilter(),g=c.createGain();f.type='bandpass';f.frequency.value=hz;f.Q.value=q;g.gain.value=v;source.connect(f);f.connect(g);g.connect(gain);}const vib=c.createOscillator(),depth=c.createGain();vib.frequency.value=5.4;depth.gain.value=frequency*.006;vib.connect(depth);depth.connect(source.frequency);vib.start(time);vib.stop(time+duration);source.start(time);source.stop(time+duration);}
 else{const osc=c.createOscillator();osc.type=this.scene==='battle'?'triangle':'sine';osc.frequency.value=frequency;osc.connect(gain);osc.start(time);osc.stop(time+duration);}
 }
 schedule(){if(!this.ctx||!this.enabled||!['map','battle'].includes(this.scene))return;const c=this.ctx,beat=this.scene==='battle'?.24:.55;if(this.next<c.currentTime)this.next=c.currentTime+.05;while(this.next<c.currentTime+.35){const melody=this.scene==='battle'?BATTLE_MELODY:MAP_MELODY,n=this.step%melody.length;this.tone(melody[n],this.next,beat*.88,this.scene==='battle'?.12:.09);if(n%4===0){this.tone(melody[n]-24,this.next,beat*3.4,.09);this.tone(melody[n]-12,this.next+.02,beat*2.7,.035);}if(this.scene==='battle'&&n%2===0)this.tone(36,this.next,.09,.16);this.next+=beat;this.step++;}}
 async trial(times,{vocal=true}={}){const c=await this.unlock();this.setScene('offering');this.stopTrial();const bus=c.createGain();bus.gain.value=1;bus.connect(this.master);this.trialBus=bus;const start=c.currentTime+.2,stamp=c.getOutputTimestamp?.(),perf=stamp&&stamp.contextTime>0?stamp.performanceTime+(start-stamp.contextTime)*1000:performance.now()+200;times.forEach((ms,n)=>this.tone(VOCAL_MELODY[n%VOCAL_MELODY.length],start+ms/1000,.48,.26,vocal,bus));return perf;}
 stopTrial(){if(this.trialBus){this.trialBus.gain.setValueAtTime(0,this.ctx.currentTime);this.trialBus=null;}}
}
export const audio=new GameAudio();
