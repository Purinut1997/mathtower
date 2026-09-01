import fetch from "node-fetch";

async function test() {
    const res = await fetch('http://localhost:3000/api/math-puzzle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: 'intermediate', towerType: '+', towerLevel: 1 })
    });
    console.log(res.ok);
    const data = await res.json();
    console.log(data);
}
test();
