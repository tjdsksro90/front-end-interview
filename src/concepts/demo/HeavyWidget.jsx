// React.lazy 데모용: 이 파일은 버튼을 눌렀을 때 별도 청크(JS 파일)로 다운로드된다.
const DATA = [42, 68, 35, 90, 57, 73, 28, 81, 64, 49, 95, 38];
const MONTHS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function HeavyWidget() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="font-semibold">📊 월별 매출 차트 (lazy 로딩된 컴포넌트)</span>
        <span className="text-xs text-zinc-400">HeavyWidget.jsx</span>
      </div>
      <div className="mt-4 flex h-40 items-end gap-1.5">
        {DATA.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-indigo-500/80 dark:bg-indigo-400/80" style={{ height: `${v}%` }} />
            <span className="text-[10px] text-zinc-400">{MONTHS[i]}월</span>
          </div>
        ))}
      </div>
    </div>
  );
}
