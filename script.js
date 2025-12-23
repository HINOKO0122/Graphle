// 問題データ (JSONの代わりにここで定義。将来的にfetchに変更可能)
const questions = {
    easy: ["y=x", "y=x+2", "y=2x-3", "y=x^2", "y=-x+5"],
    normal: ["y=sin(x)", "y=cos(x)", "y=sqrt(x+5)", "y=log10(x+11)", "y=x^3/10"],
    hard: ["y=sin(2x)+1", "y=1/x", "y=x^3-4x", "y=abs(x)-5", "y=sqrt(25-x^2)"],
    crazy: ["y=sin(x^2)", "y=exp(x/5)*sin(x)", "y=log(abs(x)+1)", "y=sin(x)+cos(2x)"]
};

let currentAnswer = "";
let chart = null;
let history = [];
const threshold = 0.3; // 判定の厳密さ

// 要素の取得
const diffSelect = document.getElementById('difficulty');
const latexInput = document.getElementById('latexInput');
const helperButtons = document.getElementById('helperButtons');
const submitBtn = document.getElementById('submitBtn');

// 初期化実行
document.addEventListener('DOMContentLoaded', () => {
    // 難易度セレクトボックスの生成
    Object.keys(questions).forEach(diff => {
        const opt = document.createElement('option');
        opt.value = diff;
        opt.textContent = diff.toUpperCase();
        diffSelect.appendChild(opt);
    });
    initGame();
});

function initGame() {
    const diff = diffSelect.value;
    const qList = questions[diff];
    currentAnswer = qList[Math.floor(Math.random() * qList.length)];
    
    history = [];
    document.getElementById('historyList').innerHTML = "";
    latexInput.value = "";
    updatePreview();
    renderButtons(diff);
    drawGraph();
}

function renderButtons(diff) {
    helperButtons.innerHTML = "";
    let btns = ['+', '-', '*', '/', 'x', '^2', '^{ }', '\\frac{ }{ }'];
    if (diff !== 'easy') {
        btns = [...btns, '\\sqrt{ }', 'sin( )', 'cos( )', 'log10( )'];
    }
    
    btns.forEach(txt => {
        const b = document.createElement('button');
        b.textContent = txt;
        b.onclick = () => {
            latexInput.value += txt;
            updatePreview();
            latexInput.focus();
        };
        helperButtons.appendChild(b);
    });
}

function updatePreview() {
    const val = latexInput.value || " ";
    document.getElementById('preview').innerHTML = `\\( y = ${val} \\)`;
    MathJax.typesetPromise();
}

function calculateY(formula, xRange) {
    // LaTeXをmath.jsが読める形式に変換
    let clean = formula.replace(/y\s*=\s*/, '')
                       .replace(/\\frac{(.*?)}{(.*?)}/g, "($1)/($2)")
                       .replace(/\\sqrt{(.*?)}/g, "sqrt($1)")
                       .replace(/log10\((.*?)\)/g, "log10($1)")
                       .replace(/{/g, "(").replace(/}/g, ")");
    
    const compiled = math.compile(clean);
    return xRange.map(x => {
        try {
            const res = compiled.evaluate({ x: x });
            return (typeof res === 'number' && isFinite(res)) ? res : null;
        } catch (e) {
            return null;
        }
    });
}

function drawGraph() {
    if (chart) chart.destroy();

    const xValues = [];
    for (let x = -10; x <= 10; x += 0.2) xValues.push(Number(x.toFixed(1)));

    const ansY = calculateY(currentAnswer, xValues);
    const datasets = [];

    history.forEach((h, idx) => {
        const guessY = calculateY(h, xValues);
        const colors = guessY.map((val, i) => {
            if (val === null || ansY[i] === null) return 'rgba(0,0,0,0)';
            return Math.abs(val - ansY[i]) < threshold ? 'red' : 'rgba(0,123,255,0.2)';
        });

        datasets.push({
            data: guessY,
            borderColor: '#007bff',
            pointBackgroundColor: colors,
            pointRadius: 3,
            borderWidth: 1,
            spanGaps: false
        });
    });

    chart = new Chart(document.getElementById('graphCanvas'), {
        type: 'line',
        data: { labels: xValues, datasets: datasets },
        options: {
            responsive: true,
            scales: {
                x: { type: 'linear', min: -10, max: 10, position: 'center' },
                y: { type: 'linear', min: -10, max: 10, position: 'center' }
            },
            plugins: { legend: { display: false } }
        }
    });
}

submitBtn.onclick = () => {
    const val = latexInput.value;
    if (!val) return;

    history.push(val);
    const li = document.createElement('li');
    li.textContent = `y = ${val}`;
    document.getElementById('historyList').appendChild(li);
    
    drawGraph();

    // 簡易勝利判定
    const testPoints = [-2, 0, 2];
    const ansV = calculateY(currentAnswer, testPoints);
    const inputV = calculateY(val, testPoints);
    if (ansV.every((v, i) => Math.abs(v - inputV[i]) < threshold)) {
        alert("🎉 正解です！");
    }
};

function showAnswer() {
    alert("答え: " + currentAnswer);
}

latexInput.oninput = updatePreview;
