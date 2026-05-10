-- 添加用户角色字段
-- 执行时间: 2026-05-09

-- 添加 role 字段到 users 表
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色: admin, user' AFTER gender;

-- 添加索引
ALTER TABLE users ADD INDEX idx_role (role);

-- 更新管理员账户的角色
UPDATE users SET role = 'admin' WHERE openid = 'admin_account';
