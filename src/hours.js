import { MenuError } from './menu-model.js';

export const dayNames = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const dayShort = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const schemaDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timePattern = /^([01]?\d|2[0-3]):([0-5]\d)$/;

const day = (open, close) => ({ open, close, closed: false });
export const defaultHours = [
  day('07:30', '18:00'), day('07:30', '18:00'), day('07:30', '18:00'), day('07:30', '18:00'), day('07:30', '18:00'),
  day('08:00', '18:00'), day('08:00', '16:00'),
];

export function normalizeHours(input = defaultHours) {
  if (!Array.isArray(input) || input.length !== 7) throw new MenuError('Otevírací doba musí mít právě 7 dní.');
  return input.map((value, index) => {
    if (!value || typeof value !== 'object') throw new MenuError('Neplatný den otevírací doby.');
    if (value.closed != null && typeof value.closed !== 'boolean') throw new MenuError('Neplatná hodnota přepínače zavřeno.');
    if (value.closed) return { open: '', close: '', closed: true };
    const parse = (time, name) => {
      const match = timePattern.exec(String(time ?? '').trim());
      if (!match) throw new MenuError(`${dayNames[index]}: ${name} zadejte ve formátu 7:30.`);
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    };
    const open = parse(value.open, 'otevření');
    const close = parse(value.close, 'zavření');
    if (open >= close) throw new MenuError(`${dayNames[index]}: zavření musí být po otevření.`);
    return { open, close, closed: false };
  });
}

const groups = (hours) => hours.reduce((result, value, index) => {
  const key = value.closed ? 'closed' : `${value.open}-${value.close}`;
  const last = result.at(-1);
  if (last?.key === key) last.to = index;
  else result.push({ key, from: index, to: index, day: value });
  return result;
}, []);

const display = (time) => time.replace(/^0/, '');
const label = (from, to) => from === to ? dayShort[from] : `${dayShort[from]}–${dayShort[to]}`;

export function renderHours(hours) {
  return groups(hours).map(({ from, to, day: value }) => `<span>${label(from, to)} <b>${value.closed ? 'zavřeno' : `${display(value.open)}–${display(value.close)}`}</b></span>`).join('');
}

export function hoursSpecification(hours) {
  return groups(hours).filter(({ day: value }) => !value.closed).map(({ from, to, day: value }) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: Array.from({ length: to - from + 1 }, (_, index) => `https://schema.org/${schemaDays[from + index]}`),
    opens: value.open,
    closes: value.close,
  }));
}
