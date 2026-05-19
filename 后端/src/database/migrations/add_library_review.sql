-- 知识库审核功能迁移脚本
-- 添加审核状态字段和审核记录表

-- 添加审核状态字段
ALTER TABLE libraries 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' COMMENT '审核状态: pending-待审核, approved-审核通过, rejected-审核驳回';

-- 添加审核意见字段
ALTER TABLE libraries 
ADD COLUMN review_note TEXT COMMENT '审核意见/驳回原因';

-- 添加审核人ID字段
ALTER TABLE libraries 
ADD COLUMN reviewed_by INT COMMENT '审核人ID';

-- 添加审核时间字段
ALTER TABLE libraries 
ADD COLUMN reviewed_at DATETIME COMMENT '审核时间';

-- 添加审核状态索引
CREATE INDEX idx_library_status ON libraries(status);

-- 创建审核记录表
CREATE TABLE IF NOT EXISTS library_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    library_id INT NOT NULL COMMENT '知识库ID',
    reviewer_id INT NOT NULL COMMENT '审核人ID',
    action VARCHAR(20) NOT NULL COMMENT '审核动作: approve-通过, reject-驳回',
    note TEXT COMMENT '审核意见',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_library_id (library_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库审核记录表';

-- 将现有的公开知识库设置为已审核通过状态
UPDATE libraries 
SET status = 'approved', reviewed_at = created_at 
WHERE is_public = 1 AND status = 'pending';
