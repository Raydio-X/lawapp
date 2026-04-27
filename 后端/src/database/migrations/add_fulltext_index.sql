-- 添加全文索引以支持派生学习功能
-- 基于内容的文本相似度搜索

-- 为cards表的question和answer字段添加全文索引
ALTER TABLE cards ADD FULLTEXT INDEX ft_question_answer (question, answer);

-- 说明：
-- 1. 全文索引支持自然语言搜索模式
-- 2. 可以使用 MATCH(question, answer) AGAINST('关键词' IN NATURAL LANGUAGE_MODE) 进行搜索
-- 3. 返回结果会按照相关性得分排序
