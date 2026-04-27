class ResultFusion {
    constructor(options = {}) {
        this.bm25Weight = options.bm25Weight || 0.6;
        this.embeddingWeight = options.embeddingWeight || 0.3;
        this.tagWeight = options.tagWeight || 0.1;
        this.minBM25Score = options.minBM25Score || 0.1;
        this.minEmbeddingScore = options.minEmbeddingScore || 0.05;
        this.strategy = options.strategy || 'weighted';
    }

    fuse(bm25Results, embeddingResults, tagResults = []) {
        if (this.strategy === 'rrf') {
            return this.reciprocalRankFusion([bm25Results, embeddingResults, tagResults]);
        }
        return this.weightedFusion(bm25Results, embeddingResults, tagResults);
    }

    weightedFusion(bm25Results, embeddingResults, tagResults) {
        const scoreMap = new Map();

        const maxBM25 = Math.max(...bm25Results.map(r => r.score), 1);
        for (const result of bm25Results) {
            if (result.score < this.minBM25Score) continue;
            const normalized = result.score / maxBM25;
            scoreMap.set(result.id, {
                bm25Score: normalized,
                embeddingScore: 0,
                tagScore: 0,
                totalScore: normalized * this.bm25Weight
            });
        }

        const maxEmbedding = Math.max(...embeddingResults.map(r => r.score), 1);
        for (const result of embeddingResults) {
            if (result.score < this.minEmbeddingScore) continue;
            const normalized = result.score / maxEmbedding;
            if (scoreMap.has(result.id)) {
                const existing = scoreMap.get(result.id);
                existing.embeddingScore = normalized;
                existing.totalScore += normalized * this.embeddingWeight;
            } else {
                scoreMap.set(result.id, {
                    bm25Score: 0,
                    embeddingScore: normalized,
                    tagScore: 0,
                    totalScore: normalized * this.embeddingWeight
                });
            }
        }

        const maxTag = Math.max(...tagResults.map(r => r.score || 1), 1);
        for (const result of tagResults) {
            const normalized = (result.score || 1) / maxTag;
            if (scoreMap.has(result.id)) {
                const existing = scoreMap.get(result.id);
                existing.tagScore = normalized;
                existing.totalScore += normalized * this.tagWeight;
            } else {
                scoreMap.set(result.id, {
                    bm25Score: 0,
                    embeddingScore: 0,
                    tagScore: normalized,
                    totalScore: normalized * this.tagWeight
                });
            }
        }

        return [...scoreMap.entries()]
            .map(([id, scores]) => ({
                id,
                score: scores.totalScore,
                bm25Score: scores.bm25Score,
                embeddingScore: scores.embeddingScore,
                tagScore: scores.tagScore
            }))
            .sort((a, b) => b.score - a.score);
    }

    reciprocalRankFusion(resultLists, k = 60) {
        const scoreMap = new Map();

        for (const results of resultLists) {
            if (!results || results.length === 0) continue;
            results.forEach((result, rank) => {
                const rrfScore = 1 / (k + rank + 1);
                if (scoreMap.has(result.id)) {
                    const existing = scoreMap.get(result.id);
                    existing.score += rrfScore;
                    existing.sources += 1;
                } else {
                    scoreMap.set(result.id, {
                        id: result.id,
                        score: rrfScore,
                        sources: 1
                    });
                }
            });
        }

        return [...scoreMap.values()]
            .sort((a, b) => b.score - a.score);
    }

    updateWeights(bm25Weight, embeddingWeight, tagWeight) {
        const total = (bm25Weight || this.bm25Weight) +
                      (embeddingWeight || this.embeddingWeight) +
                      (tagWeight || this.tagWeight);

        if (bm25Weight !== undefined) this.bm25Weight = bm25Weight / total;
        if (embeddingWeight !== undefined) this.embeddingWeight = embeddingWeight / total;
        if (tagWeight !== undefined) this.tagWeight = tagWeight / total;
    }

    setStrategy(strategy) {
        if (['weighted', 'rrf'].includes(strategy)) {
            this.strategy = strategy;
        }
    }

    getConfig() {
        return {
            strategy: this.strategy,
            weights: {
                bm25: this.bm25Weight,
                embedding: this.embeddingWeight,
                tag: this.tagWeight
            },
            thresholds: {
                minBM25Score: this.minBM25Score,
                minEmbeddingScore: this.minEmbeddingScore
            }
        };
    }
}

const resultFusion = new ResultFusion();

module.exports = resultFusion;
