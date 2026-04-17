-- 更新 card_mastery 表结构，添加艾宾浩斯复习功能所需字段
-- 此脚本不会清空数据，只会添加新字段

-- 添加复习次数字段
ALTER TABLE card_mastery 
ADD COLUMN review_count INT DEFAULT 0;

-- 添加下次复习日期字段
ALTER TABLE card_mastery 
ADD COLUMN next_review_date DATE;

-- 添加上次复习日期字段
ALTER TABLE card_mastery 
ADD COLUMN last_review_date DATE;

-- 添加索引以提高查询性能
CREATE INDEX idx_next_review ON card_mastery(next_review_date);

-- 为已掌握的卡片初始化复习数据
-- 将 mastered = 1 的卡片设置下次复习日期为今天，以便立即开始复习
UPDATE card_mastery 
SET 
    review_count = 1,
    next_review_date = CURDATE(),
    last_review_date = CURDATE()
WHERE mastered = 1 
AND next_review_date IS NULL;
