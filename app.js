/* CalcX: application logic */

const CONFIG = {
  // Paste your ExchangeRate-API key here. Never publish a real key in client code.
  apiKey: "a1d5b57a70d9ea08ad1e1d37",
  base: "https://v6.exchangerate-api.com/v6/",
  marketCodes: ["USD", "EUR", "GBP", "NGN", "JPY", "CAD", "AUD", "CHF"],
  fallback: [["USD", "US Dollar"], ["NGN", "Nigerian Naira"], ["EUR", "Euro"], ["GBP", "British Pound"], ["JPY", "Japanese Yen"], ["CAD", "Canadian Dollar"]]
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const fmt = n => (Number.isFinite(n) ? String(parseFloat(n.toFixed(10))) : "Error");
const money = n => n.toLocaleString(undefined, { maximumFractionDigits: 4 });

/* ---------- Navigation ---------- */
const titles = {
  calc: ["Calculator", "Quick maths with sin, cos and tan"],
  triangle: ["Triangle solver", "Right triangles with SOH, CAH and TOA"],
  convert: ["Currency converter", "Convert using live exchange rates"],
  market: ["Market rates", "Compare one currency against others"]
};

function show(view) {
  $$(".view").forEach(el => (el.hidden = el.id !== "view-" + view));
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $("#viewTitle").textContent = titles[view][0];
  $("#viewSub").textContent = titles[view][1];
  if (view === "market") loadMarket();
}
$$(".nav-item").forEach(b => (b.onclick = () => show(b.dataset.view)));

/* ---------- Formula library search ---------- */
function filterFormulas(query, library) {
  const q = query.trim().toLowerCase();
  const items = library.querySelectorAll("[data-formula-item], .formula-card, .formula-item, .formula");
  items.forEach(item => {
    const text = `${item.textContent} ${item.dataset.formula || ""} ${item.dataset.search || ""}`.toLowerCase();
    item.hidden = !text.includes(q);
  });
}

$$('[data-formula-search], #formulaSearch, #formula-search, #formulaSearchInput').forEach(input => {
  const library = input.closest("[data-formula-library], .formula-library, #formulaLibrary") || document;
  input.addEventListener("input", () => filterFormulas(input.value, library));
});

/* ---------- Theme ---------- */
const themeIcons = {
  light: `
    <svg viewBox="0 0 24 24" class="grid-icon" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.1"></circle>
      <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6M18.8 18.8l-1.6-1.6M6.8 6.8L5.2 5.2"></path>
    </svg>
  `,
  dark: `
    <svg viewBox="0 0 24 24" class="grid-icon" aria-hidden="true" focusable="false">
      <path d="M20 12.8A8.2 8.2 0 0 1 11.2 4a8 8 0 1 0 8.8 8.8Z"></path>
    </svg>
  `
};

function setTheme(t) {
  document.body.classList.toggle("dark", t === "dark");
  $("#themeToggle").innerHTML = themeIcons[t === "dark" ? "light" : "dark"];
  $("#themeToggle").setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
  try { localStorage.setItem("calcxTheme", t); } catch {}
}
$("#themeToggle").onclick = () => setTheme(document.body.classList.contains("dark") ? "light" : "dark");
(() => {
  let t = null;
  try { t = localStorage.getItem("calcxTheme"); } catch {}
  setTheme(t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
})();

/* ---------- Scientific formula library ---------- */
const SCIENTIFIC_FORMULA_GROUPS = [
  ["Algebra", [
    ["Quadratic formula", "x = (-b ± √(b² - 4ac)) / 2a", "Solve ax² + bx + c = 0"],
    ["Difference of squares", "a² - b² = (a - b)(a + b)", "Factorisation"],
    ["Square of a binomial", "(a ± b)² = a² ± 2ab + b²", "Perfect square"],
    ["Cube of a binomial", "(a ± b)³ = a³ ± 3a²b + 3ab² ± b³", "Binomial expansion"],
    ["Arithmetic mean", "μ = (x₁ + x₂ + ... + xₙ) / n", "Average"],
    ["Geometric mean", "GM = (x₁x₂...xₙ)^(1/n)", "Growth rate"],
    ["Slope formula", "m = (y₂ - y₁) / (x₂ - x₁)", "Line gradient"],
    ["Slope-intercept form", "y = mx + b", "Linear equation"],
    ["Point-slope form", "y - y₁ = m(x - x₁)", "Equation of a line"],
    ["Distance formula", "d = √((x₂ - x₁)² + (y₂ - y₁)²)", "Between two points"],
    ["Midpoint formula", "M = ((x₁ + x₂)/2, (y₁ + y₂)/2)", "Center point"],
    ["Logarithm definition", "b^y = x ⇔ y = log_b x", "Inverse power"],
    ["Change of base", "log_b x = log_c x / log_c b", "Convert bases"],
    ["Product rule", "log_b(xy) = log_b x + log_b y", "Logs"],
    ["Quotient rule", "log_b(x/y) = log_b x - log_b y", "Logs"],
    ["Power rule", "log_b(x^n) = n log_b x", "Logs"]
  ]],
  ["Trigonometry", [
    ["Pythagorean identity", "sin²θ + cos²θ = 1", "Basic identity"],
    ["Tangent identity", "tan θ = sin θ / cos θ", "Ratio"],
    ["Secant identity", "sec θ = 1 / cos θ", "Reciprocal"],
    ["Cosecant identity", "csc θ = 1 / sin θ", "Reciprocal"],
    ["Cotangent identity", "cot θ = 1 / tan θ = cos θ / sin θ", "Reciprocal"],
    ["1 + tan²θ", "1 + tan²θ = sec²θ", "Identity"],
    ["1 + cot²θ", "1 + cot²θ = csc²θ", "Identity"],
    ["Sine addition", "sin(A + B) = sin A cos B + cos A sin B", "Sum formula"],
    ["Sine subtraction", "sin(A - B) = sin A cos B - cos A sin B", "Difference formula"],
    ["Cosine addition", "cos(A + B) = cos A cos B - sin A sin B", "Sum formula"],
    ["Cosine subtraction", "cos(A - B) = cos A cos B + sin A sin B", "Difference formula"],
    ["Tangent addition", "tan(A + B) = (tan A + tan B) / (1 - tan A tan B)", "Sum formula"],
    ["Tangent subtraction", "tan(A - B) = (tan A - tan B) / (1 + tan A tan B)", "Difference formula"],
    ["Double-angle sine", "sin 2θ = 2 sin θ cos θ", "Double angle"],
    ["Double-angle cosine", "cos 2θ = cos²θ - sin²θ = 2cos²θ - 1 = 1 - 2sin²θ", "Double angle"],
    ["Double-angle tangent", "tan 2θ = 2 tan θ / (1 - tan²θ)", "Double angle"],
    ["Half-angle sine", "sin(θ/2) = ±√((1 - cos θ)/2)", "Half angle"],
    ["Half-angle cosine", "cos(θ/2) = ±√((1 + cos θ)/2)", "Half angle"],
    ["Half-angle tangent", "tan(θ/2) = sin θ / (1 + cos θ) = (1 - cos θ) / sin θ", "Half angle"],
    ["Law of sines", "a / sin A = b / sin B = c / sin C", "Triangle law"],
    ["Law of cosines", "c² = a² + b² - 2ab cos C", "Triangle law"],
    ["Area by sides", "K = √(s(s-a)(s-b)(s-c))", "Heron formula"],
    ["Area by two sides", "K = ½ab sin C", "Triangle area"],
    ["Sector area", "A = ½r²θ", "Radians"],
    ["Arc length", "s = rθ", "Radians"],
    ["Coordinate sin", "sin θ = y / r", "Unit circle"],
    ["Coordinate cos", "cos θ = x / r", "Unit circle"],
    ["Coordinate tan", "tan θ = y / x", "Unit circle"],
    ["Sum-to-product 1", "sin A + sin B = 2 sin((A+B)/2) cos((A-B)/2)", "Identity"],
    ["Sum-to-product 2", "sin A - sin B = 2 cos((A+B)/2) sin((A-B)/2)", "Identity"],
    ["Product-to-sum 1", "sin A sin B = [cos(A-B)-cos(A+B)]/2", "Identity"],
    ["Product-to-sum 2", "cos A cos B = [cos(A-B)+cos(A+B)]/2", "Identity"],
    ["Product-to-sum 3", "sin A cos B = [sin(A+B)+sin(A-B)]/2", "Identity"]
  ]],
  ["Inverse Trigonometry", [
    ["arcsin definition", "y = arcsin x ⇔ x = sin y", "Range [-π/2, π/2]"],
    ["arccos definition", "y = arccos x ⇔ x = cos y", "Range [0, π]"],
    ["arctan definition", "y = arctan x ⇔ x = tan y", "Range (-π/2, π/2)"],
    ["arcsin formula", "arcsin x = -i ln(ix + √(1 - x²))", "Complex form"],
    ["arccos formula", "arccos x = π/2 - arcsin x", "Relationship"],
    ["arctan formula", "arctan x = (i/2) ln((i + x)/(i - x))", "Complex form"],
    ["arcsin derivative", "d/dx arcsin x = 1/√(1 - x²)", "Derivative"],
    ["arccos derivative", "d/dx arccos x = -1/√(1 - x²)", "Derivative"],
    ["arctan derivative", "d/dx arctan x = 1/(1 + x²)", "Derivative"],
    ["arccot derivative", "d/dx arccot x = -1/(1 + x²)", "Derivative"]
  ]],
  ["Hyperbolic", [
    ["Sinh definition", "sinh x = (e^x - e^-x)/2", "Hyperbolic sine"],
    ["Cosh definition", "cosh x = (e^x + e^-x)/2", "Hyperbolic cosine"],
    ["Tanh definition", "tanh x = sinh x / cosh x", "Hyperbolic tangent"],
    ["Coth definition", "coth x = cosh x / sinh x", "Hyperbolic cotangent"],
    ["Sech definition", "sech x = 1 / cosh x", "Hyperbolic secant"],
    ["Csch definition", "csch x = 1 / sinh x", "Hyperbolic cosecant"],
    ["Identity 1", "cosh²x - sinh²x = 1", "Hyperbolic identity"],
    ["Identity 2", "1 - tanh²x = sech²x", "Hyperbolic identity"],
    ["Sinh addition", "sinh(x + y) = sinh x cosh y + cosh x sinh y", "Addition"],
    ["Cosh addition", "cosh(x + y) = cosh x cosh y + sinh x sinh y", "Addition"],
    ["Derivative sinh", "d/dx sinh x = cosh x", "Derivative"],
    ["Derivative cosh", "d/dx cosh x = sinh x", "Derivative"],
    ["Derivative tanh", "d/dx tanh x = sech²x", "Derivative"]
  ]],
  ["Exponential & Logarithmic", [
    ["Euler's number", "e ≈ 2.718281828459", "Constant"],
    ["Exponential rule", "e^(a+b) = e^a e^b", "Exponents"],
    ["Exponential inverse", "ln(e^x) = x", "Logarithm"],
    ["Log base e", "ln x = log_e x", "Natural log"],
    ["Log base 10", "log x = log_10 x", "Common log"],
    ["Power law", "a^m a^n = a^(m+n)", "Exponent rule"],
    ["Quotient law", "a^m / a^n = a^(m-n)", "Exponent rule"],
    ["Power of power", "(a^m)^n = a^(mn)", "Exponent rule"],
    ["Negative exponent", "a^-n = 1/a^n", "Exponent rule"],
    ["Fraction exponent", "a^(m/n) = (n√a)^m", "Radicals"],
    ["Zero exponent", "a^0 = 1", "Exponent rule"],
    ["Log product", "ln(xy) = ln x + ln y", "Property"],
    ["Log quotient", "ln(x/y) = ln x - ln y", "Property"],
    ["Log power", "ln(x^n) = n ln x", "Property"],
    ["Change of base", "log_b x = ln x / ln b", "Conversion"],
    ["Compound interest", "A = P(1 + r/n)^(nt)", "Finance"],
    ["Continuous growth", "A = Pe^(rt)", "Finance"]
  ]],
  ["Complex Numbers", [
    ["Imaginary unit", "i² = -1", "Definition"],
    ["Complex number", "z = a + bi", "Standard form"],
    ["Modulus", "|z| = √(a² + b²)", "Magnitude"],
    ["Argument", "arg(z) = atan2(b, a)", "Angle"],
    ["Polar form", "z = r(cos θ + i sin θ)", "Trigonometric"],
    ["Euler form", "z = re^(iθ)", "Exponential"],
    ["Multiplication", "(a+bi)(c+di) = (ac-bd) + (ad+bc)i", "Algebra"],
    ["Division", "(a+bi)/(c+di) = ((ac+bd) + (bc-ad)i)/(c²+d²)", "Algebra"],
    ["Conjugate", "z̄ = a - bi", "Complex conjugate"],
    ["De Moivre", "(cos θ + i sin θ)^n = cos(nθ) + i sin(nθ)", "Power theorem"]
  ]],
  ["Geometry", [
    ["Rectangle area", "A = lw", "Two dimensions"],
    ["Rectangle perimeter", "P = 2l + 2w", "Perimeter"],
    ["Square area", "A = s²", "Two dimensions"],
    ["Square perimeter", "P = 4s", "Perimeter"],
    ["Parallelogram area", "A = bh", "Base-height"],
    ["Triangle area", "A = ½bh", "Base-height"],
    ["Circle area", "A = πr²", "Radius"],
    ["Circle circumference", "C = 2πr", "Perimeter"],
    ["Sphere volume", "V = 4/3 πr³", "3D solid"],
    ["Sphere surface", "S = 4πr²", "3D solid"],
    ["Cylinder volume", "V = πr²h", "3D solid"],
    ["Cylinder surface", "S = 2πr(r + h)", "3D solid"],
    ["Cone volume", "V = ⅓πr²h", "3D solid"],
    ["Cone surface", "S = πr(r + √(r² + h²))", "3D solid"],
    ["Rectangular prism volume", "V = lwh", "3D solid"],
    ["Rectangular prism surface", "S = 2(lw + lh + wh)", "3D solid"],
    ["Pyramid volume", "V = ⅓Bh", "Base area"],
    ["Regular polygon area", "A = ½aP", "Apothem"],
    ["Ellipse area", "A = πab", "Semiaxes"],
    ["Trapezoid area", "A = ½(a+b)h", "Average bases"]
  ]],
  ["Calculus", [
    ["Power rule", "d/dx x^n = nx^(n-1)", "Derivative"],
    ["Constant rule", "d/dx c = 0", "Derivative"],
    ["Constant multiple", "d/dx (cf(x)) = c f'(x)", "Derivative"],
    ["Sum rule", "d/dx (f + g) = f' + g'", "Derivative"],
    ["Product rule", "d/dx (fg) = f'g + fg'", "Derivative"],
    ["Quotient rule", "d/dx (f/g) = (f'g - fg')/g²", "Derivative"],
    ["Chain rule", "d/dx f(g(x)) = f'(g(x))g'(x)", "Derivative"],
    ["Derivative of sin", "d/dx sin x = cos x", "Derivative"],
    ["Derivative of cos", "d/dx cos x = -sin x", "Derivative"],
    ["Derivative of tan", "d/dx tan x = sec²x", "Derivative"],
    ["Derivative of e^x", "d/dx e^x = e^x", "Derivative"],
    ["Derivative of a^x", "d/dx a^x = a^x ln a", "Derivative"],
    ["Derivative of ln x", "d/dx ln x = 1/x", "Derivative"],
    ["Derivative of log_a x", "d/dx log_a x = 1/(x ln a)", "Derivative"],
    ["Derivative of sinh", "d/dx sinh x = cosh x", "Derivative"],
    ["Derivative of cosh", "d/dx cosh x = sinh x", "Derivative"],
    ["Derivative of arcsin", "d/dx arcsin x = 1/√(1-x²)", "Derivative"],
    ["Derivative of arccos", "d/dx arccos x = -1/√(1-x²)", "Derivative"],
    ["Derivative of arctan", "d/dx arctan x = 1/(1+x²)", "Derivative"],
    ["Integral of x^n", "∫x^n dx = x^(n+1)/(n+1) + C", "Integral"],
    ["Integral of 1/x", "∫1/x dx = ln|x| + C", "Integral"],
    ["Integral of e^x", "∫e^x dx = e^x + C", "Integral"],
    ["Integral of sin x", "∫sin x dx = -cos x + C", "Integral"],
    ["Integral of cos x", "∫cos x dx = sin x + C", "Integral"],
    ["Integral of tan x", "∫tan x dx = -ln|cos x| + C", "Integral"],
    ["Integral of sec²x", "∫sec²x dx = tan x + C", "Integral"],
    ["Integral by parts", "∫u dv = uv - ∫v du", "Technique"],
    ["Fundamental theorem", "∫_a^b f(x) dx = F(b) - F(a)", "Calculus"],
    ["Average value", "f_avg = (1/(b-a))∫_a^b f(x) dx", "Theorem"],
    ["Taylor series", "f(x) = Σ f^(n)(a)(x-a)^n/n!", "Series"],
    ["Maclaurin series", "f(x) = Σ f^(n)(0)x^n/n!", "Series"],
    ["Exponential series", "e^x = Σ x^n/n!", "Series"],
    ["Sine series", "sin x = Σ (-1)^n x^(2n+1)/(2n+1)!", "Series"],
    ["Cosine series", "cos x = Σ (-1)^n x^(2n)/(2n)!", "Series"]
  ]],
  ["Statistics & Probability", [
    ["Population variance", "σ² = Σ(x_i - μ)² / N", "Spread"],
    ["Sample variance", "s² = Σ(x_i - x̄)² / (n-1)", "Spread"],
    ["Standard deviation", "σ = √(Σ(x_i - μ)² / N)", "Spread"],
    ["Sample SD", "s = √(Σ(x_i - x̄)² / (n-1))", "Spread"],
    ["Coefficient of variation", "CV = σ / μ", "Relative spread"],
    ["Binomial probability", "P(X=k) = C(n,k) p^k (1-p)^(n-k)", "Distribution"],
    ["Expected value", "E[X] = Σ x P(x)", "Probability"],
    ["Variance of random variable", "Var(X) = E[(X-μ)²]", "Probability"],
    ["Conditional probability", "P(A|B) = P(A∩B) / P(B)", "Probability"],
    ["Bayes theorem", "P(A|B) = P(B|A)P(A) / P(B)", "Probability"],
    ["Normal PDF", "f(x) = 1/(σ√(2π)) e^(-(x-μ)²/(2σ²))", "Distribution"],
    ["Z-score", "z = (x - μ) / σ", "Standardized score"],
    ["Correlation coefficient", "r = [nΣxy - ΣxΣy]/√([nΣx²-(Σx)²][nΣy²-(Σy)²])", "Regression"],
    ["Linear regression", "ŷ = a + bx", "Model"],
    ["Permutation", "P(n,r) = n!/(n-r)!", "Counting"],
    ["Combination", "C(n,r) = n!/(r!(n-r)!)", "Counting"]
  ]],
  ["Physics", [
    ["Newton's second law", "F = ma", "Dynamics"],
    ["Weight", "W = mg", "Gravity"],
    ["Work", "W = Fd cos θ", "Energy"],
    ["Kinetic energy", "K = ½mv²", "Energy"],
    ["Potential energy", "U = mgh", "Energy"],
    ["Power", "P = W/t", "Rate"],
    ["Ohm's law", "V = IR", "Electricity"],
    ["Electrical power", "P = IV", "Electricity"],
    ["Wave speed", "v = fλ", "Waves"],
    ["Momentum", "p = mv", "Mechanics"],
    ["Force of gravity", "F = Gm₁m₂/r²", "Universal gravitation"],
    ["Pressure", "P = F/A", "Fluid statics"]
  ]]
];

const SCIENTIFIC_FORMULAS = SCIENTIFIC_FORMULA_GROUPS.flatMap(([category, items]) =>
  items.map(([name, formula, note]) => ({ category, name, formula, note }))
);

function renderFormulaLibrary() {
  const library = document.querySelector("#formulaLibrary, [data-formula-library]") || (() => {
    const host = document.createElement("section");
    host.id = "formulaLibrary";
    host.className = "formula-library";
    host.setAttribute("data-formula-library", "true");
    document.body.appendChild(host);
    return host;
  })();

  let list = library.querySelector(".formula-list, .formula-grid, [data-formula-list]");
  if (!list) {
    list = document.createElement("div");
    list.className = "formula-list";
    list.setAttribute("data-formula-list", "true");
    library.appendChild(list);
  }
  if (!list.dataset.formulaRendered) {
    list.innerHTML = SCIENTIFIC_FORMULAS.map((item, index) => `
      <article class="formula-card" data-formula-item data-formula="${item.name} ${item.category} ${item.formula} ${item.note || ""}" data-search="${item.note || ""}" data-index="${index}">
        <small>${item.category}</small>
        <h4>${item.name}</h4>
        <code>${item.formula}</code>
        <span>${item.note || "Formula"}</span>
      </article>
    `).join("");
    list.dataset.formulaRendered = "true";
  }

  if (!library.querySelector("[data-formula-search]")) {
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Search formulas";
    search.setAttribute("data-formula-search", "true");
    search.setAttribute("aria-label", "Search formula library");
    library.insertBefore(search, list);
  }
}

renderFormulaLibrary();

/* ---------- Calculator ---------- */
const sym = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const keys = [
  ["sin", "fn"], ["cos", "fn"], ["tan", "fn"], ["÷", "op", "/"],
  ["AC", "act", "clear"], ["DEL", "act", "del"], ["%", "act", "pct"], ["×", "op", "*"],
  ["7"], ["8"], ["9"], ["−", "op", "-"],
  ["4"], ["5"], ["6"], ["+", "op", "+"],
  ["1"], ["2"], ["3"], ["=", "eq", "eq"],
  ["0", "zero"], ["."]
];

let cur = "0", prev = "", op = null, reset = false, history = [], lastResultInfo = null;

function ensureHowResultUI() {
  const host = $("#view-calc") || document.body;
  let panel = $("#resultExplain");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "resultExplain";
    panel.className = "result-explain";
    panel.hidden = true;
    panel.setAttribute("aria-live", "polite");
    host.appendChild(panel);
  }

  let btn = $("#showHowBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "showHowBtn";
    btn.className = "show-how-btn";
    btn.textContent = "Show me how this result was generated";
    btn.onclick = () => {
      if (!lastResultInfo) return;
      panel.innerHTML = `<strong>How this result was generated</strong><p>${lastResultInfo}</p>`;
      panel.hidden = false;
    };
    host.appendChild(btn);
  }

  return { panel, btn };
}

function setLastResultInfo(info) {
  lastResultInfo = info;
  const { btn, panel } = ensureHowResultUI();
  btn.hidden = !info;
  if (!info) panel.hidden = true;
}

function draw() {
  $("#cur").textContent = cur;
  $("#prev").textContent = op && prev !== "" ? `${prev} ${sym[op]}` : "";
}

function log(expr, result, explanation = "") {
  history = [[expr, result, explanation], ...history].slice(0, 8);
  const list = $("#history");
  list.innerHTML = history.length
    ? history.map((h, i) => `<li data-i="${i}"><span>${h[0]}</span><b>${h[1]}</b></li>`).join("")
    : "";
  setLastResultInfo(explanation || null);
}
$("#history").onclick = e => {
  const li = e.target.closest("li");
  if (!li) return;
  const picked = history[li.dataset.i];
  cur = picked[1];
  lastResultInfo = picked[2] || null;
  const { panel, btn } = ensureHowResultUI();
  btn.hidden = !lastResultInfo;
  panel.hidden = true;
  reset = true;
  draw();
};

function digit(d) {
  if (reset || cur === "Error" || cur === "0") {
    cur = d === "." ? "0." : d;
    reset = false;
  } else if (d !== "." || !cur.includes(".")) {
    cur += d;
  }
}

function equals() {
  if (!op) return;
  const a = +prev, b = +cur;
  const r = { "+": a + b, "-": a - b, "*": a * b, "/": b === 0 ? NaN : a / b }[op];
  const expr = `${fmt(a)} ${sym[op]} ${fmt(b)}`;
  cur = fmt(r);
  if (cur !== "Error") log(expr, cur);
  prev = ""; op = null; reset = true;
}

function operate(next) {
  if (cur === "Error") return;
  if (op && !reset) equals();
  prev = cur; op = next; reset = true;
}

function trig(f) {
  const n = +cur;
  if (Number.isNaN(n)) return;
  const rad = n * Math.PI / 180;
  const bad = f === "tan" && Math.abs(Math.cos(rad)) < 1e-12;
  const r = bad ? NaN : Math[f](rad);
  cur = fmt(r);
  if (cur !== "Error") log(`${f}(${fmt(n)}°)`, cur);
  prev = ""; op = null; reset = true;
}

function clearAll() { cur = "0"; prev = ""; op = null; reset = false; }

function press(label, type, val) {
  if (type === "fn") trig(label);
  else if (type === "op") operate(val);
  else if (type === "eq") equals();
  else if (val === "clear") clearAll();
  else if (val === "pct") {
    if (cur !== "Error") {
      const percent = +cur;
      // For + and -, calculate the entered percentage of the first value,
      // enabling common increase and discount calculations (e.g. 100 - 20%).
      cur = fmt(op && !reset && (op === "+" || op === "-")
        ? +prev * percent / 100
        : percent / 100);
      reset = true;
    }
  }
  else if (val === "del") {
    if (reset || cur === "Error") clearAll();
    else { cur = cur.slice(0, -1); if (cur === "" || cur === "-") cur = "0"; }
  } else digit(label);
  draw();
}

$("#keys").innerHTML = keys
  .map(([l, t = "", v = ""]) => `<button class="${t}" data-l="${l}" data-t="${t}" data-v="${v}">${l}</button>`)
  .join("");
$("#keys").onclick = e => {
  const b = e.target.closest("button");
  if (b) press(b.dataset.l, b.dataset.t, b.dataset.v);
};

document.addEventListener("keydown", e => {
  if ($("#view-calc").hidden || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const k = e.key;
  if (/^[0-9.]$/.test(k)) press(k, "", "");
  else if ("+-*/".includes(k)) press(k, "op", k);
  else if (k === "Enter" || k === "=") { e.preventDefault(); press("=", "eq", "eq"); }
  else if (k === "Backspace") press("DEL", "act", "del");
  else if (k === "Escape") press("AC", "act", "clear");
  else if (k === "%") press("%", "act", "pct");
});

/* ---------- Triangle solver ---------- */
const T = {
  sin: { n: "SOH", s: ["hypotenuse", "opposite"], a: ["opposite", "hypotenuse"] },
  cos: { n: "CAH", s: ["hypotenuse", "adjacent"], a: ["adjacent", "hypotenuse"] },
  tan: { n: "TOA", s: ["adjacent", "opposite"], a: ["opposite", "adjacent"] }
};

function triLabels() {
  const m = T[$("#tMethod").value];
  const side = $("#tMode").value === "side";
  $("#l1").textContent = side ? "Angle θ (degrees)" : `Known ${m.a[0]}`;
  $("#l2").textContent = side ? `Known ${m.s[0]}` : `Known ${m.a[1]}`;
}
$("#tMethod").onchange = $("#tMode").onchange = triLabels;
triLabels();

function solveTri() {
  const k = $("#tMethod").value, m = T[k], mode = $("#tMode").value;
  const a = parseFloat($("#t1").value), b = parseFloat($("#t2").value), out = $("#tOut");
  const fail = msg => { out.className = "result err"; out.textContent = msg; };
  if (!(a > 0) || !(b > 0)) return fail("Enter two positive values.");
  out.className = "result";

  if (mode === "side") {
    if (a >= 90) return fail("The angle must be between 0° and 90°.");
    const r = b * Math[k](a * Math.PI / 180);
    out.innerHTML = `<small>${m.n}</small><p>${m.s[1]} = ${m.s[0]} × ${k}(θ)</p><strong>${m.s[1]} ≈ ${fmt(r)}</strong>`;
  } else {
    const ratio = a / b;
    if (k !== "tan" && ratio >= 1) return fail(`The ${m.a[0]} must be shorter than the ${m.a[1]}.`);
    const deg = Math["a" + k](ratio) * 180 / Math.PI;
    out.innerHTML = `<small>${m.n}</small><p>${k}(θ) = ${fmt(a)} ÷ ${fmt(b)}</p><strong>θ ≈ ${fmt(deg)}°</strong>`;
  }
}
$("#tSolve").onclick = solveTri;

/* ---------- Currency ---------- */
let codes = CONFIG.fallback;
const cache = {};

async function api(path) {
  if (!CONFIG.apiKey || CONFIG.apiKey.startsWith("YOUR_")) throw new Error("Add your ExchangeRate-API key in app.js.");
  const res = await fetch(CONFIG.base + CONFIG.apiKey + "/" + path);
  if (!res.ok) throw new Error("Request failed (HTTP " + res.status + ").");
  const d = await res.json();
  if (d.result !== "success") throw new Error(d["error-type"] || "The rates service returned an error.");
  return d;
}

async function rates(base) {
  const c = cache[base];
  if (c && Date.now() - c.t < 36e5) return c;
  const d = await api("latest/" + base);
  return (cache[base] = { t: Date.now(), r: d.conversion_rates, u: d.time_last_update_utc });
}

function fill(sel, q = "") {
  const v = sel.value;
  q = q.trim().toLowerCase();
  sel.innerHTML = codes
    .filter(c => (c[0] + " " + c[1]).toLowerCase().includes(q))
    .map(c => `<option value="${c[0]}">${c[0]}: ${c[1]}</option>`)
    .join("") || `<option value="">No currency found</option>`;
  if ([...sel.options].some(o => o.value === v)) sel.value = v;
}

function fillAll() {
  fill($("#from")); fill($("#to")); fill($("#mBase"));
  $("#from").value = "USD"; $("#to").value = "NGN"; $("#mBase").value = "USD";
}

async function loadCodes() {
  try { codes = (await api("codes")).supported_codes; } catch (e) { console.warn(e.message); }
  fillAll();
}

$("#fromQ").oninput = e => fill($("#from"), e.target.value);
$("#toQ").oninput = e => fill($("#to"), e.target.value);

async function convert() {
  const amt = parseFloat($("#amount").value), from = $("#from").value, to = $("#to").value;
  if (!(amt > 0)) { $("#cAmt").textContent = "–"; $("#cRate").textContent = "Enter an amount greater than zero."; return; }
  if (!from || !to) { $("#cRate").textContent = "Choose both currencies."; return; }
  $("#cAmt").textContent = "Loading…";
  $("#cRate").textContent = "Fetching the latest rate.";
  $("#cTime").textContent = "";
  try {
    const d = await rates(from), rate = d.r[to];
    $("#cAmt").textContent = `${money(amt * rate)} ${to}`;
    $("#cRate").textContent = `1 ${from} = ${money(rate)} ${to}`;
    $("#cTime").textContent = "Rates last updated " + d.u;
  } catch (e) {
    $("#cAmt").textContent = "Couldn't convert";
    $("#cRate").textContent = e.message;
  }
}
$("#convertBtn").onclick = convert;
$("#amount").onkeydown = e => { if (e.key === "Enter") convert(); };
$("#swap").onclick = () => {
  const f = $("#from").value;
  $("#from").value = $("#to").value;
  $("#to").value = f;
  if ($("#amount").value) convert();
};

async function loadMarket() {
  const base = $("#mBase").value || "USD", grid = $("#mGrid");
  grid.innerHTML = '<div class="stat"><span>Loading…</span><strong>–</strong></div>';
  try {
    const d = await rates(base);
    grid.innerHTML = CONFIG.marketCodes
      .filter(c => c !== base)
      .map(c => `<div class="stat"><span>${base} / ${c}</span><strong>${d.r[c] !== undefined ? money(d.r[c]) : "–"}</strong></div>`)
      .join("");
    $("#mTime").textContent = "Rates last updated " + d.u;
  } catch (e) {
    grid.innerHTML = `<div class="stat"><span>Market rates</span><strong>Unavailable</strong></div>`;
    $("#mTime").textContent = e.message;
  }
}
$("#mBase").onchange = loadMarket;

/* ---------- Connection status ---------- */
function updateConnectionStatus() {
  const on = navigator.onLine;
  $("#connectionStatus").textContent = on ? "Online" : "Offline";
  $("#statusDot").classList.toggle("off", !on);
}
addEventListener("online", updateConnectionStatus);
addEventListener("offline", updateConnectionStatus);

/* ---------- Start ---------- */
show("calc");
draw();
updateConnectionStatus();
fillAll();
loadCodes();

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}