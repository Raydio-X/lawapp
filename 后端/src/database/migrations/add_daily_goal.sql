-- 添加用户每日学习目标字段
-- 此脚本不会清空数据，只会添加新字段

ALTER TABLE users 
ADD COLUMN daily_goal INT DEFAULT 50;

-- 为已存在的用户设置默认值
UPDATE users 
SET daily_goal = 50 
WHERE daily_goal IS NULL;
