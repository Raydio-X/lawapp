const db = require('../config/database');

class BM25Engine {
    constructor(options = {}) {
        this.k1 = options.k1 || 1.5;
        this.b = options.b || 0.75;
        this.k3 = options.k3 || 8;
        this.avgdl = 0;
        this.docCount = 0;
        this.df = {};
        this.idf = {};
        this.docLen = {};
        this.tf = {};
        this.docOwners = {};
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await db.query(
            'SELECT id, question, answer, created_by FROM cards WHERE is_public = 1'
        );

        this.docCount = rows.length;
        let totalLen = 0;

        for (const row of rows) {
            const tokens = this.tokenize(`${row.question} ${row.answer}`);
            this.docLen[row.id] = tokens.length;
            totalLen += tokens.length;

            const termFreq = {};
            for (const token of tokens) {
                termFreq[token] = (termFreq[token] || 0) + 1;
            }
            this.tf[row.id] = termFreq;
            this.docOwners[row.id] = row.created_by;

            for (const term of Object.keys(termFreq)) {
                this.df[term] = (this.df[term] || 0) + 1;
            }
        }

        this.avgdl = this.docCount > 0 ? totalLen / this.docCount : 1;

        for (const term of Object.keys(this.df)) {
            this.idf[term] = Math.log(
                (this.docCount - this.df[term] + 0.5) /
                (this.df[term] + 0.5) +
                1
            );
        }

        this.initialized = true;
    }

    tokenize(text) {
        if (!text) return [];
        return text
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 0)
            .flatMap(word => {
                const chinese = word.match(/[\u4e00-\u9fa5]+/g);
                const nonChinese = word.replace(/[\u4e00-\u9fa5]+/g, ' ').trim();
                const result = [];
                if (chinese) {
                    for (const seg of chinese) {
                        for (let i = 0; i < seg.length - 1; i++) {
                            result.push(seg.substring(i, i + 2));
                        }
                        if (seg.length === 1) result.push(seg);
                    }
                }
                if (nonChinese) {
                    result.push(nonChinese.toLowerCase());
                }
                return result;
            })
            .filter(w => w.length >= 2);
    }

    async search(query, excludeIds = [], excludeUserId = null, limit = 10) {
        await this.initialize();

        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) return [];

        const queryTermFreq = {};
        for (const token of queryTokens) {
            queryTermFreq[token] = (queryTermFreq[token] || 0) + 1;
        }

        const scores = {};
        for (const docId of Object.keys(this.tf)) {
            if (excludeIds.includes(parseInt(docId))) continue;
            if (excludeUserId && this.docOwners[docId] === excludeUserId) continue;

            let score = 0;
            const docTf = this.tf[docId];
            const dl = this.docLen[docId];

            for (const term of Object.keys(queryTermFreq)) {
                if (!docTf[term] || !this.idf[term]) continue;

                const tf = docTf[term];
                const qtf = queryTermFreq[term];
                const idf = this.idf[term];

                const numerator = tf * (this.k1 + 1);
                const denominator = tf + this.k1 * (1 - this.b + this.b * (dl / this.avgdl));
                const docScore = idf * (numerator / denominator);

                const qScore = ((this.k3 + 1) * qtf) / (this.k3 + qtf);

                score += docScore * qScore;
            }

            if (score > 0) {
                scores[docId] = score;
            }
        }

        return Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id, score]) => ({ id: parseInt(id), score }));
    }

    async updateParams(k1, b, k3) {
        if (k1 !== undefined) this.k1 = k1;
        if (b !== undefined) this.b = b;
        if (k3 !== undefined) this.k3 = k3;
        this.idf = {};
        for (const term of Object.keys(this.df)) {
            this.idf[term] = Math.log(
                (this.docCount - this.df[term] + 0.5) /
                (this.df[term] + 0.5) +
                1
            );
        }
    }

    async invalidateCache() {
        this.initialized = false;
        this.avgdl = 0;
        this.docCount = 0;
        this.df = {};
        this.idf = {};
        this.docLen = {};
        this.tf = {};
        this.docOwners = {};
    }

    getParams() {
        return {
            k1: this.k1,
            b: this.b,
            k3: this.k3,
            avgdl: this.avgdl,
            docCount: this.docCount,
            initialized: this.initialized
        };
    }
}

const bm25Engine = new BM25Engine();

module.exports = bm25Engine;
