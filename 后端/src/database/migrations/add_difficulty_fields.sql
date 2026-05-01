-- 添加卡片难度评分字段
ALTER TABLE cards ADD COLUMN IF NOT EXISTS difficulty_rating DECIMAL(3,2) DEFAULT 0 COMMENT '平均难度评分(1-5)';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS difficulty_count INT DEFAULT 0 COMMENT '难度评分次数';
