// Cost arithmetic shared by the interactive calculator.
export function economics(values = {}) {
  const bounded = (key,fallback,max) => {
    const value=Number(values[key] ?? fallback);
    return Number.isFinite(value)?Math.max(0,Math.min(max,value)):fallback;
  };
  const tasks=bounded('tasks',120,100000), before=bounded('before',8,1440), review=bounded('review',3,1440), hourly=bounded('hourly',30,10000), tool=bounded('tool',49,100000);
  const hours=tasks*(before-review)/60;
  return {hours, value:hours*hourly-tool, inputs:{tasks,before,review,hourly,tool}};
}
