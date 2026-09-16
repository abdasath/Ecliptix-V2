const fs = require('fs');
let css = fs.readFileSync('frontend/css/style.css', 'utf8');

const oldCSS = `.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
}

.empty-state p {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
}`;

const newCSS = `.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    max-width: 600px;
    margin: 2rem auto;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
}

.empty-state-icon {
    font-size: 5rem;
    color: #00ff88; /* Neon green matching your theme */
    margin-bottom: 1.5rem;
    display: inline-block;
    text-shadow: 0 0 20px rgba(0, 255, 136, 0.4);
}

.empty-state-title {
    font-size: 2rem;
    color: #ffffff;
    margin-bottom: 1rem;
    font-weight: 700;
}

.empty-state-desc {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    line-height: 1.6;
    color: #a1a1aa;
}`;

css = css.replace(oldCSS, newCSS);
fs.writeFileSync('frontend/css/style.css', css);
