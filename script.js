const questions = {
    easy: ["y=x", "y=x+3", "y=2x-1", "y=x^2", "y=-x"],
    normal: ["y=sin(x)", "y=abs(x)", "y=sqrt(x+4)", "y=log10(x+10)", "y=x^3/5"],
    hard: ["y=sin(2x)", "y=abs(x)-3", "y=1/x", "y=sqrt(16-x^2)", "y=cos(x)+2"],
    crazy: ["y=sin(x^2)", "y=abs(sin(x)*5)", "y=exp(x/3)", "y=log(abs(x)+1)"]
};

let currentAnswer = "";
let chart = null;
let history = [];
const threshold = 0.4;

const diffSelect = document.getElementById('difficulty');
const latexInput = document.getElementById('latexInput');
const helperButtons = document.getElementById('helperButtons');

document.addEventListener('DOMContentLoaded', () => {
    Object.keys(questions).forEach(diff => {
        const opt = document.createElement('option');
        opt.value = diff;
        opt.textContent = diff.toUpperCase();
        diffSelect.appendChild(opt);
    });
    initGame();
});

function initGame() {
    currentAnswer = questions[diffSelect.value][Math.floor(Math.random() * questions[diffSelect.value].length)];
    history = [];
    document.getElementById('historyList').innerHTML = "";
    latexInput.value = "";
    updatePreview();
    renderButtons(diffSelect.value);
    drawGraph();
}

function renderButtons(diff) {
    helperButtons.innerHTML = "";
    // ボタン設定: [LaTeX, 表示名, 説明]
    let btns = [
        ['x', 'x', '変数'], ['^2', 'x²', '2乗'], ['^{ }', 'xⁿ', '乗数'], ['\\frac{ }{ }', '分数', '分数'],
        ['+', '+', '加算'], ['-', '-', '減算'], ['*', '×', '乗算'], ['/', '÷', '除算']
    ];
    
    if (diff !== 'easy') {
        btns.push(['\\sqrt{ }', '√', '平方根'], ['abs( )', '|x|', '絶対値'], ['sin( )', 'sin', '正弦'], ['log10( )', 'log', '常用対数']);
    }
    
    btns.forEach(([code, label, desc]) => {
        const b = document.createElement('button');
        b.innerHTML = `${label}<small>${desc}</small>`;
        b.onclick = () => {
            latexInput.value += code;
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
    let clean = formula.replace(/y\s*=\s*/, '')
                       .replace(/\\frac{(.*?)}{(.*?)}/g, "($1)/($2)")
                       .replace(/\\sqrt{(.*?)}/g, "sqrt($1)")
                       .replace(/abs\((.*?)\)/g, "abs($1)")
                       .replace(/{/g, "(").replace(/}/g, ")");
    const compiled = math.compile(clean);
    return xRange.map(x => {
        try { return compiled.evaluate({ x: x }); } catch { return null; }
    });
}

function drawGraph() {
    if (chart) chart.destroy();
    const xValues = [];
    for (let x = -10; x <= 10; x += 0.25) xValues.push(Number(x.toFixed(2)));
    const ansY = calculateY(currentAnswer, xValues);
    const datasets = history.map((h, idx) => {
        const guessY = calculateY(h, xValues);
        return {
            data: guessY,
            borderColor: '#3182ce',
            pointBackgroundColor: guessY.map((v, i) => (v !== null && Math.abs(v - ansY[i]) < threshold) ? 'red' : 'transparent'),
            pointRadius: 3,
            borderWidth: 2,
            spanGaps: false
        };
    });

    chart = new Chart(document.getElementById('graphCanvas'), {
        type: 'line',
        data: { labels: xValues, datasets: datasets },
        options: {
            maintainAspectRatio: true,
            aspectRatio: 1,
            scales: {
                x: { type: 'linear', min: -10, max: 10, position: 'center' },
                y: { type: 'linear', min: -10, max: 10, position: 'center' }
            },
            plugins: { legend: { display: false } }
        }
    });
}

document.getElementById('submitBtn').onclick = () => {
    if (!latexInput.value) return;
    history.push(latexInput.value);
    const li = document.createElement('li');
    li.textContent = `y = ${latexInput.value}`;
    document.getElementById('historyList').appendChild(li);
    drawGraph();
    
    // 正解判定
    const test = [0];
    const a = calculateY(currentAnswer, test)[0];
    const b = calculateY(latexInput.value, test)[0];
    if (Math.abs(a - b) < 0.1) alert("正解に近いようです！");
};

function showAnswer() { alert("答え: " + currentAnswer); }
latexInput.oninput = updatePreview;
