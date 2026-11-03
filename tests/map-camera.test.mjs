import test from 'node:test';
import assert from 'node:assert/strict';
import {updateMapCamera, movementProgress} from '../map-camera.mjs';

const viewport = {width:640, height:400, scene:'world:one'};
const camera = (previous, x, y, options={}) => updateMapCamera(previous, {...viewport, x, y, ...options});

test('nearby walking moves the player while terrain and landmarks stay fixed', () => {
 const initial = camera(null, 784, 624);
 for (const [x,y] of [[816,624],[848,624],[848,656],[784,624]]) {
  const next = camera(initial,x,y);
  assert.equal(next.left,initial.left);
  assert.equal(next.top,initial.top);
  assert.equal(32*27-next.left,32*27-initial.left);
 }
});

test('edge scrolling is continuous, shared by every layer, and does not recenter on reversal', () => {
 let current = camera(null,0,0), lastLeft=current.left;
 for (let x=1;x<=320;x++) {
  current=camera(current,x,0);
  assert(current.left>=lastLeft);
  assert(current.left-lastLeft<=1);
  assert.equal((320-current.left)-(288-current.left),32);
  assert.equal(current.left,Math.round(current.left));
  lastLeft=current.left;
 }
 const stopped=current;
 for(let x=319;x>=288;x--) current=camera(current,x,0);
 assert.equal(current.left,stopped.left);
});

test('scene transitions, teleports and viewport changes reset the camera', () => {
 const initial=camera(null,784,624);
 for (const options of [{scene:'cave:one'}, {width:320}, {height:200}]) {
  const next=camera(initial,16,16,options);
  assert.equal(next.left,Math.round(16-next.width/2));
  assert.equal(next.top,Math.round(16-next.height/2));
 }
 assert.equal(camera(initial,4000,16).left,3680);
});

test('rooms that fit stay centered; larger rooms never scroll beyond their walls', () => {
 const bounds={width:480,height:352};
 const initial=camera(null,48,48,{bounds});
 const next=camera(initial,432,304,{bounds});
 assert.equal(initial.left,-80);assert.equal(initial.top,-24);
 assert.equal(next.left,initial.left);assert.equal(next.top,initial.top);
 for(const target of [-100,16,320,600,1000]) {
  const view=camera(null,target,target,{bounds:{width:960,height:720}});
  assert(view.left>=0&&view.left<=320);
  assert(view.top>=0&&view.top<=320);
 }
});

test('movement cannot run backward when an animation starts after the frame timestamp', () => {
 assert.equal(movementProgress(100,110,170),0);
 assert.equal(movementProgress(195,110,170),.5);
 assert.equal(movementProgress(500,110,170),1);
 assert.equal(movementProgress(100,110,0),1);
});
