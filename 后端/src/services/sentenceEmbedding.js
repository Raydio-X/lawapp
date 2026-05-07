const db = require('../config/database');

class SentenceEmbedding {
    constructor(options = {}) {
        this.vectorSize = options.vectorSize || 128;
        this.vocabulary = {};
        this.vocabSize = 0;
        this.idfWeights = {};
        this.docVectors = {};
        this.docOwners = {};
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await db.query(
            'SELECT id, question, answer, tags, created_by FROM cards WHERE is_public = 1'
        );

        const docCount = rows.length;
        const allTokens = new Map();

        for (const row of rows) {
            const tokens = this.tokenize(`${row.question} ${row.answer}`);
            const uniqueTokens = new Set(tokens);

            for (const token of uniqueTokens) {
                allTokens.set(token, (allTokens.get(token) || 0) + 1);
            }

            const tagTokens = this.extractTagTokens(row.tags);
            for (const token of tagTokens) {
                allTokens.set(token, (allTokens.get(token) || 0) + 1);
            }
        }

        const sortedTokens = [...allTokens.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.vectorSize * 2);

        this.vocabulary = {};
        sortedTokens.forEach(([token], idx) => {
            this.vocabulary[token] = idx;
        });
        this.vocabSize = sortedTokens.length;

        for (const [token, df] of allTokens) {
            this.idfWeights[token] = Math.log((docCount + 1) / (df + 1)) + 1;
        }

        for (const row of rows) {
            this.docVectors[row.id] = this.encodeDocument(row);
            this.docOwners[row.id] = row.created_by;
        }

        this.initialized = true;
    }

    extractTagTokens(tagsData) {
        let tags = [];
        try {
            tags = typeof tagsData === 'string' ? JSON.parse(tagsData) : (tagsData || []);
        } catch (e) {
            tags = [];
        }
        return tags.map(t => `TAG_${t}`);
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

    encodeDocument(doc) {
        const vector = new Float32Array(this.vocabSize);

        const tokens = this.tokenize(`${doc.question} ${doc.answer}`);
        const tagTokens = this.extractTagTokens(doc.tags);
        const allTokens = [...tokens, ...tagTokens];

        const termFreq = {};
        for (const token of allTokens) {
            termFreq[token] = (termFreq[token] || 0) + 1;
        }

        for (const [token, freq] of Object.entries(termFreq)) {
            const idx = this.vocabulary[token];
            if (idx !== undefined) {
                const tf = freq / allTokens.length;
                const idf = this.idfWeights[token] || 1;
                vector[idx] = tf * idf;
            }
        }

        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }

        return vector;
    }

    encodeQuery(queryText, tags = []) {
        const vector = new Float32Array(this.vocabSize);

        const tokens = this.tokenize(queryText);
        const tagTokens = tags.map(t => `TAG_${t}`);
        const allTokens = [...tokens, ...tagTokens];

        const termFreq = {};
        for (const token of allTokens) {
            termFreq[token] = (termFreq[token] || 0) + 1;
        }

        for (const [token, freq] of Object.entries(termFreq)) {
            const idx = this.vocabulary[token];
            if (idx !== undefined) {
                const tf = freq / allTokens.length;
                const idf = this.idfWeights[token] || 1;
                vector[idx] = tf * idf;
            }
        }

        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }

        return vector;
    }

    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        const len = Math.min(vecA.length, vecB.length);
        for (let i = 0; i < len; i++) {
            dotProduct += vecA[i] * vecB[i];
        }
        return dotProduct;
    }

    async search(queryText, tags = [], excludeIds = [], excludeUserId = null, limit = 10) {
        await this.initialize();

        const queryVector = this.encodeQuery(queryText, tags);
        const queryNorm = Math.sqrt(queryVector.reduce((sum, v) => sum + v * v, 0));
        if (queryNorm === 0) return [];

        const scores = [];
        for (const [docId, docVector] of Object.entries(this.docVectors)) {
            if (excludeIds.includes(parseInt(docId))) continue;
            if (excludeUserId && this.docOwners[docId] === excludeUserId) continue;

            const similarity = this.cosineSimilarity(queryVector, docVector);
            if (similarity > 0.01) {
                scores.push({ id: parseInt(docId), score: similarity });
            }
        }

        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    async invalidateCache() {
        this.initialized = false;
        this.vocabulary = {};
        this.vocabSize = 0;
        this.idfWeights = {};
        this.docVectors = {};
        this.docOwners = {};
    }

    getStatus() {
        return {
            initialized: this.initialized,
            vocabSize: this.vocabSize,
            vectorSize: this.vectorSize,
            docCount: Object.keys(this.docVectors).length
        };
    }
}

const sentenceEmbedding = new SentenceEmbedding();

module.exports = sentenceEmbedding;
