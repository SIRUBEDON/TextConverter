const test = require('node:test');
const assert = require('node:assert/strict');
const { openSite, importFile } = require('./helpers.cjs');
const attack = '"><img src=x onerror="window.pwned=1"><input value="';
test('all rule imports render as literal values and retain editable behavior', async () => {
  const { dom,w,errors }=await openSite();
  await importFile(w,'#importFile',JSON.stringify({ breakRules:[{char:attack,position:'before',lines:1}], replaceRules:[{from:attack,to:'置換'}],deleteRules:[attack],rangeDeleteRules:[{start:attack,end:attack}] }));
  for(const id of ['breakRules','replaceRules','deleteRules','rangeDeleteRules']) {
    const list=w.document.getElementById(id);
    assert.equal(list.querySelectorAll('img,[onerror]').length,0);
    assert.equal(list.querySelector('input').value,attack);
  }
  const from=w.document.querySelector('#replaceRules input');
  from.value='abc';from.dispatchEvent(new w.Event('change'));
  w.document.getElementById('inputText').value='abc';w.convertText();
  assert.equal(w.document.getElementById('outputText').value,'置換');
  w.document.querySelector('#replaceRules .delete-btn').click();
  assert.equal(w.document.querySelectorAll('#replaceRules .rule-item').length,0);
  assert.equal(w.pwned,undefined);assert.deepEqual(errors,[]);
  dom.window.close();
});
test('stored rules and filenames cannot create HTML elements', async () => {
  const { dom,w }=await openSite(undefined,w=>w.localStorage.setItem('textConverterSettings',JSON.stringify({replaceRules:[{from:attack,to:'safe'}]})));
  assert.equal(w.document.querySelector('#replaceRules input').value,attack);
  w.addFileToList({name:attack+'.txt'});
  const list=w.document.getElementById('fileList');
  assert.equal(list.querySelector('.file-item-name').textContent,attack+'.txt');
  assert.equal(list.querySelectorAll('img,[onerror]').length,0);
  list.querySelectorAll('button')[1].click();assert.equal(list.children.length,0);
  dom.window.close();
});
