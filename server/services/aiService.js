// AI Analysis Engine — rule-based scoring system for stock analysis

export function analyzeStock(quoteData) {
    const scores = {};
    const strengths = [];
    const weaknesses = [];
    let totalScore = 0;
    let scoreCount = 0;

    // ---- Valuation Score ----
    if (quoteData.pe) {
        if (quoteData.pe < 15) {
            scores.valuation = 85;
            strengths.push('Attractively valued with low PE ratio');
        } else if (quoteData.pe < 25) {
            scores.valuation = 70;
            strengths.push('Reasonably valued PE ratio');
        } else if (quoteData.pe < 40) {
            scores.valuation = 50;
            weaknesses.push('Moderately high valuation — PE above 25');
        } else {
            scores.valuation = 25;
            weaknesses.push('Expensive valuation — PE above 40');
        }
        totalScore += scores.valuation;
        scoreCount++;
    }

    // ---- Growth Score ----
    if (quoteData.revenueGrowth !== null && quoteData.revenueGrowth !== undefined) {
        if (quoteData.revenueGrowth > 20) {
            scores.growth = 90;
            strengths.push(`Strong revenue growth of ${quoteData.revenueGrowth.toFixed(1)}%`);
        } else if (quoteData.revenueGrowth > 10) {
            scores.growth = 75;
            strengths.push(`Healthy revenue growth of ${quoteData.revenueGrowth.toFixed(1)}%`);
        } else if (quoteData.revenueGrowth > 0) {
            scores.growth = 55;
        } else {
            scores.growth = 25;
            weaknesses.push('Declining revenue — negative growth');
        }
        totalScore += scores.growth;
        scoreCount++;
    }

    if (quoteData.earningsGrowth !== null && quoteData.earningsGrowth !== undefined) {
        if (quoteData.earningsGrowth > 20) {
            strengths.push(`Excellent earnings growth of ${quoteData.earningsGrowth.toFixed(1)}%`);
        } else if (quoteData.earningsGrowth < -10) {
            weaknesses.push('Declining earnings');
        }
    }

    // ---- Profitability Score ----
    if (quoteData.roe !== null && quoteData.roe !== undefined) {
        if (quoteData.roe > 20) {
            scores.profitability = 90;
            strengths.push(`High Return on Equity (ROE) of ${quoteData.roe.toFixed(1)}%`);
        } else if (quoteData.roe > 12) {
            scores.profitability = 70;
            strengths.push(`Good ROE of ${quoteData.roe.toFixed(1)}%`);
        } else if (quoteData.roe > 5) {
            scores.profitability = 45;
        } else {
            scores.profitability = 20;
            weaknesses.push(`Low ROE of ${quoteData.roe?.toFixed(1)}% — poor capital efficiency`);
        }
        totalScore += scores.profitability;
        scoreCount++;
    }

    if (quoteData.profitMargin !== null && quoteData.profitMargin !== undefined) {
        if (quoteData.profitMargin > 20) {
            strengths.push(`Strong profit margins of ${quoteData.profitMargin.toFixed(1)}%`);
        } else if (quoteData.profitMargin < 5) {
            weaknesses.push('Thin profit margins');
        }
    }

    // ---- Debt Score ----
    if (quoteData.debtToEquity !== null && quoteData.debtToEquity !== undefined) {
        if (quoteData.debtToEquity < 30) {
            scores.debt = 90;
            strengths.push('Very low debt — strong balance sheet');
        } else if (quoteData.debtToEquity < 80) {
            scores.debt = 70;
            strengths.push('Moderate and manageable debt levels');
        } else if (quoteData.debtToEquity < 150) {
            scores.debt = 40;
            weaknesses.push('High debt to equity ratio');
        } else {
            scores.debt = 15;
            weaknesses.push('Very high debt — financial risk');
        }
        totalScore += scores.debt;
        scoreCount++;
    }

    // ---- Momentum Score ----
    if (quoteData.price && quoteData.fiftyTwoWeekHigh && quoteData.fiftyTwoWeekLow) {
        const range = quoteData.fiftyTwoWeekHigh - quoteData.fiftyTwoWeekLow;
        const position = range > 0 ? (quoteData.price - quoteData.fiftyTwoWeekLow) / range * 100 : 50;

        if (position > 80) {
            scores.momentum = 75;
            strengths.push('Trading near 52-week high — strong momentum');
        } else if (position > 50) {
            scores.momentum = 65;
        } else if (position > 20) {
            scores.momentum = 50;
            weaknesses.push('Trading in lower half of 52-week range');
        } else {
            scores.momentum = 35;
            weaknesses.push('Trading near 52-week low');
        }
        totalScore += scores.momentum;
        scoreCount++;
    }

    // ---- Dividend Score ----
    if (quoteData.dividendYield) {
        if (quoteData.dividendYield > 3) {
            strengths.push(`High dividend yield of ${quoteData.dividendYield.toFixed(2)}%`);
        } else if (quoteData.dividendYield > 1) {
            strengths.push(`Regular dividend payer — ${quoteData.dividendYield.toFixed(2)}% yield`);
        }
    }

    // ---- Market Cap Category ----
    if (quoteData.capCategory === 'Large Cap') {
        strengths.push('Large-cap stock — higher stability and liquidity');
    } else if (quoteData.capCategory === 'Small Cap') {
        weaknesses.push('Small-cap — higher volatility and risk');
    }

    // ---- Holdings ----
    if (quoteData.promoterHolding && quoteData.promoterHolding > 50) {
        strengths.push(`High promoter holding of ${quoteData.promoterHolding.toFixed(1)}%`);
    }
    if (quoteData.institutionalHolding && quoteData.institutionalHolding > 30) {
        strengths.push(`Strong institutional interest — ${quoteData.institutionalHolding.toFixed(1)}% holding`);
    }

    // ---- Overall Score ----
    const overallScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 50;

    // ---- Risk Level ----
    let riskLevel, riskLabel;
    if (overallScore >= 75) {
        riskLevel = 'low';
        riskLabel = 'Low Risk';
    } else if (overallScore >= 50) {
        riskLevel = 'medium';
        riskLabel = 'Medium Risk';
    } else {
        riskLevel = 'high';
        riskLabel = 'High Risk';
    }

    // ---- Investment Horizon ----
    let investmentSuggestion, investmentDetail;
    if (overallScore >= 80) {
        investmentSuggestion = 'Strong Buy — Good for Long Term';
        investmentDetail = 'This stock shows strong fundamentals with healthy growth, good profitability, and manageable debt. Suitable for long-term wealth creation.';
    } else if (overallScore >= 65) {
        investmentSuggestion = 'Good for Long Term & Mid Term';
        investmentDetail = 'Solid fundamentals with reasonable valuation. Can be considered for medium to long-term holding periods.';
    } else if (overallScore >= 50) {
        investmentSuggestion = 'Consider for Mid Term';
        investmentDetail = 'Average fundamentals. May work for medium-term trades but carries moderate risk. Do additional research.';
    } else if (overallScore >= 35) {
        investmentSuggestion = 'Short Term Only — Exercise Caution';
        investmentDetail = 'Fundamentals are below average. Only suitable for short-term momentum plays with strict stop-loss.';
    } else {
        investmentSuggestion = 'Avoid for Now';
        investmentDetail = 'Weak fundamentals and/or high valuation. Consider waiting for improved metrics before investing.';
    }

    // ---- Trend ----
    let trend;
    if (quoteData.changePercent > 2) trend = 'Strong Uptrend';
    else if (quoteData.changePercent > 0) trend = 'Mild Uptrend';
    else if (quoteData.changePercent > -2) trend = 'Mild Downtrend';
    else trend = 'Strong Downtrend';

    // ---- Sentiment (simulated) ----
    const bullish = Math.min(95, Math.max(20, overallScore + Math.floor(Math.random() * 10) - 5));
    const bearish = 100 - bullish;

    return {
        overallScore,
        scores,
        riskLevel,
        riskLabel,
        trend,
        investmentSuggestion,
        investmentDetail,
        strengths: strengths.slice(0, 6),
        weaknesses: weaknesses.slice(0, 6),
        sentiment: { bullish, bearish },
        disclaimer: 'This analysis is generated by an automated system and is for educational purposes only. It does not constitute financial advice. Always consult with a qualified financial advisor before making investment decisions.',
    };
}
