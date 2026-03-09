import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import './Charts.css';

const RANGES = [
    { label: '1D', value: '1d' },
    { label: '1W', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '1Y', value: '1y' },
    { label: '5Y', value: '5y' },
];

export default function PriceChart({ data, onRangeChange, activeRange = '1mo', height = 400 }) {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: isDark ? '#94a3b8' : '#64748b',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
            },
            grid: {
                vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
                horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            crosshair: {
                mode: 0,
                vertLine: {
                    labelBackgroundColor: '#6366f1',
                },
                horzLine: {
                    labelBackgroundColor: '#6366f1',
                },
            },
            rightPriceScale: {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            },
            timeScale: {
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                timeVisible: activeRange === '1d' || activeRange === '5d',
                secondsVisible: false,
            },
            handleScroll: { vertTouchDrag: false },
        });

        // Determine color based on price direction
        const firstPrice = data[0]?.close || data[0]?.open || 0;
        const lastPrice = data[data.length - 1]?.close || 0;
        const isPositive = lastPrice >= firstPrice;
        const lineColor = isPositive ? '#10b981' : '#ef4444';
        const areaTop = isPositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
        const areaBottom = 'transparent';

        // Area series
        const areaSeries = chart.addAreaSeries({
            lineColor,
            topColor: areaTop,
            bottomColor: areaBottom,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            crosshairMarkerBackgroundColor: lineColor,
        });

        areaSeries.setData(data.map(d => ({
            time: d.time,
            value: d.close,
        })));

        // Volume
        const volumeSeries = chart.addHistogramSeries({
            color: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });

        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.85, bottom: 0 },
        });

        volumeSeries.setData(data.filter(d => d.volume).map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open
                ? 'rgba(16,185,129,0.3)'
                : 'rgba(239,68,68,0.3)',
        })));

        chart.timeScale().fitContent();
        chartRef.current = chart;

        // Resize handler
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        // Theme observer
        const observer = new MutationObserver(() => {
            const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
            chart.applyOptions({
                layout: {
                    textColor: nowDark ? '#94a3b8' : '#64748b',
                },
                grid: {
                    vertLines: { color: nowDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
                    horzLines: { color: nowDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
                },
            });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            chart.remove();
        };
    }, [data, height, activeRange]);

    return (
        <div className="price-chart-wrapper">
            <div className="chart-controls">
                <div className="chart-range-selector">
                    {RANGES.map(r => (
                        <button
                            key={r.value}
                            className={`range-btn ${activeRange === r.value ? 'active' : ''}`}
                            onClick={() => onRangeChange?.(r.value)}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            <div ref={chartContainerRef} className="chart-container" />
        </div>
    );
}
