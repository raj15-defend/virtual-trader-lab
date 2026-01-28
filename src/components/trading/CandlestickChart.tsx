import { useMemo } from 'react';
import { OHLCVData } from '@/types/trading';

interface CandlestickChartProps {
  data: OHLCVData[];
  showVolume?: boolean;
  showMA?: boolean;
  height?: number;
}

export const CandlestickChart = ({ 
  data, 
  showVolume = true, 
  showMA = true,
  height = 300 
}: CandlestickChartProps) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const maxVolume = Math.max(...data.map(d => d.volume));

    // Calculate Moving Averages
    const calculateMA = (period: number) => {
      return data.map((_, i) => {
        if (i < period - 1) return null;
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        return sum / period;
      });
    };

    const ma7 = showMA ? calculateMA(7) : [];
    const ma20 = showMA ? calculateMA(20) : [];

    return {
      candles: data,
      minPrice,
      maxPrice,
      priceRange,
      maxVolume,
      ma7,
      ma20,
    };
  }, [data, showMA]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No data available
      </div>
    );
  }

  const chartHeight = showVolume ? height * 0.7 : height;
  const volumeHeight = showVolume ? height * 0.25 : 0;
  const candleWidth = Math.max(4, Math.min(12, 800 / data.length - 2));
  const gap = 2;

  const scaleY = (price: number) => {
    return chartHeight - ((price - chartData.minPrice) / chartData.priceRange) * chartHeight * 0.9 - chartHeight * 0.05;
  };

  const scaleVolumeY = (volume: number) => {
    return volumeHeight - (volume / chartData.maxVolume) * volumeHeight * 0.9;
  };

  return (
    <div className="w-full" style={{ height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${data.length * (candleWidth + gap)} ${height}`} preserveAspectRatio="none">
        {/* Price grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const price = chartData.minPrice + chartData.priceRange * ratio;
          const y = scaleY(price);
          return (
            <g key={ratio}>
              <line
                x1={0}
                y1={y}
                x2={data.length * (candleWidth + gap)}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
              <text
                x={5}
                y={y - 5}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="JetBrains Mono"
              >
                ₹{price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* MA Lines */}
        {showMA && chartData.ma7.length > 0 && (
          <path
            d={chartData.ma7
              .map((ma, i) => {
                if (ma === null) return '';
                const x = i * (candleWidth + gap) + candleWidth / 2;
                const y = scaleY(ma);
                return `${i === 0 || chartData.ma7[i - 1] === null ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(43, 96%, 56%)"
            strokeWidth={1.5}
            opacity={0.8}
          />
        )}

        {showMA && chartData.ma20.length > 0 && (
          <path
            d={chartData.ma20
              .map((ma, i) => {
                if (ma === null) return '';
                const x = i * (candleWidth + gap) + candleWidth / 2;
                const y = scaleY(ma);
                return `${i === 0 || chartData.ma20[i - 1] === null ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={1.5}
            opacity={0.8}
          />
        )}

        {/* Candlesticks */}
        {data.map((candle, i) => {
          const x = i * (candleWidth + gap);
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? 'hsl(var(--profit))' : 'hsl(var(--loss))';

          const bodyTop = scaleY(Math.max(candle.open, candle.close));
          const bodyBottom = scaleY(Math.min(candle.open, candle.close));
          const bodyHeight = Math.max(1, bodyBottom - bodyTop);

          const wickTop = scaleY(candle.high);
          const wickBottom = scaleY(candle.low);

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x + candleWidth / 2}
                y1={wickTop}
                x2={x + candleWidth / 2}
                y2={wickBottom}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isGreen ? color : color}
                stroke={color}
                strokeWidth={1}
              />
            </g>
          );
        })}

        {/* Volume Bars */}
        {showVolume && (
          <g transform={`translate(0, ${chartHeight + 10})`}>
            {data.map((candle, i) => {
              const x = i * (candleWidth + gap);
              const isGreen = candle.close >= candle.open;
              const color = isGreen ? 'hsl(var(--profit))' : 'hsl(var(--loss))';
              const barHeight = volumeHeight - scaleVolumeY(candle.volume);

              return (
                <rect
                  key={i}
                  x={x}
                  y={volumeHeight - barHeight}
                  width={candleWidth}
                  height={barHeight}
                  fill={color}
                  opacity={0.5}
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Legend */}
      {showMA && (
        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[hsl(43,96%,56%)]" />
            <span className="text-muted-foreground">MA7</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-[hsl(217,91%,60%)]" />
            <span className="text-muted-foreground">MA20</span>
          </div>
        </div>
      )}
    </div>
  );
};
