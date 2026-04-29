const BlockedWordModel = require('../models/BlockedWord');

class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEnd = false;
    }
}

class SensitiveWordFilter {
    constructor() {
        this.trie = new TrieNode();
        this.initialized = false;
        this.lastRefreshTime = 0;
        this.cacheExpiry = 5 * 60 * 1000;
    }

    async init() {
        if (this.initialized) return;
        await this.refresh();
        this.initialized = true;
    }

    async refresh() {
        const words = await BlockedWordModel.getAll();
        this.buildTrie(words);
        this.lastRefreshTime = Date.now();
    }

    buildTrie(words) {
        this.trie = new TrieNode();
        for (const word of words) {
            this.insert(word);
        }
    }

    insert(word) {
        let node = this.trie;
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char);
        }
        node.isEnd = true;
    }

    async checkRefresh() {
        if (Date.now() - this.lastRefreshTime > this.cacheExpiry) {
            await this.refresh();
        }
    }

    async contains(text) {
        await this.checkRefresh();
        
        for (let i = 0; i < text.length; i++) {
            let node = this.trie;
            let j = i;
            
            while (j < text.length && node.children.has(text[j])) {
                node = node.children.get(text[j]);
                j++;
                
                if (node.isEnd) {
                    return {
                        hasSensitive: true,
                        word: text.substring(i, j)
                    };
                }
            }
        }
        
        return { hasSensitive: false, word: null };
    }

    async findAll(text) {
        await this.checkRefresh();
        
        const found = [];
        for (let i = 0; i < text.length; i++) {
            let node = this.trie;
            let j = i;
            
            while (j < text.length && node.children.has(text[j])) {
                node = node.children.get(text[j]);
                j++;
                
                if (node.isEnd) {
                    found.push({
                        word: text.substring(i, j),
                        start: i,
                        end: j
                    });
                }
            }
        }
        
        return found;
    }

    async filter(text, replacement = '*') {
        await this.checkRefresh();
        
        const chars = text.split('');
        
        for (let i = 0; i < chars.length; i++) {
            let node = this.trie;
            let j = i;
            let matchEnd = -1;
            
            while (j < chars.length && node.children.has(chars[j])) {
                node = node.children.get(chars[j]);
                j++;
                
                if (node.isEnd) {
                    matchEnd = j;
                }
            }
            
            if (matchEnd > 0) {
                for (let k = i; k < matchEnd; k++) {
                    chars[k] = replacement;
                }
                i = matchEnd - 1;
            }
        }
        
        return chars.join('');
    }
}

const sensitiveWordFilter = new SensitiveWordFilter();

module.exports = sensitiveWordFilter;
