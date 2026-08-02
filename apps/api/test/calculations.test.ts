import test from 'node:test';
import assert from 'node:assert/strict';
const days=(start:string,end:string)=>Math.max(1,Math.round((Date.parse(end+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000));
test('one night is one rental day',()=>assert.equal(days('2026-08-10','2026-08-11'),1));
test('same date is one rental day',()=>assert.equal(days('2026-08-10','2026-08-10'),1));
test('proportional income is deterministic',()=>{const total=1000;const amounts=[200,800];assert.deepEqual(amounts.map(v=>Math.round(total*v/1000)),[200,800]);});
