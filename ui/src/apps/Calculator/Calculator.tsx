import { useState } from 'react';
import './Calculator.css';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev]     = useState<string | null>(null);
  const [op, setOp]         = useState<string | null>(null);
  const [fresh, setFresh]   = useState(false);

  const calc = (a: number, b: number, o: string): number => {
    switch (o) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const formatNum = (n: number): string => {
    const s = parseFloat(n.toPrecision(12)).toString();
    return s.length > 12 ? n.toExponential(6) : s;
  };

  const press = (btn: string) => {
    if (btn === 'C') {
      setDisplay('0'); setPrev(null); setOp(null); setFresh(false); return;
    }
    if (btn === '⌫') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0'); return;
    }
    if (btn === '±') {
      setDisplay((parseFloat(display) * -1).toString()); return;
    }
    if (btn === '%') {
      setDisplay((parseFloat(display) / 100).toString()); return;
    }
    if (['+', '−', '×', '÷'].includes(btn)) {
      if (op && !fresh) {
        const result = calc(parseFloat(prev!), parseFloat(display), op);
        setPrev(formatNum(result));
        setDisplay(formatNum(result));
      } else {
        setPrev(display);
      }
      setOp(btn); setFresh(true); return;
    }
    if (btn === '=') {
      if (!op || !prev) return;
      const result = calc(parseFloat(prev), parseFloat(display), op);
      setDisplay(formatNum(result));
      setPrev(null); setOp(null); setFresh(false); return;
    }
    if (btn === '.') {
      const cur = fresh ? '0' : display;
      if (!cur.includes('.')) {
        setDisplay(cur + '.'); setFresh(false);
      }
      return;
    }
    // Digit
    if (fresh || display === '0') {
      setDisplay(btn); setFresh(false);
    } else {
      if (display.replace('-', '').replace('.', '').length < 10) {
        setDisplay(display + btn);
      }
    }
  };

  const isOp = (btn: string) => ['+', '−', '×', '÷'].includes(btn);

  return (
    <div className="calc">
      <div className="calc__display">
        {op && prev && (
          <div className="calc__display-sub">{prev} {op}</div>
        )}
        <div className="calc__display-main">{display}</div>
      </div>
      <div className="calc__grid">
        {BUTTONS.flat().map((btn, i) => (
          <button
            key={i}
            className={[
              'calc__btn',
              btn === '=' ? 'calc__btn--eq' : '',
              isOp(btn) ? 'calc__btn--op' : '',
              ['C', '±', '%'].includes(btn) ? 'calc__btn--fn' : '',
              btn === '0' ? 'calc__btn--zero' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => press(btn)}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
